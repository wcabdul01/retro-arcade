# Ads: Unity LevelPlay (1.3), on-hold networks, AdMob appeal

Retro Arcade 1.2 (versionCode 4) is live on Google Play, built without ads.
**1.3 (versionCode 5) adds Unity ads only: Unity LevelPlay + Unity Ads.**
Meta and AdMob are on hold for a later update (see the end of this file).

## LevelPlay setup

- Dashboard: https://platform.ironsrc.com (app "Retro Arcade", Android)
- Privacy setting: COPPA **Not directed** (matches the privacy policy and
  a 13+ Play target audience)
- App key + ad unit IDs live in the gitignored `android/levelplay.properties`
  (template: `android/levelplay.properties.example`):

| Ad unit | Format | Reward | Used by |
|---|---|---|---|
| Retro Banner | Banner | - | Hub, pause screen |
| Retro Interstitial | Interstitial | - | Leaving a game from pause (max 1 per 60 s) |
| Retro Reward Continue | Rewarded | Continue x1 | Space Invaders, Tank War, Brick Breaker, Sudoku |
| Retro Reward Hints | Rewarded | Hints x3 | Memory Match, Solitaire, Sudoku |
| Retro Reward Undos | Rewarded | Undos x3 | Solitaire, Sudoku |

Networks in the build: Unity LevelPlay (ironSource Ads) and Unity Ads.

## Before the first ads build runs on a phone

- [ ] Register every test phone's advertising ID as a **test device** in
  LevelPlay. Never tap live ads on your own phone: that is what closed the
  AdSense account.
- [ ] Device test with `testSuite=true` (opens the LevelPlay Test Suite),
  then set it back to `false`.

## Release checklist (1.3, versionCode 5)

- [x] versionCode 5 / versionName 1.3 in `android/app/build.gradle`.
- [x] `docs/privacy-policy.html` names Unity LevelPlay + Unity Ads and the
  data they collect. Goes live once pushed to GitHub (GitHub Pages).
