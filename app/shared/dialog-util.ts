import * as dialogsModule from "ui/dialogs";

export function alert(message: string) {
  return dialogsModule.alert({
    title: "Metalist 1925",
    okButtonText: "OK",
    message: message
  });
}
