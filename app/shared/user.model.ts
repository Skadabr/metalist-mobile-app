const validator = require("email-validator");

export class User {
  email: string;
  password: string;
  role: string;
  isValidEmail() {
    return validator.validate(this.email);
  }
}