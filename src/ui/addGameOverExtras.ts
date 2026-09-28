import Phaser from "phaser";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { GAME_WIDTH } from "../config/AppConfig";
import { GAMES, type GameId } from "../hub/gameRegistry";
import { createButton } from "./createButton";
import { Settings } from "../systems/Settings";
import { canPromptReview, requestReview, storePageUrl } from "../systems/Store";
import { shouldPromptReview } from "../systems/reviewPrompt";

// Delay before the review sheet so the player sees their score first.
const REVIEW_DELAY_MS = 1200;

function canShare(): boolean {
  return Capacitor.isNativePlatform() || typeof navigator.share === "function";
}

async function shareScore(gameTitle: string, score: number): Promise<void> {
  const text = `I scored ${score} in ${gameTitle} on Retro Arcade! Can you beat it?`;
  const url = storePageUrl();
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title: "Retro Arcade", text, url, dialogTitle: "Share your score" });
    } else {
      await navigator.share({ title: "Retro Arcade", text, url });
    }
  } catch {
    // Player dismissed the share sheet.
  }
}

/** Call once from each game's GameOverScene.create(). Adds a SHARE button
 * at `shareY` (below the scene's own buttons), counts the finished game and
 * asks for a store review when due (see reviewPrompt.ts). */
export function addGameOverExtras(
  scene: Phaser.Scene,
  gameId: GameId,
  score: number,
  shareY: number,
  label = "Share Score"
): void {
  const gameTitle = GAMES.find((g) => g.id === gameId)?.title ?? "Retro Arcade";

  if (canShare()) {
    createButton(scene, GAME_WIDTH / 2, shareY, label, () => {
      void shareScore(gameTitle, score);
    });
  }

  Settings.recordGameCompleted();
  if (canPromptReview() && shouldPromptReview(Settings.gamesCompleted, Settings.reviewPromptsShown)) {
    Settings.recordReviewPromptShown();
    scene.time.delayedCall(REVIEW_DELAY_MS, () => void requestReview());
  }
}
