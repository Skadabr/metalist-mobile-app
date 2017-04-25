import { Component } from "@angular/core";
import {CouchbaseInstance} from "./shared/couchbaseinstance";

@Component({
  selector: "gr-main",
  template: "<page-router-outlet></page-router-outlet>"
})
export class AppComponent {
  constructor(private couchbaseInstance: CouchbaseInstance) {
    couchbaseInstance.init();
  }
}
