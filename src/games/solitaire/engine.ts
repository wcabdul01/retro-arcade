export type Suit = "spades" | "hearts" | "diamonds" | "clubs";

export const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];

export interface Card {
  id: number;
  suit: Suit;
  rank: number; // 1 = Ace ... 13 = King
  faceUp: boolean;
}

export interface Board {
  tableau: Card[][];
  foundations: Card[][];
  stock: Card[];
  waste: Card[];
}

export function isRedGroup(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

export function suitSymbol(suit: Suit): string {
  switch (suit) {
    case "spades":
      return "♠";
    case "hearts":
      return "♥";
    case "diamonds":
      return "♦";
    case "clubs":
      return "♣";
  }
}

export function rankLabel(rank: number): string {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return String(rank);
}

export function createShuffledDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ id: id++, suit, rank, faceUp: false });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function dealBoard(): Board {
  const deck = createShuffledDeck();
  const tableau: Card[][] = [[], [], [], [], [], [], []];
  for (let col = 0; col < 7; col++) {
    for (let i = 0; i <= col; i++) {
      const card = deck.pop();
      if (!card) continue;
      card.faceUp = i === col;
      tableau[col].push(card);
    }
  }
  return { tableau, foundations: [[], [], [], []], stock: deck, waste: [] };
}

export function canPlaceOnFoundation(card: Card, foundation: Card[]): boolean {
  if (foundation.length === 0) return card.rank === 1;
  const top = foundation[foundation.length - 1];
  return top.suit === card.suit && card.rank === top.rank + 1;
}

export function canPlaceOnTableau(card: Card, column: Card[]): boolean {
  if (column.length === 0) return card.rank === 13;
  const top = column[column.length - 1];
  if (!top.faceUp) return false;
  return isRedGroup(top.suit) !== isRedGroup(card.suit) && card.rank === top.rank - 1;
}

export function foundationIndex(suit: Suit): number {
  return SUITS.indexOf(suit);
}

export function isWon(board: Board): boolean {
  return board.foundations.every((f) => f.length === 13);
}

/** The stock and waste are used up and every tableau card is face up, so the
 * deal can no longer be lost: what's left is moving cards to the foundations.
 * (The lowest remaining card always sits on top of its column, because face-up
 * runs descend, so a foundation move is always available until the win.) */
export function canAutoComplete(board: Board): boolean {
  return (
    !isWon(board) &&
    board.stock.length === 0 &&
    board.waste.length === 0 &&
    board.tableau.every((column) => column.every((card) => card.faceUp))
  );
}

/** Tableau column whose top card can go to a foundation, lowest rank first. */
export function nextAutoMove(board: Board): { col: number; foundation: number } | null {
  let best: { col: number; foundation: number } | null = null;
  let bestRank = Infinity;
  for (let col = 0; col < board.tableau.length; col++) {
    const column = board.tableau[col];
    const top = column[column.length - 1];
    if (!top || top.rank >= bestRank) continue;
    const foundation = foundationIndex(top.suit);
    if (!canPlaceOnFoundation(top, board.foundations[foundation])) continue;
    best = { col, foundation };
    bestRank = top.rank;
  }
  return best;
}
