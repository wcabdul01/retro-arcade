package com.retroarcade.app;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.applovin.mediation.MaxAd;
import com.applovin.mediation.MaxAdListener;
import com.applovin.mediation.MaxAdViewAdListener;
import com.applovin.mediation.MaxError;
import com.applovin.mediation.MaxReward;
import com.applovin.mediation.MaxRewardedAdListener;
import com.applovin.mediation.ads.MaxAdView;
import com.applovin.mediation.ads.MaxInterstitialAd;
import com.applovin.mediation.ads.MaxRewardedAd;
import com.applovin.sdk.AppLovinMediationProvider;
import com.applovin.sdk.AppLovinSdk;
import com.applovin.sdk.AppLovinSdkConfiguration;
import com.applovin.sdk.AppLovinSdkInitializationConfiguration;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.TimeUnit;

/**
 * Wraps the AppLovin MAX Android SDK as a Capacitor plugin. There's no
 * official or community Capacitor plugin for AppLovin MAX, so this is a
 * small hand-written one exposing only what src/systems/AdsManager.ts
 * needs: initialize, banner show/hide, and load-then-show rewarded /
 * interstitial. AdsManager.ts's public API (used across every game's
 * GameOverScene, PauseScene, etc.) is unchanged by this swap from AdMob.
 *
 * Ad unit IDs are read from BuildConfig (populated by
 * android/app/build.gradle from android/applovin.properties, a gitignored
 * file -- see android/applovin.properties.example) instead of being passed
 * from JS, so real ad unit IDs never need to appear in the web bundle.
 *
 * If BuildConfig.APPLOVIN_SDK_KEY is blank (no android/applovin.properties,
 * or one that hasn't been filled in yet), initialize() resolves
 * { available: false } without ever touching the AppLovin SDK, and every
 * show* method resolves as "unavailable" immediately -- the same safe
 * no-op path AdsManager.ts already relies on for unsupported platforms, so
 * a checkout without real AppLovin credentials still builds and runs with
 * ads simply absent.
 *
 * Every field here is only ever read or written on the main thread
 * (PluginMethod bodies hop onto it via runOnUiThread; the AppLovin SDK's
 * own ad listener callbacks already fire on the main thread), so none of
 * it needs synchronization.
 */
@CapacitorPlugin(name = "AppLovin")
public class AppLovinPlugin extends Plugin {

    private static final long LOAD_TIMEOUT_MS = 10_000;
    private static final long MAX_RETRY_BACKOFF_MS = 64_000;
    private static final int BANNER_HEIGHT_DP = 50;

    private boolean sdkAvailable = false;
    private boolean initStarted = false;

    private MaxAdView bannerView;
    private MaxInterstitialAd interstitialAd;
    private MaxRewardedAd rewardedAd;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private PluginCall pendingInterstitialCall;
    private boolean interstitialWaitingForLoad;
    private int interstitialRetryAttempt;

    private PluginCall pendingRewardedCall;
    private boolean rewardedWaitingForLoad;
    private boolean rewardEarned;
    private int rewardedRetryAttempt;

    // ---- Init ---------------------------------------------------------

