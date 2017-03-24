import { ModuleWithProviders }  from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { ScannerComponent } from "./scanner.component";
import { AuthGuard } from "../auth-guard.service";

const ScannerRoutes: Routes = [
  { path: "scanner", component: ScannerComponent, canActivate: [AuthGuard] },
];
export const ScannerRouting: ModuleWithProviders = RouterModule.forChild(ScannerRoutes);