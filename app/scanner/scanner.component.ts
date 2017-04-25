import { Component, OnInit, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { LoginService, alert } from "../shared";
import { TicketService } from './ticket.service';
import { BarcodeScanner} from "nativescript-barcodescanner";
import {CouchbaseInstance} from "../shared/couchbaseinstance";
import { Page } from "ui/page";
import * as dialogs from "ui/dialogs";

let applicationSettings = require("application-settings");

@Component({
    selector: "first",
    templateUrl: "scanner/scanner.component.html",
    styleUrls: ["scanner/scanner-common.css"],
    providers: [TicketService, BarcodeScanner/*, CouchbaseInstance*/]
})

export class ScannerComponent implements OnInit {
    private database: any;

    isLoading: boolean;
    offline: boolean;
    switchFlash:boolean;
    status: string;
    errorMessage: string;
    message: string;
    tribune: string;
    role: string;
    count: number;
    tribunes: string[];
    tickets: any[];
    ticket: {};
    sectorsInVip: string[];

    constructor(private router: Router,
                private loginService: LoginService,
                private barcodeScanner: BarcodeScanner,
                private ticketService: TicketService,
                private ngZone: NgZone,
                private couchbaseInstance: CouchbaseInstance,
                private page: Page) {
        this.ngZone = ngZone;
        this.offline = false;
        this.switchFlash = false;
        this.tickets = [];
        this.isLoading = false;
        this.role = '';
        this.count = 0;
        this.tribune = '';
        this.tribunes = ['east', 'west', 'north', 'vip'];
        this.sectorsInVip = ['VIP_B', 'VIP_BR', 'VIP_BL', 'VIP_AR', 'VIP_AL', 'SB_1', 'SB_7'];
        this.database = couchbaseInstance.getDatabase();

        couchbaseInstance.startSync(true);

        this.database.addDatabaseChangeListener((changes) => {
            let changeIndex;
            for (let i = 0; i < changes.length; i++) {
                console.log('documentId', changes[i]._id);
                let documentId = changes[i].getDocumentId();
                changeIndex = this.indexOfObjectId(documentId, this.tickets);
                let document = this.database.getDocument(documentId);
                this.ngZone.run(() => {
                    if (changeIndex == -1) {
                        this.tickets.push(document);
                    } else {
                        this.tickets[changeIndex] = document;
                    }
                });
            }
        });

        this.refreshTickets();
    }

    ngOnInit() {
        this.initTicketInfo();
        this.getUser();
        this.loadTicketsForCheck();

        this.page.actionBarHidden = true;
    }

    initTicketInfo() {
        this.message = '';
        this.status = '';
        this.ticket = {};
    }

    displaySelectTribuneDialog() {
        let options = {
            title: "Выберите трибуну",
            message: "Choose your race",
            actions: ['Восточная', 'Западная', 'Северная', 'VIP']
        };
        dialogs.action(options).then((result) => {
            this.tribune = result ? result : '';
            console.log("result " , result, this.translate(result) );
            if (result) {
                this.message = '';
                this.getCountTicketsByTribune( this.translate(result) );
            } else {
                this.count = 0;
            }
        });
    }

    scan() {
        if (!this.tribune) {
            this.message = 'Выберите трибуну.';
            return;
        }
        this.initTicketInfo();
        this.barcodeScanner = new BarcodeScanner();
        this.barcodeScanner.scan({
            formats: "CODE_128",   // Pass in of you want to restrict scanning to certain types
            message: "Use the volume buttons for extra light", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
            beepOnScan: true,            // Play or Suppress beep on scan (default true)
            torchOn: this.switchFlash,               // launch with the flashlight on (default false)
            resultDisplayDuration: 0   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
        }).then( (result) => {
                this.changeLoadingStatus(true);
                //
                // if (!this.offline) {
                //     this.checkTicketOnline(result.text);
                // } else {
                    this.checkTicketOffline(result.text);
                // }
            },
            (error) => {
                this.changeLoadingStatus(false);
                console.log("No scan: " + error);
            }
        );
    }

    getUser() {
        this.ticketService
            .loadUser()
            .subscribe(
                user => {
                    this.role = user.role;
                    if (this.role !== 'steward') {
                            this.message = 'У вас должны быть права стюарда.';
                    }
                },
                error =>  this.errorMessage = <any>error);
    }

    loadTicketsForCheck() {
        this.ticketService
            .loadTickets()
            .subscribe(
                tickets => {
                    console.log('tickets count', tickets.length);
                    applicationSettings.setString("tickets", JSON.stringify(tickets));
                },
                error =>  this.errorMessage = <any>error
            );
    }

    toggleFlashLights() {
        this.switchFlash = !this.switchFlash;
    }

    toogleMode() {
        this.offline = !this.offline;
    }

    logoff() {
        this.loginService.logoff();
        this.router.navigate(["/login"]);
    }

    getCountTicketsByTribune(tribune) {
        console.log('tickets count tap', tribune);
        // if (!this.offline) {
        //     this.getCountTicketsOnline(tribune);
        // } else {
            // let tickets = applicationSettings.getString("tickets"),
            //     defaultTickets = JSON.parse(tickets);
        //let tickets = this.tickets.map(ticket => ticket);
            // for(let i = 0; i < rows.length; i++) {
            //     console.log('tickets1', rows[i].ticket.tribune);
            //     tickets.push(rows[i].ticket);
            // }

            console.log('tickets offline', this.tickets.length);
            this.getCountTicketsOffline(this.tickets, tribune);
            this.refreshTickets();
        //}
    }

    getTranslateTribune(ticket) {
       return {
           status: ticket.status,
           headline: ticket.headline,
           tribune: this.translateRu(ticket.tribune),
           sector: ticket.sector,
           row: ticket.row,
           seat: ticket.seat,
           code: ticket.code
       };
    }

    changeLoadingStatus(status) {
        this.isLoading = status;
    }

    checkTicketOnline(code) {
        this.ticketService
            .checkTicketStatus(this.translate(this.tribune), code)
            .subscribe(
                data => {
                    this.changeLoadingStatus(false);

                    if (!data.ticket) {
                        this.message = data.message;
                        this.count = data.count;
                        this.status = "notOk";
                    } else {
                        this.ticket = this.getTranslateTribune(data.ticket);
                        this.count = data.count;

                        if ( data.message ){
                            this.message = data.message;
                            this.status = "other";
                            return;
                        }
                        this.status = "ok";
                    }
                },
                error =>  {
                    this.changeLoadingStatus(false);
                    this.errorMessage = <any>error;
                });
    }

    checkTicketOffline(code) {
        //let tickets = applicationSettings.getString("tickets");
            //defaultTickets = JSON.parse(tickets),
            let [ ticket ] = this.tickets.filter(ticket => (ticket.shortTicket.code === code && ticket.shortTicket.status === 'paid') );
        this.changeLoadingStatus(false);

        if ( !ticket ) {
            this.message = "Билет не действительный";
            this.status = "notOk";
        } else {
            let ticketId = ticket._id,
                ticketBody = ticket.shortTicket;

            if (this.translate(this.tribune) === 'vip') {
                ticket = this.checkTicketByVip(ticketBody);
            } else {
                ticket = this.checkTicketByTribune(ticketBody);
            }
            if (ticket.status === 'used') {
                // let updatedTickets = this.tickets.filter(ticket => ticket.code !== code);
                // updatedTickets.push(ticket);
                this.database.updateDocument(ticketId, ticket);

                this.getCountTicketsByTribune(this.translate(this.tribune));
                this.refreshTickets();
                //applicationSettings.setString("tickets", JSON.stringify(updatedTickets));
            }
        }
    }

    checkTicketByVip(ticket) {

        if ( !this.sectorsInVip.filter(sector => sector === ticket.sector).length ) {
            this.message = "Другая трибуна";
            this.status = "other";
        } else {
            this.ticket = this.getTranslateTribune(ticket);
            this.status = "ok";
            ticket.status = 'used';
        }
        return ticket;
    }

    checkTicketByTribune(ticket) {
        this.ticket = this.getTranslateTribune(ticket);
        console.log('tribune123', ticket.tribune, this.translate(this.tribune));
        if (ticket.tribune !== this.translate(this.tribune)) {
            this.message = "Другая трибуна";
            this.status = "other";
        } else {
            this.status = "ok";
            ticket.status = 'used';
        }
        return ticket;
    }

    getCountTicketsOnline(tribune) {
        this.ticketService
            .getCountTicketsByTribune(tribune)
            .subscribe(
                count => {
                    this.count = count;
                },
                error =>  this.errorMessage = <any>error);
    }

    getCountTicketsOffline(tickets, tribune) {
        console.log('count1', tribune, tickets.length, typeof tickets[2], tickets[2].sector, tickets[2].tribune);
        if ( tribune === 'vip' ) {
            this.count = tickets.filter( ticket => (ticket.status === 'paid' &&  this.sectorsInVip.filter(sector => sector === ticket.sector).length) ).length;
        } else {
            this.count = tickets.filter( ticket => (ticket.status === 'paid' && (!this.sectorsInVip.filter(sector => sector === ticket.sector).length &&
                                                    ticket.tribune === tribune   )) ).length;
            console.log('count', this.count, tribune, tickets.length);
        }
    }

    translate(direction) {
        if (direction == 'Северная') { return 'north'}
        // if (direction == 'Южная') { return 'south'}
        if (direction == 'Восточная') { return 'east'}
        if (direction == 'Западная') { return 'west'}
        if (direction == 'VIP') { return 'vip'}
    }

    translateRu(direction) {
        if (direction == 'north') { return 'Северная'}
        if (direction == 'south') { return 'Южная'}
        if (direction == 'east') { return 'Восточная'}
        if (direction == 'west') { return 'Западная'}
    }

    private refreshTickets() {
        this.tickets = [];
        let rows = this.database.executeQuery("tickets");
        console.log('rows12345', rows.length);
        for(let i = 0; i < rows.length; i++) {
            console.log('tickets1', rows[i]._id, rows[i].shortTicket);
                this.tickets.push(rows[i]);
        }
        console.log('tickets12345', this.tickets.length);
    }

    private indexOfObjectId(needle: string, haystack: any) {
        for (let i = 0; i < haystack.length; i++) {
            if (haystack[i] != undefined && haystack[i].hasOwnProperty("_id")) {
                if (haystack[i]._id == needle) {
                    return i;
                }
            }
        }
        return -1;
    }
}