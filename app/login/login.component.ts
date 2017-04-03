import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { connectionType, getConnectionType } from "connectivity";
import { prompt } from "ui/dialogs";
import { Page } from "ui/page";

import { alert, LoginService, User } from "../shared";

@Component({
  selector: "gr-login",
  templateUrl: "login/login.component.html",
  styleUrls: ["login/login-common.css", "login/login.component.css"],
})
export class LoginComponent implements OnInit {
  user: User;
  isLoggingIn = true;
  isAuthenticating = false;

  constructor(private router: Router,
    private userService: LoginService,
    private page: Page) {
    this.user = new User();
  }

  ngOnInit() {
    this.page.actionBarHidden = true;
    //this. showMainContent();
  }

  focusPassword() {
    ///this.password.nativeElement.focus();
  }

  submit() {
    if (!this.user.isValidEmail()) {
      alert("Enter a valid email address.");
      return;
    }

    this.isAuthenticating = true;
    if (this.isLoggingIn) {
      this.login();
    } else {
      this.signUp();
    }
  }

  login() {
    if (getConnectionType() === connectionType.none) {
      alert("Groceries requires an internet connection to log in.");
      return;
    }

    this.userService.login(this.user)
      .subscribe(
        () => {
          this.isAuthenticating = false;
          this.router.navigate(["/"]);

        },
        (error) => {
          alert("Unfortunately we could not find your account.");
          this.isAuthenticating = false;
        }
      );
  }

  signUp() {
    if (getConnectionType() === connectionType.none) {
      alert("Groceries requires an internet connection to register.");
      return;
    }

    this.userService.register(this.user)
      .subscribe(
        () => {
          alert("Your account was successfully created.");
          this.isAuthenticating = false;
          //this.toggleDisplay();
        },
        (message) => {
          // TODO: Verify this works
          if (message.match(/same user/)) {
            alert("This email address is already in use.");
          } else {
            alert("Unfortunately we were unable to create your account.");
          }
          this.isAuthenticating = false;
        }
      );
  }

  forgotPassword() {
    prompt({
      title: "Forgot Password",
      message: "Enter the email address you used to register for Groceries to reset your password.",
      defaultText: "",
      okButtonText: "Ok",
      cancelButtonText: "Cancel"
    }.toString()).then((data) => {
      if (data.result) {
        this.userService.resetPassword(data.text.trim())
          .subscribe(() => {
            alert("Your password was successfully reset. Please check your email for instructions on choosing a new password.");
          }, () => {
            alert("Unfortunately, an error occurred resetting your password.");
          });
      }
    });
  }

  toggleDisplay() {
    this.isLoggingIn = !this.isLoggingIn;
  }
 }
