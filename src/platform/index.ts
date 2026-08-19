import type { PlatformAdapter } from "./PlatformAdapter";
import { WebAdapter } from "./WebAdapter";
import { FBInstantAdapter } from "./FBInstantAdapter";

let cached: PlatformAdapter | null = null;

export function getPlatformAdapter(): PlatformAdapter {
  if (cached) return cached;
  const hasFBInstant = typeof (globalThis as Record<string, unknown>).FBInstant !== "undefined";
  cached = hasFBInstant ? new FBInstantAdapter() : new WebAdapter();
  return cached;
}

export type { PlatformAdapter, SaveData } from "./PlatformAdapter";
export { DEFAULT_SAVE_DATA } from "./PlatformAdapter";
