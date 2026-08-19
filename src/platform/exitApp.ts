import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

export function exitApp(onFallback: () => void): void {
  if (Capacitor.isNativePlatform()) {
    void App.exitApp();
    return;
  }
  window.close();
  onFallback();
}
