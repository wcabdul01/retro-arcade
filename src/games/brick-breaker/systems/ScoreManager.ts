import { EventBus } from "../../../systems/EventBus";
import { BB_EVENTS } from "./events";
import { GAMEPLAY } from "../config";

export class ScoreManager {
  score = 0;
  lives = GAMEPLAY.START_LIVES;
  levelIndex = 0;

  reset(levelIndex = 0): void {
    this.score = 0;
    this.lives = GAMEPLAY.START_LIVES;
    this.levelIndex = levelIndex;
    EventBus.emit(BB_EVENTS.SCORE_CHANGED, this.score);
    EventBus.emit(BB_EVENTS.LIVES_CHANGED, this.lives);
    EventBus.emit(BB_EVENTS.LEVEL_CHANGED, this.levelIndex);
  }

  addScore(points: number): void {
    this.score += points;
    EventBus.emit(BB_EVENTS.SCORE_CHANGED, this.score);
  }

  loseLife(): boolean {
    this.lives -= 1;
    EventBus.emit(BB_EVENTS.LIVES_CHANGED, this.lives);
    return this.lives <= 0;
  }

  addLife(): void {
    this.lives += 1;
    EventBus.emit(BB_EVENTS.LIVES_CHANGED, this.lives);
  }

  setLevel(index: number): void {
    this.levelIndex = index;
    EventBus.emit(BB_EVENTS.LEVEL_CHANGED, this.levelIndex);
  }
}
