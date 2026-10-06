package com.retroarcade.app;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.unity3d.mediation.LevelPlay;
import com.unity3d.mediation.LevelPlayAdError;
import com.unity3d.mediation.LevelPlayAdInfo;
import com.unity3d.mediation.LevelPlayAdSize;
import com.unity3d.mediation.LevelPlayConfiguration;
import com.unity3d.mediation.LevelPlayInitError;
import com.unity3d.mediation.LevelPlayInitListener;
import com.unity3d.mediation.LevelPlayInitRequest;
import com.unity3d.mediation.banner.LevelPlayBannerAdView;
import com.unity3d.mediation.banner.LevelPlayBannerAdViewListener;
import com.unity3d.mediation.interstitial.LevelPlayInterstitialAd;
import com.unity3d.mediation.interstitial.LevelPlayInterstitialAdListener;
import com.unity3d.mediation.rewarded.LevelPlayReward;
import com.unity3d.mediation.rewarded.LevelPlayRewardedAd;
import com.unity3d.mediation.rewarded.LevelPlayRewardedAdListener;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Wraps the Unity LevelPlay Android SDK as a Capacitor plugin. There's no
 * maintained Capacitor plugin for LevelPlay, so this is a small hand-written
 * one exposing only what src/systems/AdsManager.ts needs: initialize, banner
 * show/hide, and load-then-show interstitial / rewarded. Rewarded has one ad
 * unit per reward ("continue", "hints", "undos") so LevelPlay reports revenue
 * per reward type.
 *
 * App key and ad unit IDs are read from BuildConfig (populated by
 * android/app/build.gradle from android/levelplay.properties, a gitignored
 * file -- see android/levelplay.properties.example) instead of being passed
 * from JS, so they never need to appear in the web bundle. This class is
 * only compiled in when that file has an app key; a blank ad unit ID just
 * makes that one format resolve as "unavailable".
 *
 * Every field here is only ever read or written on the main thread
 * (PluginMethod bodies hop onto it via runOnUiThread, and SDK callbacks are
 * posted onto it), so none of it needs synchronization.
 */
@CapacitorPlugin(name = "LevelPlay")
public class LevelPlayPlugin extends Plugin {

    private static final long LOAD_TIMEOUT_MS = 10_000;
    private static final long MAX_RETRY_BACKOFF_MS = 64_000;
    // Some networks report the reward just after the close event.
    private static final long REWARD_GRACE_MS = 1_500;
    private static final int BANNER_HEIGHT_DP = 50;

    private boolean sdkAvailable = false;
    private boolean initStarted = false;

    private LevelPlayBannerAdView bannerView;
    private FullscreenSlot interstitial;
    private final Map<String, FullscreenSlot> rewarded = new HashMap<>();

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    // ---- Init ---------------------------------------------------------

