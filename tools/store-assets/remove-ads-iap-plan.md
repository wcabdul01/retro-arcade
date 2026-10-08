# Remove Ads ($9.99) + lobby Settings + Play Games cloud save: plan

Decided 2026-10-08. Ships together with the unsubmitted 1.4 changes (hold 1.4).

## Decisions (user)
- Price **$9.99**, one-time (non-consumable), product ID **`remove_ads`**.
- Google Play Billing on the Play build, Huawei IAP on the Huawei build.
  Each build must contain only its own store's billing SDK.
- After purchase: no banner, no full-screen ads, **and no "Watch Ad"
  options at all** (hide continue-by-ad buttons; hint/undo stop at 0).
- Lobby gets **SETTINGS** and **REMOVE ADS** buttons (Settings currently
  only opens from the pause menu).
- Progress saved to **Google Play Games** (Saved Games). Huawei: device only.

## User setup checklist
Google Play (Play Console → Retro Arcade):
1. [ ] Monetize with Play → payments profile / merchant account.
2. [ ] Products → In-app products → create `remove_ads`, "Remove Ads",
   $9.99 USD, Activate (needs a billing build uploaded to Internal testing first).
3. [ ] Settings → License testing → add your Gmail.
4. [ ] Grow users → Play Games Services → setup (new project), Android
   credential (OAuth consent screen), turn **Saved Games On**, send the
   numeric Project ID.

Huawei (AppGallery Connect → Retro Arcade):
5. [ ] Earn → In-App Purchases → enable (merchant service, bank/identity).
6. [ ] Products → add Non-consumable `remove_ads`, $9.99, activate.
7. [ ] Project settings → download `agconnect-services.json`, send it.
8. [ ] Users and permissions → Sandbox testing → add your Huawei ID.

## Status (2026-10-08): code done, waiting on store setup
Built and phone-tested (Play build): gear button (top-right of the lobby) opens Settings,
which holds REMOVE ADS (price shown when known) and
RESTORE PURCHASES ("NO PURCHASES FOUND" from Play); REMOVE ADS
reaches Play and reports "This item isn't available right now" until
`remove_ads` exists in Play Console. Version stays 1.4 (code 6), unsubmitted.

Builds:
- Play AAB: `npm run cap:sync`, `cd android && gradlew bundleRelease`
  -> android/app/build/outputs/bundle/release/app-release.aab (Play Billing 9.1.0, no HMS)
- Huawei APK: `npm run apk:huawei` (= cap:sync:huawei + `gradlew assembleRelease -Pstore=huawei`),
  copy to android/app/build/outputs/huawei/retro-arcade-1.4-huawei.apk, then `npm run cap:sync`
  again (HMS IAP 6.16.6.305, no Play Billing). App ID 119204471 is in the manifest, so
  no agconnect-services.json is needed.
- Play Games cloud save: Project ID 430095056932 is set in android/app/build.gradle
  (Cloud project retro-arcade-games-511002, Saved Games on, consent screen External).
  Two Android credentials: Play app-signing SHA-1 (18:DA:BC:...:8B:D3, used for new
  installs) and upload-key SHA-1 (8B:FA:B7:...:B3:BF, for adb test builds).
  Verified on phone 2026-10-08: sign-in, snapshot load and save OK.
  The Play Games project is still a Draft: publish it with the 1.4 release.
- Version is now 1.4 (code 7); code 6 was used by the first Internal testing upload.

Design notes:
- The purchase itself is not stored in the cloud save: the store is the record
  (restored at every launch; a refund removes it). Cloud save holds high scores
  and Brick Breaker level progress, merged best-of-both (src/platform/mergeSaves.ts).
- Buyers: no banner/interstitials, no "Watch Ad: Continue", hint/undo stop at 0.

## Implementation (done)
- Native Capacitor plugin `Billing`, same pattern as `LevelPlayPlugin`:
  - Play: `android/app/src/play/java/.../BillingPlugin.java`, Play Billing
    Library 8+ (v8 required for updates since 31 Aug 2026; latest 9.1.0).
  - Huawei: `android/app/src/huawei/java/.../BillingPlugin.java`,
    `com.huawei.hms:iap` 6.16.x + AGConnect plugin + huawei maven repo.
  - Choose source set + deps with a gradle property (`-Pstore=huawei` for
    the Huawei APK), so the Play AAB never contains HMS IAP.
  - Methods: `getProduct` (localized price), `purchase`, `restore`
    (query owned purchases at boot; acknowledge Play purchases).
- `src/systems/Purchases.ts`: replace the free placeholder with the real
  flow; boot-time restore sets `SaveData.noAdsPurchased`.
- `AdsManager`: expose `isAdFree`; game-over scenes hide "Watch Ad:
  Continue"; Memory Match / Solitaire / Sudoku hint/undo show 0 with no AD.
- Hub: SETTINGS + REMOVE ADS row above EXIT; Settings: RESTORE PURCHASES.
- Play Games: `PlayGamesPlugin` (play source set only), `play-services-games-v2`,
  Snapshots open/read/write; APP_ID from a committed config property, off
  until filled. Merge cloud + local: max high scores, max progress levels,
  noAds = either true.
- Remove/replace `OfflineBlockScene` "REMOVE ADS - $10 (TEST MODE)" placeholder.
- Data safety / privacy policy: add purchase + Play Games data if needed.

Sources: Play Billing deprecation FAQ
(https://developer.android.com/google/play/billing/deprecation-faq),
HMS IAP maven (https://mvnrepository.com/artifact/com.huawei.hms/iap),
Play Games v2 maven (https://mvnrepository.com/artifact/com.google.android.gms/play-services-games-v2).

## Data safety additions for 1.4 (draft, 2026-10-08)
Keep every Unity ads answer from 1.3 (ads-levelplay.md). Add:

| Data type | Collected / shared | Why | Optional? | Source |
|---|---|---|---|---|
| Personal info > User IDs (Play Games player ID) | Collected, not shared | App functionality | Optional (only if signed in to Play Games) | Play Games Services |
| App activity > Other actions (high scores, level progress in Saved Games) | Collected, not shared | App functionality | Optional | Play Games Saved Games |
| Financial info > Purchase history (Remove Ads ownership) | Collected, not shared | App functionality | Optional (only buyers) | Google Play Billing |
| App info and performance > Diagnostics | Collected, not shared | Analytics (SDK stability) | Required | Play Games SDK (Google says it collects diagnostics automatically) |

Security answers stay: encrypted in transit = Yes; users can request deletion = Yes
(Play Games data via the Play Games profile / Google Account).
Sources: https://developer.android.com/games/pgs/data-collection ,
https://support.google.com/googleplay/android-developer/answer/10787469
Privacy policy updated (docs/privacy-policy.html, effective Oct 8, 2026): commit 99cd2ee, not pushed yet.
