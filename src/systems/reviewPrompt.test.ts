import { describe, expect, it } from "vitest";
import { shouldPromptReview } from "./reviewPrompt";

describe("shouldPromptReview", () => {
  it("waits for the 3rd finished game", () => {
    expect(shouldPromptReview(1, 0)).toBe(false);
    expect(shouldPromptReview(2, 0)).toBe(false);
    expect(shouldPromptReview(3, 0)).toBe(true);
  });

  it("asks a second time only after the 15th game", () => {
    expect(shouldPromptReview(4, 1)).toBe(false);
    expect(shouldPromptReview(14, 1)).toBe(false);
    expect(shouldPromptReview(15, 1)).toBe(true);
  });

  it("never asks more than twice", () => {
    expect(shouldPromptReview(100, 2)).toBe(false);
  });

  it("catches up if a threshold was passed while prompts were unavailable", () => {
    expect(shouldPromptReview(7, 0)).toBe(true);
  });
});
