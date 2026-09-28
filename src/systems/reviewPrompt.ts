// Ask for a review after the player's 3rd finished game, and once more after
// the 15th. The OS still decides whether the sheet actually shows (Google and
// Apple both rate-limit it), so these are upper bounds, not guarantees.
export const REVIEW_PROMPT_AT_GAMES = [3, 15];

export function shouldPromptReview(gamesCompleted: number, promptsShown: number): boolean {
  const next = REVIEW_PROMPT_AT_GAMES[promptsShown];
  return next !== undefined && gamesCompleted >= next;
}
