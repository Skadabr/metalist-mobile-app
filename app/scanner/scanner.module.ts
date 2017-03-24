import { NativeScriptModule } from "nativescript-angular/platform";
import { NgModule } from "@angular/core";

import { ScannerRouting } from "./scanner.routing";
import { ScannerComponent } from "./scanner.component";

@NgModule({
    imports: [
        NativeScriptModule,
        ScannerRouting
    ],
    declarations: [
        ScannerComponent
    ]
})


export class ScannerAppModule { }