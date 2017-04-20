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
  }

  submit() {
    if (!this.user.isValidEmail()) {
      alert("Введите правильный email адрес.");
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
      alert("Для входа в приложение необходим интернет.");
      return;
    }

    this.userService.login(this.user)
      .subscribe(
        () => {
          this.isAuthenticating = false;
          this.router.navigate(["/"]);

        },
        (error) => {
          alert("Ваш аккаунт не найден.");
          this.isAuthenticating = false;
        }
      );
  }

  signUp() {
    if (getConnectionType() === connectionType.none) {
      alert("Для регистрации необходим интернет.");
      return;
    }

    this.userService.register(this.user)
      .subscribe(
        () => {
          alert("Ваш аккаунт был успешно создан.");
          this.isAuthenticating = false;
        },
        (message) => {

          // TODO: Verify this works
          if (message.match(/same user/)) {
            alert("Этот email уже занят.");
          } else {
            alert("Не удалось создать ваш аккаунт.");
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
