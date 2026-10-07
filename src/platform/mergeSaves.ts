import type { SaveData } from "./PlatformAdapter";

/** The part of SaveData kept in the cloud. The Remove Ads purchase is not:
 * the store itself is the record of it (Purchases.ts restores it). */
export type CloudData = Pick<SaveData, "highScores" | "progress">;

function mergeRecords<K extends string, V>(a: Partial<Record<K, V>>, b: Partial<Record<K, V>>, pick: (x: V, y: V) => V) {
  const out: Partial<Record<K, V>> = { ...b, ...a };
  for (const key of Object.keys(b) as K[]) {
    const x = a[key];
    const y = b[key];
    if (x !== undefined && y !== undefined) out[key] = pick(x, y);
  }
  return out;
}

const higher = <V>(x: V, y: V): V => (typeof x === "number" && typeof y === "number" ? (Math.max(x, y) as V) : x);

/** Combines the device save with the cloud copy so neither loses anything:
 * best score per game, furthest progress per game (numbers; other values
 * keep the device's copy). */
export function mergeSaves(local: SaveData, cloud: Partial<CloudData> | null | undefined): SaveData {
  if (!cloud) return local;
  return {
    ...local,
    highScores: mergeRecords(local.highScores, cloud.highScores ?? {}, higher),
    progress: mergeRecords(local.progress, cloud.progress ?? {}, higher),
  };
}
