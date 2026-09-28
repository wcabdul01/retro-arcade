import { Preferences } from "@capacitor/preferences";

const KEY = "retro-arcade-settings";

// Contrast is applied as a CSS filter on the game canvas, so every screen in
// every game picks it up uniformly without any per-game color code.
export const CONTRAST_LEVELS = [80, 100, 120, 140, 160];
const DEFAULT_CONTRAST_INDEX = 1; // 100%

interface SettingsData {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  contrastIndex: number;
  /** Game titles whose how-to-play card has auto-shown once already. */
  seenHowToPlay: string[];
  /** Finished games (any game over / win), for review prompt timing. */
  gamesCompleted: number;
  reviewPromptsShown: number;
}

const DEFAULT_SETTINGS: SettingsData = {
  soundEnabled: true,
  vibrationEnabled: true,
  contrastIndex: DEFAULT_CONTRAST_INDEX,
  seenHowToPlay: [],
  gamesCompleted: 0,
  reviewPromptsShown: 0,
};

function applyContrast(percent: number): void {
  if (typeof document === "undefined") return;
  const canvas = document.querySelector("#game-root canvas") as HTMLCanvasElement | null;
  if (canvas) canvas.style.filter = `contrast(${percent}%)`;
}

class SettingsStore {
  private data: SettingsData = { ...DEFAULT_SETTINGS };

  async load(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: KEY });
      if (value) {
        this.data = { ...DEFAULT_SETTINGS, ...JSON.parse(value) };
      }
    } catch {
      this.data = { ...DEFAULT_SETTINGS };
    }
    applyContrast(this.contrastPercent);
  }

  get soundEnabled(): boolean {
    return this.data.soundEnabled;
  }

  get vibrationEnabled(): boolean {
    return this.data.vibrationEnabled;
  }

  get contrastIndex(): number {
    return this.data.contrastIndex;
  }

  get contrastPercent(): number {
    return CONTRAST_LEVELS[this.data.contrastIndex] ?? 100;
  }

  hasSeenHowToPlay(gameTitle: string): boolean {
    return this.data.seenHowToPlay.includes(gameTitle);
  }

  markHowToPlaySeen(gameTitle: string): void {
    if (this.hasSeenHowToPlay(gameTitle)) return;
    this.data.seenHowToPlay = [...this.data.seenHowToPlay, gameTitle];
    this.persist();
  }

  get gamesCompleted(): number {
    return this.data.gamesCompleted;
  }

  get reviewPromptsShown(): number {
    return this.data.reviewPromptsShown;
  }

  recordGameCompleted(): void {
    this.data.gamesCompleted += 1;
    this.persist();
  }

  recordReviewPromptShown(): void {
    this.data.reviewPromptsShown += 1;
    this.persist();
  }

  setSoundEnabled(value: boolean): void {
    this.data.soundEnabled = value;
    this.persist();
  }

  setVibrationEnabled(value: boolean): void {
    this.data.vibrationEnabled = value;
    this.persist();
  }

  cycleContrast(): void {
    this.data.contrastIndex = (this.data.contrastIndex + 1) % CONTRAST_LEVELS.length;
    applyContrast(this.contrastPercent);
    this.persist();
  }

  private persist(): void {
    void Preferences.set({ key: KEY, value: JSON.stringify(this.data) });
  }
}

export const Settings = new SettingsStore();
