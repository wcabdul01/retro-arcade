import { describe, expect, it } from "vitest";
import { mergeSaves } from "./mergeSaves";
import { DEFAULT_SAVE_DATA, type SaveData } from "./PlatformAdapter";

const local = (over: Partial<SaveData>): SaveData => ({ ...DEFAULT_SAVE_DATA, ...over });

describe("mergeSaves", () => {
  it("keeps the best score and furthest level from either copy", () => {
    const merged = mergeSaves(
      local({ highScores: { snake: 50, tetris: 900 }, progress: { "brick-breaker": 2 } }),
      { highScores: { snake: 80, sudoku: 300 }, progress: { "brick-breaker": 5 } }
    );
    expect(merged.highScores).toEqual({ snake: 80, tetris: 900, sudoku: 300 });
    expect(merged.progress).toEqual({ "brick-breaker": 5 });
  });

  it("never takes the purchase flag from the cloud", () => {
    const cloud = { highScores: {}, progress: {}, noAdsPurchased: true } as never;
    expect(mergeSaves(local({ noAdsPurchased: false }), cloud).noAdsPurchased).toBe(false);
    expect(mergeSaves(local({ noAdsPurchased: true }), null).noAdsPurchased).toBe(true);
  });

  it("tolerates a missing or partial cloud save", () => {
    const save = local({ highScores: { snake: 10 } });
    expect(mergeSaves(save, null)).toBe(save);
    expect(mergeSaves(save, { highScores: undefined }).highScores).toEqual({ snake: 10 });
  });
});
