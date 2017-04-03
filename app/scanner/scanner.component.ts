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
    ticketStatusImage: string;
    errorMessage: string;
    message: string;
    tribune: string;
    role: string;
    count: number;
    tribunes: string[];
    tickets: any[];
    ticket: {};

    constructor(private router: Router,
                private loginService: LoginService,
                private barcodeScanner: BarcodeScanner,
                private ticketService: TicketService,
                private page: Page) {
        this.offline = false;
        this.message = '';
        this.switchFlash = false;
        this.isLoading = false;
        this.role = '';
        this.ticketStatusImage = '';
        this.count = 0;
        this.tribune = '';
        this.tribunes = ['east', 'west', 'north', 'vip'];
        this.ticket = {};
    }

    ngOnInit() {
        this.getUser();
        this.page.actionBarHidden = true;
    }

    getUser() {
        this.ticketService
            .loadUser()
            .subscribe(
                user => {
                    this.role = user.role;
                    console.log(this.role);
                },
                error =>  this.errorMessage = <any>error);
    }

    loadTicketsForCheck() {
        this.ticketService
            .loadTickets()
            .subscribe(
                tickets => {
                    console.log('tickets count', tickets.length);
                    applicationSettings.clear();
                    applicationSettings.setString("tickets", JSON.stringify(tickets));
                },
                error =>  this.errorMessage = <any>error
            );
    }

    toggleFlashLights() {
        this.switchFlash = !this.switchFlash;
    }

    logoff() {
        this.loginService.logoff();
        this.router.navigate(["/login"]);
    }

    getCountTicketsByTribune(tribune) {
        this.ticketService
            .getCountTicketsByTribune(tribune)
            .subscribe(
                count => {
                    this.count = count;
                },
                error =>  this.errorMessage = <any>error);
    }

    displayActionDialog() {
        let options = {
            title: "Выберите трибуну",
            message: "Choose your race",
            actions: ['Восточная', 'Западная', 'Северная', 'VIP']
        };
        dialogs.action(options).then((result) => {
            this.tribune = result ? result : '';
            console.log("result " + result);
            if (result) {
                this.getCountTicketsByTribune( this.translate(result) );
            } else {
                this.count = 0;
            }
        });
    }

    getTranslateTribune(ticket) {
       ticket.tribune = this.translateRu(ticket.tribune);
       return  ticket;
    }

    changeLoadingStatus(status) {
        this.isLoading = status;
    }

    scan() {
        // if (this.role !== 'steward') {
        //     this.message = 'У вас должны быть права стюарда.';
        //     return;
        // }
        if (!this.tribune) {
            this.message = 'Выберите трибуну.';
            return;
        }

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
                console.log("No scan: " + error);
            }
        );
    }

    checkTicketOnline(code) {
        this.ticketService
            .checkTicketStatus(this.translate(this.tribune), code)
            .subscribe(
                data => {
                    this.message = '';
                    if (!data.ticket) {
                        this.message = data.message;
                        this.count = data.count;
                        this.ticketStatusImage = "res://notok";
                    } else {
                        this.ticket = this.getTranslateTribune(data.ticket);
                        this.count = data.count;

                        if ( data.message ){
                            this.message = data.message;
                            this.ticketStatusImage = "res://othertribune";
                            return;
                        }
                        this.ticketStatusImage = "res://ok";
                        return;
                    }
                    this.changeLoadingStatus(false);
                },
                error =>  {
                    this.isLoading = false;
                    this.errorMessage = <any>error;
                    console.log(this.errorMessage);
                });
    }

    checkTicketOffline(code) {
        let tickets = applicationSettings.getString("tickets"),
            defaultTickets = JSON.parse(tickets),
            ticketIndex = defaultTickets.findIndex(ticket => ticket.accessCode === code);

        if ( ticketIndex < 0 ) {
            this.message = "Билет не действительный";
            this.ticket = {};
            this.ticketStatusImage = "res://notok";
        } else {
            let ticket = defaultTickets[ticketIndex];

            if (ticket.tribune !== this.tribune) {
                this.message = "Другая трибуна";
                this.ticket = ticket;
                this.ticketStatusImage = "res://othertribune";
            }
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