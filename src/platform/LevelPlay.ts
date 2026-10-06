import { registerPlugin } from "@capacitor/core";

/** Which rewarded ad unit to use; each has its own LevelPlay ad unit for per-reward reporting. */
export type RewardKind = "continue" | "hints" | "undos";

// Bridges to android/app/src/ads/java/com/retroarcade/app/LevelPlayPlugin.java --
// a hand-written native plugin, since no maintained Capacitor plugin for
// Unity LevelPlay exists. iOS has no counterpart yet (see AdsManager.ts).
export interface LevelPlayPlugin {
  /** Resolves once, even across repeated calls -- safe to call from BootScene every launch. */
  initialize(): Promise<{ available: boolean }>;
  /** Best-effort: resolves once a load has been kicked off, not once it's actually visible. */
  showBanner(): Promise<void>;
  hideBanner(): Promise<void>;
  /** Resolves once the ad is dismissed (or immediately if it couldn't be shown at all). */
  showInterstitial(): Promise<void>;
  /** Resolves { rewarded: true } only if the user watched to completion. */
  showRewarded(options: { kind: RewardKind }): Promise<{ rewarded: boolean }>;
}

export const LevelPlay = registerPlugin<LevelPlayPlugin>("LevelPlay");
