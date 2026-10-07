import { Capacitor } from "@capacitor/core";
import { PlayGames } from "../platform/PlayGames";
import { mergeSaves, type CloudData } from "../platform/mergeSaves";
import type { SaveData } from "../platform/PlatformAdapter";
import { EventBus } from "./EventBus";

// Google Play Games Saved Games, layered on the on-device save: the device
// copy is always written first (WebAdapter), and the cloud copy follows a
// moment later. At launch the two are merged (best scores, furthest levels),
// so a reinstall or a new phone gets everything back once the player is
// signed in to Play Games. With no Play Games plugin in the build (Huawei,
// web, or no project ID yet) every call is a quiet no-op.

const PUSH_DELAY_MS = 2_000;

export const SAVE_DATA_CHANGED = "saveDataChanged";

class CloudSaveImpl {
  private available = Capacitor.getPlatform() === "android";
  private synced = false;
  private queued: CloudData | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  /** Merges the cloud save into the device save. `apply` stores the merged
   * result locally (which pushes it back up) and is only called if the cloud
   * had something the device didn't. Never throws. */
  async syncAtLaunch(local: SaveData, apply: (merged: SaveData) => Promise<void>): Promise<void> {
    if (!this.available) return;
    try {
      const { ok, data } = await PlayGames.load();
      if (!ok) return; // Not signed in or offline; device save only this session.
      this.synced = true;
      const cloud = data ? (JSON.parse(data) as Partial<CloudData>) : null;
      const merged = mergeSaves(local, cloud);
      if (JSON.stringify(merged) !== JSON.stringify(local)) {
        await apply(merged);
        EventBus.emit(SAVE_DATA_CHANGED, merged);
      } else {
        this.push(local);
      }
    } catch {
      this.available = false; // No Play Games plugin in this build.
    }
  }

  /** Uploads the save shortly after it changes; bursts collapse into one write. */
  push(data: SaveData): void {
    // Until the launch merge has run, pushing could overwrite a richer cloud
    // copy (e.g. right after a reinstall), so hold off.
    if (!this.available || !this.synced) return;
    this.queued = { highScores: data.highScores, progress: data.progress };
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      const payload = this.queued;
      this.queued = null;
      if (payload) PlayGames.save({ data: JSON.stringify(payload) }).catch(() => undefined);
    }, PUSH_DELAY_MS);
  }
}

export const CloudSave = new CloudSaveImpl();
