import { describe, expect, it } from "vitest";
import { Board, Card, SUITS, Suit, canAutoComplete, isWon, nextAutoStep } from "./engine";

let nextId = 0;
const card = (suit: Suit, rank: number, faceUp = true): Card => ({ id: nextId++, suit, rank, faceUp });

function emptyBoard(): Board {
  return { tableau: [[], [], [], [], [], [], []], foundations: [[], [], [], []], stock: [], waste: [] };
}

/** All 52 cards face up in descending alternating-colour runs, nothing on the foundations. */
function solvedLayout(): Board {
  const board = emptyBoard();
  const runs: Suit[][] = [
    ["spades", "hearts"],
    ["hearts", "spades"],
    ["clubs", "diamonds"],
    ["diamonds", "clubs"],
  ];
  runs.forEach(([a, b], i) => {
    for (let rank = 13; rank >= 1; rank--) {
      board.tableau[i].push(card(rank % 2 === 1 ? a : b, rank));
    }
  });
  return board;
}

/** Applies steps the same way GameScene does (draw-one, unlimited recycles). */
function runAutoComplete(board: Board): number {
  let steps = 0;
  while (!isWon(board) && steps++ < 52 * 60) {
    const step = nextAutoStep(board);
    if (!step) break;
    if (step.kind === "draw") {
      if (board.stock.length > 0) {
        const c = board.stock.pop()!;
        c.faceUp = true;
        board.waste.push(c);
      } else {
        while (board.waste.length > 0) {
          const c = board.waste.pop()!;
          c.faceUp = false;
          board.stock.push(c);
        }
      }
    } else if (step.kind === "waste") {
      board.foundations[step.foundation].push(board.waste.pop()!);
    } else {
      board.foundations[step.foundation].push(board.tableau[step.col].pop()!);
    }
  }
  return steps;
}

describe("solitaire auto-complete", () => {
  it("is not offered while any tableau card is face down", () => {
    const board = solvedLayout();
    board.tableau[1][0].faceUp = false;
    expect(canAutoComplete(board)).toBe(false);
  });

  it("finishes a deal with everything on the tableau", () => {
    const board = solvedLayout();
    expect(canAutoComplete(board)).toBe(true);
    runAutoComplete(board);
    expect(isWon(board)).toBe(true);
    expect(canAutoComplete(board)).toBe(false);
    board.foundations.forEach((pile, f) => expect(pile.every((c) => c.suit === SUITS[f])).toBe(true));
  });

  it("works when the player started suits on other suits' foundation piles", () => {
    const board = solvedLayout();
    // Columns end with A♠, A♥, A♣, A♦; put them on piles in a different order.
    board.foundations[0].push(board.tableau[3].pop()!); // ♦ on the ♠ pile
    board.foundations[1].push(board.tableau[2].pop()!); // ♣ on the ♥ pile
    board.foundations[2].push(board.tableau[1].pop()!); // ♥ on the ♦ pile
    board.foundations[3].push(board.tableau[0].pop()!); // ♠ on the ♣ pile
    expect(canAutoComplete(board)).toBe(true);
    runAutoComplete(board);
    expect(isWon(board)).toBe(true);
    board.foundations.forEach((pile) => expect(new Set(pile.map((c) => c.suit)).size).toBe(1));
  });

  it("is offered with cards still in the stock and waste, and finishes the deal", () => {
    const board = solvedLayout();
    // Low cards (needed first) buried in the stock and waste.
    for (const col of [0, 1, 2, 3]) {
      const moved = board.tableau[col].splice(board.tableau[col].length - 4, 4);
      moved.slice(0, 2).forEach((c) => board.waste.push(c));
      moved.slice(2).forEach((c) => {
        c.faceUp = false;
        board.stock.push(c);
      });
    }
    expect(canAutoComplete(board)).toBe(true);
    runAutoComplete(board);
    expect(isWon(board)).toBe(true);
  });
});
