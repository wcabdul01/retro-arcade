import { Capacitor } from "@capacitor/core";
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  RewardAdPluginEvents,
  InterstitialAdPluginEvents,
} from "@capacitor-community/admob";

// Google's official test IDs. Swap these for real AdMob IDs before publishing
// (and update the matching APPLICATION_ID in android/app/src/main/AndroidManifest.xml).
const TEST_BANNER_ID = "ca-app-pub-3940256099942544/6300978111";
const TEST_REWARDED_ID = "ca-app-pub-3940256099942544/5224354917";
const TEST_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712";

const INTERSTITIAL_MIN_INTERVAL_MS = 60_000;

// The AdMob account this app was going to use is currently unavailable, and
// the plan is to switch mediation to AppLovin MAX instead (needs a custom
// native Capacitor plugin — no ready-made one exists — planned as a
// fast-follow, not rushed into this launch). Until that's built, ads are
// fully disabled here rather than left pointing at a dead AdMob account:
// every method below already has a correct "ads unavailable" fallback path
// (onUnavailable/onDone still fire), since that's the same path used when
// ads aren't supported on a given platform — so this is a single safe gate,
// not a change to any call site's behavior contract.
const ADS_DISABLED = true;

class AdsManagerImpl {
  private ready = false;
  private initializing: Promise<void> | null = null;
  private bannerVisible = false;
  private lastInterstitialAt = 0;
  private adFree = false;

  private get isSupported(): boolean {
    return !ADS_DISABLED && Capacitor.isNativePlatform() && !this.adFree;
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
      this.initializing = AdMob.initialize({ initializeForTesting: true })
        .then(() => {
          this.ready = true;
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
      if (this.bannerVisible) {
        await AdMob.resumeBanner();
      } else {
        await AdMob.showBanner({
          adId: TEST_BANNER_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          isTesting: true,
        });
        this.bannerVisible = true;
      }
    } catch {
      // No fill / network error; ignore, screen just has no banner this time.
    }
  }

  async hideBanner(): Promise<void> {
    // Not gated on isSupported/adFree: this must still be able to dismiss a
    // banner that was already showing before the player purchased ad-free.
    if (!Capacitor.isNativePlatform() || !this.bannerVisible) return;
    try {
      await AdMob.hideBanner();
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

    let rewarded = false;
    const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
      rewarded = true;
    });
    const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      rewardListener.remove();
      dismissListener.remove();
      if (rewarded) {
        onReward();
      } else {
        onUnavailable?.();
      }
    });

    try {
      await AdMob.prepareRewardVideoAd({ adId: TEST_REWARDED_ID, isTesting: true });
      await AdMob.showRewardVideoAd();
    } catch {
      rewardListener.remove();
      dismissListener.remove();
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

    let called = false;
    const finish = (): void => {
      if (called) return;
      called = true;
      this.lastInterstitialAt = Date.now();
      onDone();
    };

    const dismissListener = await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      dismissListener.remove();
      finish();
    });

    try {
      await AdMob.prepareInterstitial({ adId: TEST_INTERSTITIAL_ID, isTesting: true });
      await AdMob.showInterstitial();
    } catch {
      dismissListener.remove();
      finish();
    }
  }
}

export const AdsManager = new AdsManagerImpl();
