import { registerPlugin } from "@capacitor/core";

// Bridges to android/app/src/playgames/java/.../PlayGamesPlugin.java, which
// is only built in when a Play Games project ID is set (see
// android/app/build.gradle). Without it every call rejects with "not
// implemented" and CloudSave.ts falls back to device-only saves.
export interface PlayGamesPlugin {
  isSignedIn(): Promise<{ signedIn: boolean }>;
  signIn(): Promise<{ signedIn: boolean }>;
  /** data is null when the cloud save exists but is empty (first run). */
  load(): Promise<{ ok: boolean; data?: string | null }>;
  save(options: { data: string }): Promise<{ ok: boolean }>;
}

export const PlayGames = registerPlugin<PlayGamesPlugin>("PlayGames");
