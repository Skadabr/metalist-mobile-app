import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NgModule } from "@angular/core";
import { NativeScriptHttpModule } from "nativescript-angular/http";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { authProviders, appRoutes } from "./app.routing";
import { BarcodeScanner} from "nativescript-barcodescanner";
import { AppComponent } from "./app.component";
import { setStatusBarColors, BackendService, LoginService } from "./shared";

import { LoginModule } from "./login/login.module";
import { ScannerAppModule } from "./scanner/scanner.module";

setStatusBarColors();

@NgModule({
  providers: [
    BackendService,
    LoginService,
    BarcodeScanner,
    authProviders
  ],
  imports: [
    NativeScriptModule,
    NativeScriptHttpModule,
    NativeScriptRouterModule,
    NativeScriptRouterModule.forRoot(appRoutes),
    LoginModule,
    ScannerAppModule
  ],
  declarations: [
      AppComponent,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
