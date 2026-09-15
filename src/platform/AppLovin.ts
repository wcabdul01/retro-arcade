import { registerPlugin } from "@capacitor/core";

// Bridges to android/app/src/main/java/com/retroarcade/app/AppLovinPlugin.java --
// a hand-written native plugin, since no official/community Capacitor plugin
// for AppLovin MAX exists. iOS has no counterpart yet (see AdsManager.ts).
export interface AppLovinPlugin {
  /** Resolves once, even across repeated calls -- safe to call from BootScene every launch. */
  initialize(): Promise<{ available: boolean }>;
  /** Best-effort: resolves once a load has been kicked off, not once it's actually visible. */
  showBanner(): Promise<void>;
  hideBanner(): Promise<void>;
  /** Resolves once the ad is dismissed (or immediately if it couldn't be shown at all). */
  showInterstitial(): Promise<void>;
  /** Resolves { rewarded: true } only if the user watched to completion. */
  showRewarded(): Promise<{ rewarded: boolean }>;
}

export const AppLovin = registerPlugin<AppLovinPlugin>("AppLovin");
