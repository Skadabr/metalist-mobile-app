import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { LoginService, alert } from "../shared";
import { TicketService } from './ticket.service';
import { BarcodeScanner} from "nativescript-barcodescanner";
import { Page } from "ui/page";
import * as dialogs from "ui/dialogs";

@Component({
    selector: "first",
    templateUrl: "scanner/scanner.component.html",
    styleUrls: ["scanner/scanner-common.css"],
    providers: [TicketService, BarcodeScanner]
})

export class ScannerComponent implements OnInit {
    errorMessage: string;
    message: string;
    tribune: string;
    role: string;
    count: number;
    color: string;
    tickets: any[];
    tribunes: string[];
    ticket: {};

    constructor(private router: Router,
                private loginService: LoginService,
                private barcodeScanner: BarcodeScanner,
                private ticketService: TicketService,
                private page: Page) {
        this.message = '';
        this.role = '';
        this.color = '';
        this.count = 0;
        this.tribune = '';
        this.tribunes = ['east', 'west', 'north', 'vip'];
        this.ticket = {
            // headline: 'metalist-dynamo',
            // tribune: 'west',
            // seat: '5',
            // role: 'steward'
        };
    }

    ngOnInit() {
        this.ticketService
            .loadUser()
            .subscribe(
                user => {
                    this.role = user.role;
                    console.log(this.role);
                },
                error =>  this.errorMessage = <any>error);

        this.page.actionBarHidden = true;
    }

    logoff() {
        this.loginService.logoff();
        this.router.navigate(["/login"]);
    }

    getCountTicketsByTribune() {
        this.ticketService
            .getCountTicketsByTribune(this.tribune)
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
            // cancelButtonText: "Отмена",
            actions: ['east', 'west', 'north', 'vip']
        };
        dialogs.action(options).then((result) => {
            console.log(result);
            this.tribune = result;
            if (this.tribune) {
                this.message = '';
                this.getCountTicketsByTribune();
            }
        });
    }

    scan() {

        if (this.role !== 'steward') {
            this.message = 'У вас должны быть права стюарта.';
            return;
        }
        if (!this.tribune) {
            this.message = 'Выберите трибуну.';
            return;
        }

        this.barcodeScanner.scan({
            formats: "CODE_128",   // Pass in of you want to restrict scanning to certain types
            message: "Use the volume buttons for extra light", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
            showFlipCameraButton: false,   // default false
            preferFrontCamera: false,     // default false
            showTorchButton: true,        // default false
            beepOnScan: true,            // Play or Suppress beep on scan (default true)
            torchOn: false,               // launch with the flashlight on (default false)
            resultDisplayDuration: 0,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
            orientation: "landscape",     // Android only, optionally lock the orientation to either "portrait" or "landscape"
            openSettingsIfPermissionWasPreviouslyDenied: true // On iOS you can send the user to the settings app if access was previously denied
        }).then( (result) => {
                this.ticketService
                    .checkTicketStatus(this.tribune, result.text)
                    .subscribe(
                        data => {
                            if (!data.ticket) {
                                this.message = data.message;
                                this.count = data.count;
                                this.color = 'red';
                                return;
                            }
                            if ( data.message ){
                                this.message = data.message;
                                this.count = data.count;
                                this.ticket = data.ticket;
                                this.color = 'yellow';
                                return;
                            }
                            this.count = data.count;
                            this.ticket = data.ticket;
                            this.color = 'green';
                            return;
                        },
                        error =>  {
                            this.errorMessage = <any>error;
                            console.log(this.errorMessage);
                        });
            },
            (error) => {
                console.log("No scan: " + error);
            }
        );
    }
}