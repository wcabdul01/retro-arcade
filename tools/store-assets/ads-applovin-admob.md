# Ads: LevelPlay, AdSense/AdMob appeal, Meta

**2026-10-06: AppLovin stopped accepting new sign-ups, so mediation moved to
Unity LevelPlay.** The app key and 5 ad unit IDs are in the gitignored
`android/levelplay.properties` (template: `levelplay.properties.example`).
Ad units: Retro Banner, Retro Interstitial, Retro Reward Continue (1),
Retro Reward Hints (3), Retro Reward Undos (3). Privacy setting: COPPA
"Not directed". Sections 1 and 3 below are kept for history.

Prepared 2026-10-04. Retro Arcade is live on Google Play (1.2, versionCode 4, ad-free).

## Status

- AdSense/AdMob account: **closed by Google** for invalid traffic. Cause is
  most likely self-generated traffic on the 2018 Coursera practice blog
  https://irregulargypsy.blogspot.com (4 posts, Sept 1-9 2018).
- Blog checked 2026-10-04: no `adsbygoogle` / `ca-pub-` code on the
  homepage (desktop + `?m=1`) or posts, no ads.txt. Nothing to remove.
- Retro Arcade only ever used Google's sample test IDs
  (`ca-app-pub-3940256099942544/...`, `isTesting: true`) before ads were
  disabled in d4326f1. It never served live AdMob ads.

## To do (user)

1. [ ] Send the AppLovin email (section 1).
2. [ ] Find the publisher ID (`pub-...`): closure notice, Payments page, or
   old AdSense emails in Gmail (search `pub-`).
3. [ ] Submit the appeal (section 2):
   https://support.google.com/adsense/contact/appeal_form_adsense_admob
   Usually only one appeal is considered, so double-check every answer.
4. [ ] Check Payments for a possible final payment.
5. [ ] Do **not** open a new AdSense/AdMob account (see section 3).

---

## 1. AppLovin email

**Subject:** Account review request: Retro Arcade is now live on Google Play

Hello AppLovin team,

I signed up for an AppLovin MAX account with wcabdul01@gmail.com. My app is
now published on Google Play, and I'd like to ask for my account to be
reviewed and activated so I can start integrating MAX.

**App details**
- App name: Retro Arcade
- Platform: Android
- Package name: com.retroarcade.app
- Google Play link: https://play.google.com/store/apps/details?id=com.retroarcade.app
- Category: Games, Casual (10 offline retro mini-games)
- Privacy policy: https://wcabdul01.github.io/retro-arcade/privacy-policy.html
- Developer website (for app-ads.txt): [your developer website from the Play Console]

**Planned ad formats:** banner, interstitial and rewarded video, all through
AppLovin MAX.

The app is also listed on Huawei AppGallery, and an iOS version is planned.
I'll add AppLovin to those builds later. I have additional games in
development that I plan to monetize with MAX once they're released.

Please let me know if you need anything else to complete the review, such as
company details, payment or tax information, or app-ads.txt verification.

Thank you,
[Your full name]
[Country]
wcabdul01@gmail.com

---

## 2. Invalid traffic appeal answers

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

---

## 3. AdMob options

Google's rule: publishers closed for invalid traffic "may not open a new
account". AdMob and AdSense share this enforcement, and related accounts
can be closed too.

| Option | Needs a Google account in good standing? | Verdict |
|---|---|---|
| A. Appeal, then AdMob as a bidder inside AppLovin MAX | Yes, the restored one | **Best if the appeal wins** |
| B. Appeal, then switch back to AdMob directly (`@capacitor-community/admob`) | Yes | Works, but loses MAX competition |
| C. Google advertisers via AppLovin MAX, without our own Google account | No | **Available now.** Google DV360 buys app inventory through AppLovin Exchange and MAX |
| D. Google Ad Manager / MCM through a partner (e.g. a GCPP) | Yes. Child publishers must have no previous disapproval | Not eligible while closed |
| E. New AdMob account (own name, family member, new company) | Violates the policy | **No.** Gets closed again and risks the Play developer account |
| F. Other mediation (Unity LevelPlay, Liftoff, Pangle...) with Google bidding | Yes, for the Google part | Same as A; non-Google networks work without it |

### Plan

1. **Now:** AppLovin MAX (code is ready; only `android/applovin.properties`
   is missing). Google advertisers still reach the app through DV360 →
   AppLovin Exchange (option C). Add more non-Google networks to MAX later
   (Unity Ads, Liftoff, Pangle, Meta Audience Network) for higher fill.
2. **If the appeal succeeds:** add the AdMob adapter to MAX
   (`com.applovin.mediation:google-adapter`, plus the AdMob App ID in
   `AndroidManifest.xml`) and create AdMob ad units tied to MAX. Gate it
   the same way as the AppLovin SDK (only built in when an AdMob App ID is
   configured). Update Data safety and app-ads.txt with Google's line.
3. **If the appeal fails:** keep MAX without AdMob. Google demand still
   bids through DV360.

## 4. Meta Audience Network (through MAX)

Meta Audience Network is bidding-only, so it can't be added as a separate
SDK integration. It runs as an adapter inside AppLovin MAX.

**Code:** `metaEnabled=true` in `android/levelplay.properties` adds the
LevelPlay Meta adapter (5.5.0) + Audience Network SDK (6.22.0) and sets
Meta's data processing options (Limited Data Use off) before init.
Default is off.

**User setup:**
1. [ ] Meta for Developers account: https://developers.facebook.com
2. [ ] Monetization Manager: https://business.facebook.com/pub → business portfolio.
3. [ ] Add the app (Android, Play Store URL). Meta reviews it.
4. [ ] Create 3 placements: Banner, Interstitial, Rewarded video
   (one rewarded placement can serve all 3 rewarded LevelPlay ad units).
   Note the **App ID** and **placement IDs**.
5. [ ] Add **Unity LevelPlay (ironSource)** as a bidding partner.
6. [ ] Payout: payment method + tax form.
7. [ ] LevelPlay → Setup → SDK Networks → Meta Audience Network: App ID at
   app level, placement ID on each ad unit instance.
8. Set `metaEnabled=true`, build, check with `testSuite=true`.
9. app-ads.txt: add the Facebook line.
10. Play Data safety + privacy policy: name Meta as an ad partner.

### Sources
- https://support.google.com/adsense/answer/57153
- https://support.google.com/admob/answer/6197403
- https://support.google.com/admanager/answer/9728004
- https://support.applovin.com/en/max/demand-partners/applovin-exchange-and-google-dv360
- https://ppc.land/google-introduces-new-mobile-app-inventory-and-fees-in-dv360/
- https://support.applovin.com/en/max/android/preparing-mediated-networks
