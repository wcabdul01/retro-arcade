# Retro Arcade — Huawei AppGallery listing

Paste-ready fields for AppGallery Connect → My apps → Retro Arcade →
App information. Setup steps: `apple-huawei-setup.md`.

## App name
Retro Arcade: 10 Classic Games

## Brief introduction (max 80 characters)
Snake, block puzzle, brick breaker, sudoku & more retro games. Plays offline!

(77 characters)

## Description (max 8000 characters)

Retro Arcade packs 10 classic arcade games into one free app with a nostalgic pixel-art look. No Wi-Fi needed, no account, no sign-in. Open the app, pick a game and play.

Snake, block puzzles, brick breaker, a space shooter, sudoku, solitaire and more, all in one download and all playable offline.

🕹️ 10 CLASSIC GAMES IN ONE

• BRICK BREAKER: Bounce the ball, smash every brick and clear 5 hand-built levels. The classic paddle-and-ball arcade game.

• BLOCK DROP: The falling block puzzle. Move and rotate the pieces, complete lines to clear them, and keep the stack from reaching the top.

• BLOCK RISE: A twist on the block puzzle. Rows push up from the bottom, so clear them before they reach the top.

• SNAKE: The retro snake game. Eat, grow longer and speed up, but don't hit the walls or your own tail.

• TANK WAR: Drive your tank through a maze of breakable walls and blast the enemy tanks before they get you.

• RACING: An endless car racing game. Weave between lanes, dodge traffic and hold BOOST for a high score.

• STAR DEFENDER: A retro space shooter. Hold the line against wave after wave of the invading alien fleet.

• MEMORY MATCH: A brain-training card game. Flip tiles, find every matching pair and beat the clock, with 5 difficulty levels.

• SUDOKU: The classic number puzzle, from Easy to Master. Five mistakes allowed, plus hints and undo.

• SOLITAIRE: Classic Klondike card solitaire. Build the tableau and move every card to the foundations, ace to king.

⭐ WHY PLAYERS LIKE RETRO ARCADE

• Offline games: play anywhere, with no internet or Wi-Fi needed
• 10 full games in a single small download
• Simple touch controls: an on-screen D-pad and action buttons
• High scores saved for every game, so you can beat your best
• A quick how-to-play card the first time you open each game
• Adjustable contrast, sound and vibration
• Share your high score with friends
• A clean, relaxing pixel look inspired by old handheld consoles

⏱️ PERFECT FOR SHORT BREAKS

Got two minutes on a commute, in a waiting room or on a coffee break? Play a quick round of snake or sudoku. Got longer? Chase a high score in the block puzzle or clear every brick breaker level. Retro Arcade is a relaxing game collection for kids and adults who love old-school, nostalgic games.

Download Retro Arcade and bring the classic arcade back to your pocket.

## Category
Games → Casual (alternative: Puzzle)

## Assets
- Icon (216×216): `tools/branding/output/icon-appgallery-216.png`
- Screenshots (1080×1920, upload in order):
  `tools/store-assets/screenshots/appgallery/01-hub.png` … `08-racing.png`
- APK: `android/app/build/outputs/huawei/retro-arcade-1.2-huawei.apk`
  (1.2, versionCode 3, signed with the release key). **Build it with
  `npm run cap:sync:huawei`**, not the Play build. That makes "Rate this app"
  open AppGallery instead of Google Play (see `src/systems/Store.ts`).

## URLs / contact
- Privacy policy: https://wcabdul01.github.io/retro-arcade/privacy-policy.html
- Support email: wcabdul01@gmail.com

## Declarations
- **Contains ads: No** for this APK — `android/applovin.properties` isn't
  filled in, so AppLovin never initializes and no ads are shown. Switch the
  declaration to *Yes* in the same update that enables AppLovin.
- **In-app purchases: No** (the Remove Ads purchase is disabled).
- **Content rating**: mild cartoon/fantasy violence (Tank War, Star
  Defender shoot pixel tanks/ships); no blood, no gambling, no user chat,
  no location, no personal data collected.
- **Distribution**: all regions **except Chinese mainland** (games there
  need an ICP filing + a game publishing licence).
- **Price**: Free.

## Trademark note
Don't use "Tetris", "Space Invaders", "Breakout", "Pac-Man" or other game
brand names anywhere in the title, description or keywords. Their owners
routinely get listings taken down. Use the generic terms instead:
block puzzle, falling blocks, space shooter, brick breaker.
