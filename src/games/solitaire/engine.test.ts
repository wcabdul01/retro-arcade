import { describe, expect, it } from "vitest";
import { Board, Card, SUITS, Suit, canAutoComplete, isWon, nextAutoMove } from "./engine";

let nextId = 0;
const card = (suit: Suit, rank: number, faceUp = true): Card => ({ id: nextId++, suit, rank, faceUp });

function emptyBoard(): Board {
  return { tableau: [[], [], [], [], [], [], []], foundations: [[], [], [], []], stock: [], waste: [] };
}

/** All 52 cards face up in descending alternating-colour runs, nothing on the foundations. */
function solvedLayout(): Board {
  const board = emptyBoard();
  // Two runs per suit pair: K..A alternating red/black.
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

describe("solitaire auto-complete", () => {
  it("is not offered while the stock or waste still has cards", () => {
    const board = solvedLayout();
    board.stock.push(board.tableau[0].shift()!);
    expect(canAutoComplete(board)).toBe(false);
  });

  it("is not offered while any tableau card is face down", () => {
    const board = solvedLayout();
    board.tableau[1][0].faceUp = false;
    expect(canAutoComplete(board)).toBe(false);
  });

  it("finishes the deal by repeatedly moving the lowest card", () => {
    const board = solvedLayout();
    expect(canAutoComplete(board)).toBe(true);
    let guard = 0;
    while (!isWon(board) && guard++ < 100) {
      const move = nextAutoMove(board);
      expect(move).not.toBeNull();
      const top = board.tableau[move!.col].pop()!;
      board.foundations[move!.foundation].push(top);
    }
    expect(isWon(board)).toBe(true);
    expect(canAutoComplete(board)).toBe(false);
    board.foundations.forEach((pile, f) => expect(pile.every((c) => c.suit === SUITS[f])).toBe(true));
  });
});
