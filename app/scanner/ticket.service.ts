import { Injectable } from "@angular/core";
import { Http, Headers, Response } from "@angular/http";
import { Observable,  } from "rxjs/Rx";
import "rxjs/add/operator/map";

import { BackendService } from "../shared";

@Injectable()
export class TicketService {

    constructor(private http: Http) { }

    loadUser() {
        let headers = this.getHeaders();
        headers.append("X-Everlive-Sort", JSON.stringify({ ModifiedAt: -1 }));

        return this.http.get(BackendService.apiUrl + "api/users/me", {
            headers: headers
        })
            .map(res => res.json())
            .catch(this.handleErrors);
    }

    loadTickets() {
        let headers = this.getHeaders();
        headers.append("X-Everlive-Sort", JSON.stringify({ ModifiedAt: -1 }));

        return this.http.get(BackendService.apiUrl + "api/tickets/sold-tickets", {
            headers: headers
        })
            .map(res => res.json())
            .catch(this.handleErrors);
    }

    checkTicketStatus(tribune, code) {
        let headers = this.getHeaders();
        headers.append("X-Everlive-Sort", JSON.stringify({ ModifiedAt: -1 }));

        return this.http.get(BackendService.apiUrl + "api/tickets/tribune/" + tribune + '/code/' + code , {
            headers: headers
        })
            .map(res => res.json())
            .catch(this.handleErrors);
    }

    getCountTicketsByTribune(tribune) {
        let headers = this.getHeaders();
        headers.append("X-Everlive-Sort", JSON.stringify({ ModifiedAt: -1 }));

        return this.http.get(BackendService.apiUrl + "api/tickets/count/" + tribune  , {
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