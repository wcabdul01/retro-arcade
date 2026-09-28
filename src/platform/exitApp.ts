import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

/** iOS has no programmatic quit (App.exitApp is Android-only, and App Store
 * review rejects apps that terminate themselves), so EXIT buttons are hidden
 * there -- players leave via the home gesture like any other iOS app. */
export function canExitApp(): boolean {
  return Capacitor.getPlatform() !== "ios";
}

export function exitApp(onFallback: () => void): void {
  if (Capacitor.getPlatform() === "android") {
    void App.exitApp();
    return;
  }
  window.close();
  onFallback();
}