    @PluginMethod
    public void initialize(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (initStarted) {
                resolveAvailability(call);
                return;
            }
            initStarted = true;

            String sdkKey = BuildConfig.APPLOVIN_SDK_KEY;
            if (sdkKey == null || sdkKey.trim().isEmpty()) {
                sdkAvailable = false;
                resolveAvailability(call);
                return;
            }

            if (BuildConfig.META_ENABLED) {
                configureMeta();
            }

            Activity activity = getActivity();
            AppLovinSdkInitializationConfiguration initConfig =
                    AppLovinSdkInitializationConfiguration.builder(sdkKey)
                            .setMediationProvider(AppLovinMediationProvider.MAX)
                            .build();

            AppLovinSdk.getInstance(activity).initialize(
                    initConfig,
                    new AppLovinSdk.SdkInitializationListener() {
                        @Override
                        public void onSdkInitialized(final AppLovinSdkConfiguration sdkConfig) {
                            sdkAvailable = true;
                            resolveAvailability(call);
                        }
                    }
            );
        });
    }

    // Meta wants its data-processing options set before MAX initializes it;
    // empty = Limited Data Use off. Reflection because the Meta SDK is only on
    // the classpath when metaEnabled=true (see app/build.gradle).
    private void configureMeta() {
        try {
            Class.forName("com.facebook.ads.AdSettings")
                    .getMethod("setDataProcessingOptions", String[].class)
                    .invoke(null, (Object) new String[] {});
        } catch (Exception ignored) {
            // Adapter missing or API changed; MAX still runs without Meta.
        }
    }

    private void resolveAvailability(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", sdkAvailable);
        call.resolve(result);
    }

    /** Resolves the call as "unavailable" (matching each method's success-shape) and returns false. */
    private boolean requireAvailable(PluginCall call, boolean rewardedShape) {
        if (sdkAvailable) return true;
        JSObject result = new JSObject();
        if (rewardedShape) result.put("rewarded", false);
        call.resolve(result);
        return false;
    }

    // ---- Banner ---------------------------------------------------------

    @PluginMethod
    public void showBanner(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!requireAvailable(call, false)) return;
            if (bannerView == null) {
                bannerView = createBannerView();
            }
            bannerView.setVisibility(View.VISIBLE);
            bannerView.loadAd();
            call.resolve();
        });
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (bannerView != null) {
                bannerView.setVisibility(View.GONE);
            }
            call.resolve();
        });
    }

    private MaxAdView createBannerView() {
        Activity activity = getActivity();
        MaxAdView adView = new MaxAdView(BuildConfig.APPLOVIN_BANNER_AD_UNIT_ID, activity);
        adView.setListener(new MaxAdViewAdListener() {
            @Override public void onAdLoaded(MaxAd maxAd) {}
            @Override public void onAdLoadFailed(String adUnitId, MaxError error) {}
            @Override public void onAdDisplayFailed(MaxAd maxAd, MaxError error) {}
            @Override public void onAdClicked(MaxAd maxAd) {}
            @Override public void onAdExpanded(MaxAd maxAd) {}
            @Override public void onAdCollapsed(MaxAd maxAd) {}
            @Override public void onAdDisplayed(MaxAd maxAd) {}
            @Override public void onAdHidden(MaxAd maxAd) {}
        });

        float density = activity.getResources().getDisplayMetrics().density;
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, (int) (BANNER_HEIGHT_DP * density));
        params.gravity = Gravity.BOTTOM;
        adView.setLayoutParams(params);

        ViewGroup rootView = activity.findViewById(android.R.id.content);
        rootView.addView(adView);
        return adView;
    }

    // ---- Interstitial ---------------------------------------------------

    @PluginMethod
    public void showInterstitial(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!requireAvailable(call, false)) return;

            ensureInterstitialAd();
            // Don't strand an earlier caller if one is somehow still in flight.
            finishPendingInterstitial();
            pendingInterstitialCall = call;

            if (interstitialAd.isReady()) {
                interstitialAd.showAd();
            } else {
                interstitialWaitingForLoad = true;
                interstitialAd.loadAd();
                mainHandler.postDelayed(() -> finishInterstitialIfWaitingOn(call), LOAD_TIMEOUT_MS);
            }
        });
    }

    private void finishInterstitialIfWaitingOn(PluginCall call) {
        if (pendingInterstitialCall == call && interstitialWaitingForLoad) {
            interstitialWaitingForLoad = false;
            pendingInterstitialCall = null;
            call.resolve();
        }
    }

    private void finishPendingInterstitial() {
        if (pendingInterstitialCall != null) {
            pendingInterstitialCall.resolve();
            pendingInterstitialCall = null;
        }
    }

    private void ensureInterstitialAd() {
        if (interstitialAd != null) return;
        Activity activity = getActivity();
        interstitialAd = new MaxInterstitialAd(BuildConfig.APPLOVIN_INTERSTITIAL_AD_UNIT_ID, activity);
        interstitialAd.setListener(new MaxAdListener() {
            @Override
            public void onAdLoaded(MaxAd maxAd) {
                interstitialRetryAttempt = 0;
                if (interstitialWaitingForLoad) {
                    interstitialWaitingForLoad = false;
                    interstitialAd.showAd();
                }
            }

            @Override
            public void onAdLoadFailed(String adUnitId, MaxError error) {
                boolean wasWaiting = interstitialWaitingForLoad;
                interstitialWaitingForLoad = false;
                if (wasWaiting) finishPendingInterstitial();
                scheduleInterstitialRetry();
            }

            @Override
            public void onAdDisplayFailed(MaxAd maxAd, MaxError error) {
                finishPendingInterstitial();
                interstitialAd.loadAd();
            }

            @Override public void onAdDisplayed(MaxAd maxAd) {}
            @Override public void onAdClicked(MaxAd maxAd) {}

            @Override
            public void onAdHidden(MaxAd maxAd) {
                finishPendingInterstitial();
                interstitialAd.loadAd();
            }
        });
        interstitialAd.loadAd();
    }

    private void scheduleInterstitialRetry() {
        interstitialRetryAttempt++;
        long delay = Math.min(MAX_RETRY_BACKOFF_MS,
                TimeUnit.SECONDS.toMillis((long) Math.pow(2, Math.min(6, interstitialRetryAttempt))));
        mainHandler.postDelayed(() -> {
            if (interstitialAd != null) interstitialAd.loadAd();
        }, delay);
    }

    // ---- Rewarded ---------------------------------------------------------

    @PluginMethod
    public void showRewarded(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!requireAvailable(call, true)) return;

            ensureRewardedAd();
            finishPendingRewarded(); // don't strand an earlier caller
            pendingRewardedCall = call;
            rewardEarned = false;

            if (rewardedAd.isReady()) {
                rewardedAd.showAd();
            } else {
                rewardedWaitingForLoad = true;
                rewardedAd.loadAd();
                mainHandler.postDelayed(() -> finishRewardedIfWaitingOn(call), LOAD_TIMEOUT_MS);
            }
        });
    }

    private void finishRewardedIfWaitingOn(PluginCall call) {
        if (pendingRewardedCall == call && rewardedWaitingForLoad) {
            rewardedWaitingForLoad = false;
            resolveRewarded(call, false);
            pendingRewardedCall = null;
        }
    }

    private void finishPendingRewarded() {
        if (pendingRewardedCall != null) {
            resolveRewarded(pendingRewardedCall, rewardEarned);
            pendingRewardedCall = null;
        }
    }

    private void resolveRewarded(PluginCall call, boolean rewarded) {
        JSObject result = new JSObject();
        result.put("rewarded", rewarded);
        call.resolve(result);
    }

    private void ensureRewardedAd() {
        if (rewardedAd != null) return;
        Activity activity = getActivity();
        rewardedAd = MaxRewardedAd.getInstance(BuildConfig.APPLOVIN_REWARDED_AD_UNIT_ID, activity);
        rewardedAd.setListener(new MaxRewardedAdListener() {
            @Override
            public void onAdLoaded(MaxAd maxAd) {
                rewardedRetryAttempt = 0;
                if (rewardedWaitingForLoad) {
                    rewardedWaitingForLoad = false;
                    rewardedAd.showAd();
                }
            }

            @Override
            public void onAdLoadFailed(String adUnitId, MaxError error) {
                boolean wasWaiting = rewardedWaitingForLoad;
                rewardedWaitingForLoad = false;
                if (wasWaiting) finishPendingRewarded();
                scheduleRewardedRetry();
            }

            @Override
            public void onAdDisplayFailed(MaxAd maxAd, MaxError error) {
                finishPendingRewarded();
                rewardedAd.loadAd();
            }

            @Override public void onAdDisplayed(MaxAd maxAd) {}
            @Override public void onAdClicked(MaxAd maxAd) {}

            @Override
            public void onAdHidden(MaxAd maxAd) {
                finishPendingRewarded();
                rewardedAd.loadAd();
            }

            @Override
            public void onUserRewarded(MaxAd maxAd, MaxReward reward) {
                rewardEarned = true;
            }
        });
        rewardedAd.loadAd();
    }

    private void scheduleRewardedRetry() {
        rewardedRetryAttempt++;
        long delay = Math.min(MAX_RETRY_BACKOFF_MS,
                TimeUnit.SECONDS.toMillis((long) Math.pow(2, Math.min(6, rewardedRetryAttempt))));
        mainHandler.postDelayed(() -> {
            if (rewardedAd != null) rewardedAd.loadAd();
        }, delay);
    }
}
