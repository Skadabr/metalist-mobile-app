import * as dialogsModule from "ui/dialogs";

export function alert(message: string) {
  return dialogsModule.alert({
    title: "Metalist1985",
    okButtonText: "OK",
    message: message
  });
}
