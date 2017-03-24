import { Injectable } from "@angular/core";
import { getString, setString } from "application-settings";

const tokenKey = "token";

export class BackendService {
  static apiUrl = "http://10.0.3.2:9000/";

  static isLoggedIn(): boolean {
    return !!getString("token");
  }

  static get token(): string {
    return getString("token");
  }

  static set token(theToken: string) {
    setString("token", theToken);
  }
}
