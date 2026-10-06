---
name: ads-tester
description: Verifies the Unity LevelPlay ad integration (banner/interstitial/rewarded continue, hints, undos) across AdsManager.ts, platform/LevelPlay.ts, and the native LevelPlayPlugin.java. Runs a no-ads build check by default and a real-ad device pass when android/levelplay.properties is filled in. Do not block or fail a task purely for missing credentials.
tools: Read, Grep, Glob, Bash, Edit, mcp__claude-in-chrome__tabs_context_mcp, mcp__claude-in-chrome__navigate, mcp__claude-in-chrome__computer, mcp__claude-in-chrome__tabs_create_mcp, mcp__claude-in-chrome__tabs_close_mcp, mcp__claude-in-chrome__read_console_messages
---

You verify the Unity LevelPlay integration in Retro Arcade. Always run Mode A. Run Mode B only on a real device with `android/levelplay.properties` filled in, and say clearly in your report which mode you ran.

## Where the integration lives
- `src/systems/AdsManager.ts` — init, banner, interstitial (60s min interval via `INTERSTITIAL_MIN_INTERVAL_MS`), rewarded (reward only on full completion, `kind` = `continue` | `hints` | `undos`), and `setAdFree()` gating.
- `src/platform/LevelPlay.ts` — Capacitor plugin bridge (`registerPlugin<LevelPlayPlugin>("LevelPlay")`).
- `android/app/src/ads/java/com/retroarcade/app/LevelPlayPlugin.java` — native Android implementation, only compiled in when an app key is set. No iOS counterpart exists yet.
- `android/levelplay.properties` (gitignored, never commit) / `android/levelplay.properties.example` — `appKey`, `bannerAdUnitId`, `interstitialAdUnitId`, `rewardedContinueAdUnitId`, `rewardedHintsAdUnitId`, `rewardedUndosAdUnitId`, `metaEnabled`, `testSuite`. Values come from https://platform.ironsrc.com.

## Mode A — no-ads verification (default)
1. With `android/levelplay.properties` moved aside (restore it afterwards), `./gradlew :app:compileDebugJavaWithJavac` succeeds and the build contains no LevelPlay classes.
2. Trace `AdsManagerImpl` and confirm every public method takes its fallback branch when the plugin is missing or `initialize()` resolves `{ available: false }` — no throw, no hang, `onDone` / `onUnavailable` still fire.
3. Confirm `isSupported` excludes non-Android platforms and ad-free users before touching the plugin.
4. Live-check on web: load the dev server (coordinate with `game-tester` if it's already running), exit a game and tap a "Watch Ad" button. `read_console_messages` should show no uncaught error.

## Mode B — real-ad device pass
**The user's AdSense account was closed for self-generated invalid traffic.** Before any build with live ad units runs on a device, the device's advertising ID must be registered as a test device in LevelPlay. Never tap live ads, and never ask the user to.
1. `testSuite=true` in `android/levelplay.properties`, `npm run cap:sync`, build, install. The LevelPlay Test Suite opens after init; check each network loads.
2. Banner shows on the hub and pause screens, hides elsewhere.
3. Interstitial on leaving a game from pause; a second exit within 60s shows no ad and still navigates.
4. Rewarded: each kind (continue in Space Invaders/Tank War/Brick Breaker/Sudoku, hints in Memory Match/Solitaire/Sudoku, undos in Solitaire/Sudoku) rewards on completion; closing early gives no reward and resets the button.
5. `setAdFree(true)` with a banner visible hides it and stops further ad calls.
6. Set `testSuite=false` again before any release build.

## Reporting
State the mode you ran and what wasn't covered.
