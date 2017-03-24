import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { LoginService, alert } from "../shared";
import { TicketService } from './ticket.service';
import { BarcodeScanner} from "nativescript-barcodescanner";

@Component({
    selector: "first",
    templateUrl: "scanner/scanner.component.html",
    styleUrls: ["scanner/scanner-common.css"],
    providers: [TicketService, BarcodeScanner]
})

export class ScannerComponent implements OnInit {
    errorMessage: string;
    tickets: any[];


    constructor(private router: Router,
                private loginService: LoginService,
                private barcodescanner: BarcodeScanner,
                private ticketService: TicketService) {}

    ngOnInit() {
        this.ticketService
            .load()
            .subscribe(
                tickets => {
                    this.tickets = tickets;
                    console.log(this.tickets)
                },
                error =>  this.errorMessage = <any>error);
    }

    logoff() {
        this.loginService.logoff();
        this.router.navigate(["/login"]);
    }

    scan() {

        this.barcodescanner.scan({
            formats: "CODE_128",   // Pass in of you want to restrict scanning to certain types
            message: "Use the volume buttons for extra light", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
            showFlipCameraButton: true,   // default false
            preferFrontCamera: false,     // default false
            showTorchButton: true,        // default false
            beepOnScan: true,             // Play or Suppress beep on scan (default true)
            torchOn: false,               // launch with the flashlight on (default false)
            resultDisplayDuration: 500,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
            orientation: "landscape",     // Android only, optionally lock the orientation to either "portrait" or "landscape"
            openSettingsIfPermissionWasPreviouslyDenied: true // On iOS you can send the user to the settings app if access was previously denied
        }).then(
            function(result) {
                console.log("Scan format: " + result.format);
                console.log("Scan text:   " + result.text);
            },
            function(error) {
                console.log("No scan: " + error);
            }
        );
    }
}