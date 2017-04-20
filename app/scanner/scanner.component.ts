import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { LoginService, alert } from "../shared";
import { TicketService } from './ticket.service';
import { BarcodeScanner} from "nativescript-barcodescanner";
import { Page } from "ui/page";
import * as dialogs from "ui/dialogs";

let applicationSettings = require("application-settings");

@Component({
    selector: "first",
    templateUrl: "scanner/scanner.component.html",
    styleUrls: ["scanner/scanner-common.css"],
    providers: [TicketService, BarcodeScanner]
})

export class ScannerComponent implements OnInit {
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
                private page: Page) {
        this.offline = false;
        this.switchFlash = false;
        this.isLoading = false;
        this.role = '';
        this.count = 0;
        this.tribune = '';
        this.tribunes = ['east', 'west', 'north', 'vip'];
        this.sectorsInVip = ['VIP_B', 'VIP_BR', 'VIP_BL', 'VIP_AR', 'VIP_AL', 'SB_1', 'SB_7'];
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

                if (!this.offline) {
                    this.checkTicketOnline(result.text);
                } else {
                    this.checkTicketOffline(result.text);
                }
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
        if (!this.offline) {
            this.getCountTicketsOnline(tribune);
        } else {
            let tickets = applicationSettings.getString("tickets"),
                defaultTickets = JSON.parse(tickets);
            console.log('tickets offline', defaultTickets.length);
            this.getCountTicketsOffline(defaultTickets, tribune);
        }
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
        let tickets = applicationSettings.getString("tickets"),
            defaultTickets = JSON.parse(tickets),
            [ ticket ] = defaultTickets.filter(ticket => (ticket.code === code && ticket.status === 'paid') );
        this.changeLoadingStatus(false);

        if ( !ticket ) {
            this.message = "Билет не действительный";
            this.status = "notOk";
        } else {
            if (this.translate(this.tribune) === 'vip') {
                ticket = this.checkTicketByVip(ticket);
            } else {
                ticket = this.checkTicketByTribune(ticket);
            }
            if (ticket.status === 'used') {
                let updatedTickets = defaultTickets.filter(ticket => ticket.code !== code);
                updatedTickets.push(ticket);

                this.getCountTicketsOffline(updatedTickets, this.translate(this.tribune));
                applicationSettings.setString("tickets", JSON.stringify(updatedTickets));
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
}