# Ads: Unity LevelPlay, Meta, AdMob appeal

Retro Arcade 1.2 (versionCode 4) is live on Google Play, built without ads.
The next update adds ads through **Unity LevelPlay** (code: commit ef85f48).

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

Networks in the build: LevelPlay (ironSource Ads), Unity Ads, and Meta
Audience Network when `metaEnabled=true`.

## Before the first ads build runs on a phone

- [ ] Register every test phone's advertising ID as a **test device** in
  LevelPlay. Never tap live ads on your own phone: that is what closed the
  AdSense account.
- [ ] Device test with `testSuite=true` (opens the LevelPlay Test Suite),
  then set it back to `false`.

## Release checklist (v1.3, versionCode 5)

- [ ] Bump versionCode/versionName in `android/app/build.gradle`.
- [ ] `docs/privacy-policy.html`: name Unity LevelPlay, Unity Ads (and Meta
  if enabled) and the data they collect (advertising ID, device info,
  approximate location, ad interactions).
- [ ] Play Console: Contains ads = Yes; Advertising ID = Yes (advertising);
  Data safety = Device or other IDs + App interactions + approximate
  location, shared with ad partners.
- [ ] app-ads.txt on the developer website with the LevelPlay / Unity
  (and Meta) lines from their dashboards.
- [ ] AppGallery: Contains ads = Yes for the Huawei build.

## Meta Audience Network

Meta is bidding-only and runs as an adapter inside LevelPlay.
`metaEnabled=true` adds the LevelPlay Meta adapter (5.5.0) + Audience
Network SDK (6.22.0) and sets Meta's data processing options (Limited
Data Use off) before init. Default is off.

1. [ ] Meta for Developers account: https://developers.facebook.com
2. [ ] Monetization Manager: https://business.facebook.com/pub, then create a
   business portfolio.
3. [ ] Add the app (Android, Play Store URL). Meta reviews it.
4. [ ] Create placements: Banner, Interstitial, Rewarded video. Note the
   **App ID** and **placement IDs**.
5. [ ] Add **Unity LevelPlay (ironSource)** as a bidding partner.
6. [ ] Payout: payment method + tax form.
7. [ ] LevelPlay > Setup > SDK Networks > Meta Audience Network: App ID at
   app level, placement ID on each ad unit instance.
8. Set `metaEnabled=true`, build, check with `testSuite=true`.

## AdMob

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

## 1. AdSense/AdMob invalid traffic appeal

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
- https://docs.unity.com/en-us/grow/levelplay/sdk/android/networks/guides/meta-audience-network
- https://github.com/ironsource-mobile/levelplay-android-adapters
- https://ppc.land/google-introduces-new-mobile-app-inventory-and-fees-in-dv360/
