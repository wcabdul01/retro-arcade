import { Capacitor } from "@capacitor/core";
import { LevelPlay, type RewardKind } from "../platform/LevelPlay";

// Mediation is Unity LevelPlay (see android/app/src/ads/java/com/retroarcade/app/LevelPlayPlugin.java).
// AdMob was dropped because the AdMob account was unavailable, and AppLovin
// MAX because it stopped accepting new publishers (see git history).
//
// Real credentials live in android/levelplay.properties (gitignored, see
// android/levelplay.properties.example) and are read natively -- nothing
// here ever needs a real app key or ad unit ID. Without that file the native
// plugin isn't even compiled in, so LevelPlay.initialize() rejects and every
// method below takes the same "ads unavailable" fallback path it already
// used for unsupported platforms, so a build without credentials is safe,
// not broken.
//
// iOS has no equivalent native plugin yet, so isSupported gates on the
// Android platform specifically -- the iOS build ships ad-free for now.

const INTERSTITIAL_MIN_INTERVAL_MS = 60_000;

class AdsManagerImpl {
  private ready = false;
  private initializing: Promise<void> | null = null;
  private bannerVisible = false;
  private lastInterstitialAt = 0;
  private adFree = false;

  private get isSupported(): boolean {
    return Capacitor.getPlatform() === "android" && !this.adFree;
  }

  /** Set once at boot from the purchased "remove ads" entitlement. When true,
   * every method below becomes a no-op (or calls its fallback callback
   * immediately) so ad-free players never trigger a network call for ads. */
  setAdFree(adFree: boolean): void {
    this.adFree = adFree;
    if (adFree && this.bannerVisible) {
      this.hideBanner();
    }
  }

  async initialize(): Promise<void> {
    if (!this.isSupported || this.ready) return;
    if (!this.initializing) {
      this.initializing = LevelPlay.initialize()
        .then(({ available }) => {
          this.ready = available;
        })
        .catch(() => {
          // Ads unavailable on this device/build; every call below no-ops safely.
        });
    }
    await this.initializing;
  }

  async showBanner(): Promise<void> {
    if (!this.isSupported) return;
    await this.initialize();
    if (!this.ready) return;
    try {
      await LevelPlay.showBanner();
      this.bannerVisible = true;
    } catch {
      // No fill / network error; ignore, screen just has no banner this time.
    }
  }

  async hideBanner(): Promise<void> {
    // Not gated on isSupported/adFree: this must still be able to dismiss a
    // banner that was already showing before the player purchased ad-free.
    if (Capacitor.getPlatform() !== "android" || !this.bannerVisible) return;
    try {
      await LevelPlay.hideBanner();
      this.bannerVisible = false;
    } catch {
      // ignore
    }
  }

  /**
   * Shows a rewarded video. Calls `onReward` only if the user actually earned
   * the reward (finished the video). Calls `onUnavailable` if the ad couldn't
   * be shown at all (no fill, no network, unsupported platform) or if the
   * user dismissed it before earning the reward, so callers can reset any
   * "loading" UI state instead of getting stuck. `kind` picks the ad unit,
   * so LevelPlay reports revenue per reward type.
   */
  async showRewarded(kind: RewardKind, onReward: () => void, onUnavailable?: () => void): Promise<void> {
    if (!this.isSupported) {
      onUnavailable?.();
      return;
    }
    await this.initialize();
    if (!this.ready) {
      onUnavailable?.();
      return;
    }

    try {
      const { rewarded } = await LevelPlay.showRewarded({ kind });
      if (rewarded) {
        onReward();
      } else {
        onUnavailable?.();
      }
    } catch {
      onUnavailable?.();
    }
  }

  /**
   * Shows a full-screen interstitial, then calls `onDone` once it's been
   * dismissed (or immediately if no ad could be shown at all), so callers
   * can gate a scene transition on it — e.g. "go to Hub after the ad closes"
   * instead of racing the navigation against the ad.
   *
   * Throttled to at most once per INTERSTITIAL_MIN_INTERVAL_MS so rapid
   * game-exit navigation can't spam the player with back-to-back ads.
   */
  async showInterstitial(onDone: () => void): Promise<void> {
    if (!this.isSupported) {
      onDone();
      return;
    }
    if (Date.now() - this.lastInterstitialAt < INTERSTITIAL_MIN_INTERVAL_MS) {
      onDone();
      return;
    }
    await this.initialize();
    if (!this.ready) {
      onDone();
      return;
    }

    this.lastInterstitialAt = Date.now();
    try {
      await LevelPlay.showInterstitial();
    } catch {
      // ignore; onDone still fires below so navigation isn't blocked.
    }
    onDone();
  }
}

export const AdsManager = new AdsManagerImpl();
