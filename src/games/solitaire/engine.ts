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

/** Every tableau card is face up, so the deal can no longer be lost. The lowest
 * card still in play is always reachable: on top of its column (face-up runs
 * descend) or in the stock/waste, which draw-one with unlimited passes cycles
 * through. So foundation moves plus drawing always finish the game. */
export function canAutoComplete(board: Board): boolean {
  return !isWon(board) && board.tableau.every((column) => column.every((card) => card.faceUp));
}

export type AutoStep =
  | { kind: "tableau"; col: number; foundation: number }
  | { kind: "waste"; foundation: number }
  | { kind: "draw" };

/** Foundation pile `card` can go on. Players may start any suit on any empty
 * pile, so search all four (an Ace prefers its own suit's labelled pile). */
export function findFoundationFor(card: Card, foundations: Card[][]): number {
  const own = foundationIndex(card.suit);
  if (canPlaceOnFoundation(card, foundations[own])) return own;
  return foundations.findIndex((pile) => canPlaceOnFoundation(card, pile));
}

/** Next auto-complete step: the lowest-rank card that can go to a foundation
 * (tableau tops or the waste top), otherwise draw/recycle the stock. */
export function nextAutoStep(board: Board): AutoStep | null {
  if (isWon(board)) return null;
  let best: AutoStep | null = null;
  let bestRank = Infinity;
  const consider = (card: Card | undefined, step: (foundation: number) => AutoStep) => {
    if (!card || card.rank >= bestRank) return;
    const foundation = findFoundationFor(card, board.foundations);
    if (foundation < 0) return;
    best = step(foundation);
    bestRank = card.rank;
  };
  board.tableau.forEach((column, col) => consider(column[column.length - 1], (foundation) => ({ kind: "tableau", col, foundation })));
  consider(board.waste[board.waste.length - 1], (foundation) => ({ kind: "waste", foundation }));
  if (best) return best;
  return board.stock.length > 0 || board.waste.length > 0 ? { kind: "draw" } : null;
}
