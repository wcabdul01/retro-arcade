import { Capacitor } from "@capacitor/core";
import { AppLovin } from "../platform/AppLovin";

// Mediation is AppLovin MAX (see android/app/src/main/java/com/retroarcade/app/AppLovinPlugin.java).
// AdMob is no longer used: the AdMob account this app was going to use was
// barred/unavailable at launch, so ads shipped disabled for that release
// and mediation moved to AppLovin as the fast-follow (see git history).
//
// Real credentials live in android/applovin.properties (gitignored, see
// android/applovin.properties.example) and are read natively -- nothing
// here ever needs a real SDK key or ad unit ID. Until that file is filled
// in, AppLovin.initialize() resolves { available: false } and every method
// below takes the same "ads unavailable" fallback path it already used for
// unsupported platforms, so a build without real credentials is safe, not
// broken.
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
      this.initializing = AppLovin.initialize()
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
      await AppLovin.showBanner();
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
      await AppLovin.hideBanner();
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
   * "loading" UI state instead of getting stuck.
   */
  async showRewarded(onReward: () => void, onUnavailable?: () => void): Promise<void> {
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
      const { rewarded } = await AppLovin.showRewarded();
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
      await AppLovin.showInterstitial();
    } catch {
      // ignore; onDone still fires below so navigation isn't blocked.
    }
    onDone();
  }
}

export const AdsManager = new AdsManagerImpl();
