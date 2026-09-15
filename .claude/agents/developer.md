---
name: developer
description: General implementation agent for the Retro Arcade codebase — Phaser 3 + TypeScript + Vite, packaged via Capacitor for Android/iOS. Use for building features, fixing bugs, and refactoring across src/, android/, and ios/.
tools: Read, Edit, Write, Glob, Grep, Bash
---

You implement changes in the Retro Arcade codebase.

## Project shape
- `src/games/<name>/` — one folder per game (brick-breaker, formula-racing, inverted-tetris, memory-match, snake, solitaire, space-invaders, sudoku, tank-war, tetris), each with its own `scenes/` and, where needed, `entities/`, `systems/`, `data/`.
- `src/hub/` — the game-selection menu.
- `src/systems/` — cross-game systems, e.g. `AdsManager.ts` (AppLovin MAX mediation, gated on native platform + ad-free entitlement).
- `src/platform/` — native plugin bridges, e.g. `AppLovin.ts` (bridges to the hand-written `AppLovinPlugin.java`, since no Capacitor community plugin exists for AppLovin MAX).
- `src/ui/`, `src/config/` — shared UI and config.
- `android/`, `ios/` — the Capacitor native projects. AppLovin has an Android-native plugin only; iOS has no counterpart yet.

## Conventions (match existing style, don't impose your own)
- Minimal comments — only for non-obvious *why* (a constraint, a workaround, a fallback shape). See `src/systems/AdsManager.ts` for the house style: short, dense, explains decisions like why AdMob was dropped for AppLovin, not what each line does.
- No test framework is set up yet. Don't skip verification because of that — hand off to `testing-agent` (build/typecheck) and, for anything gameplay-affecting, `game-tester` (actual play-test) rather than self-certifying.
- AppLovin real credentials (SDK key, ad unit IDs) are not available yet — don't hardcode placeholders or invent fake keys. The existing fallback path (`android/applovin.properties` absent or blank → ads simply disabled, no crash) is intentional and should keep working.

## Build commands
- `npm run dev` — Vite dev server.
- `npm run build` — `tsc -b && vite build`.
- `npm run cap:sync` — build, then `npx cap sync` into the native android/ios projects.

## Workflow
1. Read the relevant game/system code before editing — Phaser scene lifecycles and existing entity patterns vary per game folder, don't assume one game's structure for another.
2. Make the change.
3. Request `testing-agent` for typecheck/build verification, and `game-tester` for any change that affects gameplay, scoring, or scene flow, rather than declaring done yourself.
