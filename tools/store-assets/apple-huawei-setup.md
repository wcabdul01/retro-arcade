# Retro Arcade — App Store (iOS) + Huawei AppGallery setup

Same app, same package/bundle ID (`com.retroarcade.app`), same version (1.1).
Listing copy: reuse `store-listing.md` (drop any "Play Store" wording).

- Privacy policy URL: https://wcabdul01.github.io/retro-arcade/privacy-policy.html
- Support URL: https://wcabdul01.github.io/retro-arcade/support.html
  (both served from `docs/` via GitHub Pages — push to `main` to publish)

---

## Apple App Store

The iOS build ships **without ads** for now (AdsManager only runs on
Android; a LevelPlay iOS plugin is a planned follow-up). EXIT buttons are
hidden on iOS. iPhone-only, portrait-only.

Built in the cloud by **Codemagic** (`codemagic.yaml`) — no Mac needed.

### 1. Apple Developer Program — $99/year
1. https://developer.apple.com/programs/enroll/ — sign in with an Apple ID
   that has two-factor auth on. Enrolling from the **Apple Developer app**
   on an iPhone is fastest (ID scan in-app).
2. Enroll as an **Individual** (no D-U-N-S number needed). Approval usually
   takes 1–2 days.

### 2. Create the app in App Store Connect
1. https://appstoreconnect.apple.com → **Apps → + → New App**
   - Platform: iOS · Name: `Retro Arcade` (if taken, e.g. `Retro Arcade: 10 Classics`)
   - Bundle ID: `com.retroarcade.app` — if it isn't in the dropdown, first
     register it at developer.apple.com → Certificates, IDs & Profiles →
     Identifiers → + → App IDs (no capabilities needed).
   - SKU: `retro-arcade-ios`
2. Open **App Information** and copy the numeric **Apple ID** → paste it into
   `codemagic.yaml` as `APP_STORE_APPLE_ID`, commit, push.

### 3. App Store Connect API key (lets Codemagic sign + upload)
1. App Store Connect → **Users and Access → Integrations → App Store Connect API**
   → Generate API Key, access **App Manager**.
2. Download the `.p8` file (only downloadable once — keep it safe, never
   commit it). Note the **Key ID** and **Issuer ID**.

### 4. Codemagic
1. https://codemagic.io → sign up with GitHub → add repo `wcabdul01/retro-arcade`.
   Pick "Capacitor"/"codemagic.yaml" config.
2. **Team settings → Integrations → Developer Portal → Connect**:
   name it exactly `Retro Arcade ASC key`, enter Issuer ID, Key ID, upload the `.p8`.
3. **Team settings → Code signing identities**:
   - iOS certificates → **Generate certificate** → type *Apple Distribution*,
     using the API key above.
   - iOS provisioning profiles → **Fetch profiles** → if none exists for
     `com.retroarcade.app`, create one at developer.apple.com → Profiles → +
     → *App Store Connect* → App ID `com.retroarcade.app` → the distribution
     certificate Codemagic generated, then fetch again.
4. Start a build: app → **Start new build** → workflow *iOS release (TestFlight)*.
   ~10–15 min. The build uploads to TestFlight automatically.

### 5. Test on your iPhone
Install **TestFlight** from the App Store; in App Store Connect → TestFlight
add yourself as an internal tester. Check: safe area around the notch /
Dynamic Island, every game's controls, sound, haptics.

### 6. Listing + submit
In App Store Connect → the app → iOS App 1.1:
- **Screenshots**: 6.9" iPhone, **1320 × 2868** portrait (3–10) —
  `screenshots/appstore/*.png` (see "Screenshots" below).
- Name: `Retro Arcade: 10 Classic Games` · Subtitle (30): `Snake, Sudoku & Block Puzzles`
- Description: the full description from `store-listing.md`.
- Keywords (97/100, no spaces after commas; Apple already indexes
  words in the name, so they're left out): `offline,snake,block,puzzle,brick,breaker,sudoku,solitaire,pixel,no wifi,tank,racing,space,shooter`
- Support URL, Privacy Policy URL (above).
- Category: **Games → Arcade** (secondary: Puzzle). Price: Free.
- **Age rating** questionnaire: *Infrequent/Mild Cartoon or Fantasy Violence*
  (Tank War, Star Defender) — everything else None.
- **App Privacy**: *Data Not Collected* (the iOS build has no ads/analytics).
  Update this when LevelPlay iOS ads are added.
- Pick the TestFlight build → **Add for Review** → Submit. Review is usually
  24–48 h.

---

## Huawei AppGallery

Uses the same code and release key as the Play build (1.2 / versionCode 4),
but built with `npm run cap:sync:huawei` so store links point to AppGallery. LevelPlay ads work on Huawei phones without Google services (lower
revenue — no Google advertising ID).

### 1. Huawei Developer account — free
1. https://developer.huawei.com/consumer/en/ → Sign up (Huawei ID).
2. **Identity verification** → Individual → ID/passport + bank card or
   selfie verification. Takes 1–3 working days.

### 2. Build the APK
Use the **Huawei** web build so "Rate this app" opens AppGallery rather than
Google Play:
```
npm run cap:sync:huawei
cd android
./gradlew assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release.apk`
(signed with the Play release key via `android/keystore.properties`).
Afterwards, run `npm run cap:sync` again before any Play build.

### 3. Create the app in AppGallery Connect
1. https://developer.huawei.com/consumer/en/service/josp/agc/index.html →
   **My apps → New** → Android, category **Game**, package
   `com.retroarcade.app`, default language English.
2. **App information**: copy every field from `appgallery-listing.md`
   (name, intro, description, icon, the 8 screenshots in
   `screenshots/appgallery/`, privacy policy URL, declarations).
3. **Version information → Software packages**: upload the APK. Leave
   *App signing* off when uploading an APK signed with your own key.
4. **Distribution**: countries/regions — **exclude Chinese mainland** (games
   there require an ICP filing + game licence). Content rating
   questionnaire: mild cartoon violence. Ads declaration: *No* until a
   build with LevelPlay ads ships (see `appgallery-listing.md`).
5. Submit for review — typically 3–5 working days for games.

---

## Screenshots
Captured from the real game in headless Chrome, then framed with captions:
```
npm run dev                                         # in one terminal
node tools/store-assets/capture_screenshots.mjs     # -> screenshots/hires-raw/
python tools/store-assets/compose_screenshots.py    # -> appgallery/ + appstore/
```
Per-game tap/key scripts live in `screenshot_scenarios.mjs`; captions and
order in `compose_screenshots.py`.

## Later
- LevelPlay iOS plugin (Swift) + App Tracking Transparency prompt + SKAdNetwork IDs.
