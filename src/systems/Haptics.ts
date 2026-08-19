import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Settings } from "./Settings";

export function vibrate(style: ImpactStyle = ImpactStyle.Medium): void {
  if (!Settings.vibrationEnabled) return;
  Haptics.impact({ style }).catch(() => {
    // haptics unsupported on this platform; ignore
  });
}