- [ ] Device test on a registered test phone (above).
- [ ] Play Console > App content:
  - **Ads:** Yes, my app contains ads.
  - **Advertising ID:** Yes. Purposes: Advertising or marketing, Analytics,
    Fraud prevention, security and compliance.
  - **Target audience:** stays 13+ (matches COPPA "Not directed").
  - **Data safety** (from Unity's official LevelPlay + Unity Ads answers):
    - Collects or shares required data: **Yes**. Encrypted in transit:
      **Yes**. Users can request deletion: **Yes** (via Unity's privacy policy).
    - For every type below: collected **and** shared, not processed
      ephemerally, **required**.

| Play category > type | Purposes |
|---|---|
| Location > Approximate location | Advertising or marketing, Analytics, App functionality, Fraud prevention, security and compliance |
| Personal info > User IDs | App functionality |
| Financial info > Purchase history | Advertising or marketing, Analytics |
| App activity > App interactions | Advertising or marketing, Analytics, Fraud prevention, security and compliance |
| App activity > Other actions | Advertising or marketing, Analytics, Fraud prevention, security and compliance |
| App info and performance > Diagnostics | App functionality, Analytics, Fraud prevention, security and compliance |
| Device or other IDs > Device or other IDs | Advertising or marketing, Analytics, App functionality, Fraud prevention, security and compliance |

- [ ] **app-ads.txt:** copy the lines LevelPlay shows for app-ads.txt and
  publish them at the root of the developer website listed in Play Console
  (`https://<site>/app-ads.txt`).
- [ ] Upload `android/app/build/outputs/bundle/release/app-release.aab` with
  the notes in `tools/store-assets/release-notes-1.3.md`.
- [ ] AppGallery: Huawei APK 1.3 (`npm run cap:sync:huawei`, then
  assembleRelease), **Contains ads: Yes**, privacy answers updated the same
  way.

## On hold for a later update: Meta, AdMob

Not in 1.3. Re-add each as a LevelPlay network (adapter + SDK pinned in
pairs from github.com/ironsource-mobile/levelplay-android-adapters), and
update the privacy policy, Data safety and app-ads.txt in the same release.

**Meta Audience Network:** needs a Meta for Developers account, the app
added in Monetization Manager (business.facebook.com/pub), Banner /
Interstitial / Rewarded placements, LevelPlay added as bidding partner,
then App ID + placement IDs in LevelPlay > Setup > SDK Networks. Last
working code: commit ef85f48 (`metaEnabled` switch).

### AdMob

The AdSense/AdMob account is **closed by Google** for invalid traffic,
most likely self-generated traffic on the 2018 Coursera practice blog
https://irregulargypsy.blogspot.com (checked 2026-10-04: no ad code left,
no ads.txt). Retro Arcade itself only ever used Google's sample test IDs.
Google's rule: publishers closed for invalid traffic "may not open a new
account", so **don't open a new AdSense/AdMob account** under any name.

- If the appeal succeeds: add AdMob as a network inside LevelPlay
  (LevelPlay AdMob adapter + AdMob App ID in the manifest), only compiled in
  when an AdMob App ID is configured.
- If it fails: LevelPlay keeps running without AdMob. Google's DV360
  advertisers can still buy through mediation partners such as LevelPlay.

To do:
1. [ ] Find the publisher ID (`pub-...`): closure notice, Payments page, or
   Gmail search `pub-`.
2. [ ] Submit the appeal (answers below):
   https://support.google.com/adsense/contact/appeal_form_adsense_admob
   Usually only one appeal is considered.
3. [ ] Check Payments for a possible final payment.

#### AdMob appeal answers

Form: https://support.google.com/adsense/contact/appeal_form_adsense_admob

**Name:** [full legal name, matching the payments profile]

**Publisher code:** [pub-XXXXXXXXXXXXXXXX]

**Contact email:** wcabdul01@gmail.com

**Example URLs or app ID:**
https://play.google.com/store/apps/details?id=com.retroarcade.app

**Have you ever purchased traffic?** No

**How do users get to your app, and how do you promote it?**

> Retro Arcade is a free, offline collection of 10 classic mini-games
> published on Google Play (com.retroarcade.app). Users find it organically
> through Google Play search and browsing. Before the public release, it was
> distributed to a small group of testers through Google Play's closed
> testing track. I have not used paid advertising, incentivized installs,
> traffic exchanges, bots or any third-party traffic sources.

**Have you ever violated AdSense/Ad Manager policies or terms? If so, how?**

> Not intentionally, but I believe I caused invalid activity by mistake. In
> 2018, while taking a Google Analytics course on Coursera, I used this
> account with a practice blog, https://irregulargypsy.blogspot.com, that
> had AdSense ads on it. To complete the course exercises, I repeatedly
> loaded and tested my own pages to check that Analytics was recording
> visits. At the time, I didn't understand that viewing or interacting with
> ads on my own pages counts as invalid traffic. I have never bought traffic
> or asked anyone to click ads. The app I want to monetize now, Retro
> Arcade, has never served live ads from this account. During development,
> it used only Google's official test ad units.

**What was the reason for the invalid activity?**

> The invalid activity most likely came from my own testing on my practice
> blog (https://irregulargypsy.blogspot.com) during a Google Analytics
> course on Coursera in 2018. I repeatedly visited and refreshed my own
> pages, which had my AdSense ads on them, to generate and check Analytics
> data. This was self-generated, non-genuine traffic, not real user
> interest, and I now understand why Google treats it as invalid. The blog
> was a short-lived learning project. Its last post was in September 2018,
> and it no longer shows any ads.

**What changes will you implement?**

> - The practice blog carries no ads and will stay that way.
> - I will never view or click live ads on my own properties. All my devices
>   and my testers' devices will be registered as AdMob test devices, and
>   development builds will use only Google's test ad units.
> - Live ad unit IDs will go only into signed release builds of my published
>   app.
> - Interstitial ads are capped at one per 60 seconds and shown only at
>   natural breaks, never during gameplay. Banners are kept away from game
>   controls, and rewarded ads are shown only when the user chooses to watch
>   one.
> - I will check AdMob reports regularly for unusual click-through rates or
>   traffic spikes and act on them immediately.

**Traffic logs or data:**

> I don't have logs from the 2018 practice blog to share. I believe the
> invalid activity came from my own repeated visits while doing the course
> exercises, rather than from an outside source. The blog has been inactive
> since September 2018 and no longer shows ads. My published app, Retro
> Arcade (com.retroarcade.app), has never served live ads from this account,
> so there is no live ad traffic from it.

## Sources
- https://support.google.com/adsense/answer/57153
- https://support.google.com/admob/answer/6197403
- https://docs.unity.com/en-us/grow/levelplay/platform/legal-resources/google-data-safety-questionnaire
- https://docs.unity.com/en-us/grow/ads/privacy/google-data-safety
- https://github.com/ironsource-mobile/levelplay-android-adapters
- https://ppc.land/google-introduces-new-mobile-app-inventory-and-fees-in-dv360/
