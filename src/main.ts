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