    @PluginMethod
    public void initialize(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (initStarted) {
                resolveAvailability(call);
                return;
            }
            initStarted = true;

            if (BuildConfig.LEVELPLAY_TEST_SUITE) {
                LevelPlay.setMetaData("is_test_suite", "enable");
            }

            Activity activity = getActivity();
            LevelPlayInitRequest request =
                    new LevelPlayInitRequest.Builder(BuildConfig.LEVELPLAY_APP_KEY).build();
            LevelPlay.init(activity, request, new LevelPlayInitListener() {
                @Override
                public void onInitSuccess(LevelPlayConfiguration configuration) {
                    mainHandler.post(() -> {
                        sdkAvailable = true;
                        createFullscreenSlots();
                        resolveAvailability(call);
                        if (BuildConfig.LEVELPLAY_TEST_SUITE) {
                            LevelPlay.launchTestSuite(getActivity());
                        }
                    });
                }

                @Override
                public void onInitFailed(LevelPlayInitError error) {
                    mainHandler.post(() -> resolveAvailability(call));
                }
            });
        });
    }

    private void resolveAvailability(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", sdkAvailable);
        call.resolve(result);
    }

    // Ad objects must not load before init succeeds, so they're created here.
    private void createFullscreenSlots() {
        if (!BuildConfig.LEVELPLAY_INTERSTITIAL_AD_UNIT_ID.isEmpty()) {
            interstitial = new InterstitialSlot(BuildConfig.LEVELPLAY_INTERSTITIAL_AD_UNIT_ID);
        }
        addRewardedSlot("continue", BuildConfig.LEVELPLAY_REWARDED_CONTINUE_AD_UNIT_ID);
        addRewardedSlot("hints", BuildConfig.LEVELPLAY_REWARDED_HINTS_AD_UNIT_ID);
        addRewardedSlot("undos", BuildConfig.LEVELPLAY_REWARDED_UNDOS_AD_UNIT_ID);
    }

    private void addRewardedSlot(String kind, String adUnitId) {
        if (!adUnitId.isEmpty()) {
            rewarded.put(kind, new RewardedSlot(adUnitId));
        }
    }

    // ---- Banner ---------------------------------------------------------

    @PluginMethod
    public void showBanner(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!sdkAvailable || BuildConfig.LEVELPLAY_BANNER_AD_UNIT_ID.isEmpty()) {
                call.resolve();
                return;
            }
            if (bannerView == null) {
                bannerView = createBannerView();
                bannerView.loadAd();
            } else {
                bannerView.resumeAutoRefresh();
            }
            bannerView.setVisibility(View.VISIBLE);
            call.resolve();
        });
    }

    @PluginMethod
    public void hideBanner(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (bannerView != null) {
                bannerView.setVisibility(View.GONE);
                bannerView.pauseAutoRefresh();
            }
            call.resolve();
        });
    }

    private LevelPlayBannerAdView createBannerView() {
        Activity activity = getActivity();
        LevelPlayBannerAdView.Config config = new LevelPlayBannerAdView.Config.Builder()
                .setAdSize(LevelPlayAdSize.BANNER)
                .build();
        LevelPlayBannerAdView adView =
                new LevelPlayBannerAdView(activity, BuildConfig.LEVELPLAY_BANNER_AD_UNIT_ID, config);
        adView.setBannerListener(new LevelPlayBannerAdViewListener() {
            @Override public void onAdLoaded(LevelPlayAdInfo adInfo) {}
            // The banner retries on its own refresh cycle.
            @Override public void onAdLoadFailed(LevelPlayAdError error) {}
        });

        float density = activity.getResources().getDisplayMetrics().density;
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, (int) (BANNER_HEIGHT_DP * density));
        params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        adView.setLayoutParams(params);

        ViewGroup rootView = activity.findViewById(android.R.id.content);
        rootView.addView(adView);
        return adView;
    }

    // ---- Interstitial / rewarded -----------------------------------------

    @PluginMethod
    public void showInterstitial(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (interstitial == null) {
                call.resolve();
                return;
            }
            interstitial.request(call);
        });
    }

    @PluginMethod
    public void showRewarded(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            FullscreenSlot slot = rewarded.get(call.getString("kind", "continue"));
            if (slot == null) {
                JSObject result = new JSObject();
                result.put("rewarded", false);
                call.resolve(result);
                return;
            }
            slot.request(call);
        });
    }

    /**
     * One full-screen ad unit: keeps an ad preloaded, and on request shows
     * it (loading first, up to LOAD_TIMEOUT_MS, if none is ready), resolving
     * the PluginCall once it closes or can't be shown.
     */
    private abstract class FullscreenSlot {
        private final boolean rewardedShape;
        private PluginCall pendingCall;
        private boolean loading;
        private boolean waitingForLoad;
        private boolean rewardEarned;
        private boolean closedAwaitingReward;
        private int retryAttempt;

        FullscreenSlot(boolean rewardedShape) {
            this.rewardedShape = rewardedShape;
        }

        abstract void loadAd();
        abstract boolean isAdReady();
        abstract void showAd(Activity activity);

        void request(PluginCall call) {
            finishPending(); // don't strand an earlier caller
            pendingCall = call;
            rewardEarned = false;
            if (isAdReady()) {
                showAd(getActivity());
            } else {
                waitingForLoad = true;
                load();
                mainHandler.postDelayed(() -> {
                    if (pendingCall == call && waitingForLoad) {
                        waitingForLoad = false;
                        finishPending();
                    }
                }, LOAD_TIMEOUT_MS);
            }
        }

        // LevelPlay rejects a second loadAd() while one is in flight.
        void load() {
            if (loading) return;
            loading = true;
            loadAd();
        }

        void onLoaded() {
            loading = false;
            retryAttempt = 0;
            if (waitingForLoad) {
                waitingForLoad = false;
                showAd(getActivity());
            }
        }

        void onLoadFailed() {
            loading = false;
            if (waitingForLoad) {
                waitingForLoad = false;
                finishPending();
            }
            retryAttempt++;
            long delay = Math.min(MAX_RETRY_BACKOFF_MS,
                    TimeUnit.SECONDS.toMillis((long) Math.pow(2, Math.min(6, retryAttempt))));
            mainHandler.postDelayed(this::load, delay);
        }

        void onDisplayFailed() {
            finishPending();
            load();
        }

        void onClosed() {
            PluginCall call = pendingCall;
            if (rewardedShape && !rewardEarned && call != null) {
                closedAwaitingReward = true;
                mainHandler.postDelayed(() -> {
                    if (pendingCall == call) finishPending();
                }, REWARD_GRACE_MS);
            } else {
                finishPending();
            }
            load();
        }

        void onRewarded() {
            rewardEarned = true;
            if (closedAwaitingReward) finishPending();
        }

        private void finishPending() {
            closedAwaitingReward = false;
            if (pendingCall == null) return;
            JSObject result = new JSObject();
            if (rewardedShape) result.put("rewarded", rewardEarned);
            pendingCall.resolve(result);
            pendingCall = null;
        }
    }

    private class InterstitialSlot extends FullscreenSlot {
        private final LevelPlayInterstitialAd ad;

        InterstitialSlot(String adUnitId) {
            super(false);
            ad = new LevelPlayInterstitialAd(adUnitId);
            ad.setListener(new LevelPlayInterstitialAdListener() {
                @Override public void onAdLoaded(LevelPlayAdInfo adInfo) { mainHandler.post(() -> onLoaded()); }
                @Override public void onAdLoadFailed(LevelPlayAdError error) { mainHandler.post(() -> onLoadFailed()); }
                @Override public void onAdDisplayed(LevelPlayAdInfo adInfo) {}
                @Override public void onAdDisplayFailed(LevelPlayAdError error, LevelPlayAdInfo adInfo) { mainHandler.post(() -> onDisplayFailed()); }
                @Override public void onAdClosed(LevelPlayAdInfo adInfo) { mainHandler.post(() -> onClosed()); }
            });
            load();
        }

        @Override void loadAd() { ad.loadAd(); }
        @Override boolean isAdReady() { return ad.isAdReady(); }
        @Override void showAd(Activity activity) { ad.showAd(activity); }
    }

    private class RewardedSlot extends FullscreenSlot {
        private final LevelPlayRewardedAd ad;

        RewardedSlot(String adUnitId) {
            super(true);
            ad = new LevelPlayRewardedAd(adUnitId);
            ad.setListener(new LevelPlayRewardedAdListener() {
                @Override public void onAdLoaded(LevelPlayAdInfo adInfo) { mainHandler.post(() -> onLoaded()); }
                @Override public void onAdLoadFailed(LevelPlayAdError error) { mainHandler.post(() -> onLoadFailed()); }
                @Override public void onAdDisplayed(LevelPlayAdInfo adInfo) {}
                @Override public void onAdDisplayFailed(LevelPlayAdError error, LevelPlayAdInfo adInfo) { mainHandler.post(() -> onDisplayFailed()); }
                @Override public void onAdRewarded(LevelPlayReward reward, LevelPlayAdInfo adInfo) { mainHandler.post(() -> onRewarded()); }
                @Override public void onAdClosed(LevelPlayAdInfo adInfo) { mainHandler.post(() -> onClosed()); }
            });
            load();
        }

        @Override void loadAd() { ad.loadAd(); }
        @Override boolean isAdReady() { return ad.isAdReady(); }
        @Override void showAd(Activity activity) { ad.showAd(activity); }
    }
}
