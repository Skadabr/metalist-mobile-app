import { Injectable } from "@angular/core";
import { Http, Headers, Response } from "@angular/http";
import { Observable,  } from "rxjs/Rx";
import "rxjs/add/operator/map";

import { BackendService } from "../shared";

@Injectable()
export class TicketService {

    constructor(private http: Http) { }

    load() {
        let headers = this.getHeaders();
        headers.append("X-Everlive-Sort", JSON.stringify({ ModifiedAt: -1 }));

        return this.http.get(BackendService.apiUrl + "api/users", {
            headers: headers
        })
            .map(res => res.json())
            .catch(this.handleErrors);
    }

    private getHeaders() {
        let headers = new Headers();
        headers.append("Content-Type", "application/json");
        headers.append("Authorization", "Bearer " + BackendService.token);
        return headers;
    }

    private handleErrors(error: Response) {
        console.log(error);
        return Observable.throw(error);
    }
}