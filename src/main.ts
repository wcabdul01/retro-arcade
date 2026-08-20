import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "./config/AppConfig";
import { applyResponsiveScale } from "./platform/responsiveScale";
import { BootScene } from "./hub/BootScene";
import { HubScene } from "./hub/HubScene";
import { IntroScene } from "./hub/IntroScene";
import { OfflineBlockScene } from "./hub/OfflineBlockScene";
import { GameScene as BrickBreakerGameScene } from "./games/brick-breaker/scenes/GameScene";
import { UIScene as BrickBreakerUIScene } from "./games/brick-breaker/scenes/UIScene";
import { GameOverScene as BrickBreakerGameOverScene } from "./games/brick-breaker/scenes/GameOverScene";
import { GameScene as TetrisGameScene } from "./games/tetris/scenes/GameScene";
import { GameOverScene as TetrisGameOverScene } from "./games/tetris/scenes/GameOverScene";
import { GameScene as InvertedTetrisGameScene } from "./games/inverted-tetris/scenes/GameScene";
import { GameOverScene as InvertedTetrisGameOverScene } from "./games/inverted-tetris/scenes/GameOverScene";
import { GameScene as SnakeGameScene } from "./games/snake/scenes/GameScene";
import { GameOverScene as SnakeGameOverScene } from "./games/snake/scenes/GameOverScene";
import { GameScene as SpaceInvadersGameScene } from "./games/space-invaders/scenes/GameScene";
import { GameOverScene as SpaceInvadersGameOverScene } from "./games/space-invaders/scenes/GameOverScene";
import { DifficultyScene as MemoryMatchDifficultyScene } from "./games/memory-match/scenes/DifficultyScene";
import { GameScene as MemoryMatchGameScene } from "./games/memory-match/scenes/GameScene";
import { GameOverScene as MemoryMatchGameOverScene } from "./games/memory-match/scenes/GameOverScene";
import { GameScene as FormulaRacingGameScene } from "./games/formula-racing/scenes/GameScene";
import { GameOverScene as FormulaRacingGameOverScene } from "./games/formula-racing/scenes/GameOverScene";
import { GameScene as TankWarGameScene } from "./games/tank-war/scenes/GameScene";
import { GameOverScene as TankWarGameOverScene } from "./games/tank-war/scenes/GameOverScene";
import { DifficultyScene as SudokuDifficultyScene } from "./games/sudoku/scenes/DifficultyScene";
import { GameScene as SudokuGameScene } from "./games/sudoku/scenes/GameScene";
import { GameOverScene as SudokuGameOverScene } from "./games/sudoku/scenes/GameOverScene";
import { GameScene as SolitaireGameScene } from "./games/solitaire/scenes/GameScene";
import { GameOverScene as SolitaireGameOverScene } from "./games/solitaire/scenes/GameOverScene";
import { PauseScene } from "./hub/PauseScene";
import { HowToPlayScene } from "./hub/HowToPlayScene";
import { SettingsScene } from "./hub/SettingsScene";
import { LcdOverlayScene } from "./hub/LcdOverlayScene";

// Phaser draws text straight to canvas using whatever font is available at
// draw time. CSS's `font-display: swap` (see index.html) only re-renders
// DOM/CSS text when a web font finishes loading late — it does nothing for
// already-drawn canvas pixels, so a scene that renders text before "Press
// Start 2P" finishes loading can bake in the browser's fallback font
// permanently for that scene instance. Waiting on the font before booting
// closes the most obvious version of that race.
//
// KNOWN OPEN ISSUE, not fixed by this: on a cold launch, losing Snake
// almost instantly renders its Game Over buttons ("Play Again"/"Main
// Menu", via ui/createButton.ts) in the system fallback font instead of
// "Press Start 2P", while plain text in the very same scene/frame (e.g.
// "GAME OVER", "Score:") renders correctly. Reproduced deterministically
// on-device; NOT reproduced when the same Game Over screen is reached
// after a few seconds of real play (e.g. Tank War). Ruled out via live
// on-device diagnosis (Chrome DevTools over the WebView debug socket) and
// several targeted fixes, none of which changed the outcome:
//   - document.fonts.status was already "loaded" at the exact moment the
//     bug occurred, so it isn't a font-loading race in the JS-visible sense.
//   - Forcing a redraw (`.setText()`) after `document.fonts.ready` resolved
//     didn't correct it — the wrong font was still what got drawn.
//   - An artificial flat delay before boot, tested up to 5000ms (all local
//     assets, no network involved), didn't fix it either — ruling out
//     "just needs more wall-clock time to warm up" as the mechanism too.
// Cosmetic only (the buttons still work); root cause not found. Worth
// revisiting with more time — a next step would be comparing WebView/Skia
// versions across devices, since this may be device- or WebView-build-
// specific rather than a bug in this codebase's control.
const FONT_READY = document.fonts.load('12px "Press Start 2P"').catch(() => undefined);

function bootGame(): void {
  const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-root",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.BACKGROUND,
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  input: {
    activePointers: 3,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    HubScene,
    IntroScene,
    OfflineBlockScene,
    BrickBreakerGameScene,
    BrickBreakerUIScene,
    BrickBreakerGameOverScene,
    TetrisGameScene,
    TetrisGameOverScene,
    InvertedTetrisGameScene,
    InvertedTetrisGameOverScene,
    SnakeGameScene,
    SnakeGameOverScene,
    SpaceInvadersGameScene,
    SpaceInvadersGameOverScene,
    MemoryMatchDifficultyScene,
    MemoryMatchGameScene,
    MemoryMatchGameOverScene,
    FormulaRacingGameScene,
    FormulaRacingGameOverScene,
    TankWarGameScene,
    TankWarGameOverScene,
    SudokuDifficultyScene,
    SudokuGameScene,
    SudokuGameOverScene,
    SolitaireGameScene,
    SolitaireGameOverScene,
    PauseScene,
    HowToPlayScene,
    SettingsScene,
    LcdOverlayScene,
  ],
  });

  applyResponsiveScale(game);
}

void FONT_READY.then(bootGame);
