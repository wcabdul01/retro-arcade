export type GameId =
  | "brick-breaker"
  | "tetris"
  | "inverted-tetris"
  | "snake"
  | "tank-war"
  | "formula-racing"
  | "space-invaders"
  | "memory-match"
  | "sudoku"
  | "solitaire";

export interface GameMeta {
  id: GameId;
  title: string;
  tagline: string;
  howToPlay: string;
  entryScene: string;
}

export const GAMES: GameMeta[] = [
  {
    id: "brick-breaker",
    title: "Brick Breaker",
    tagline: "Bounce, break, clear the board",
    howToPlay: "Move the paddle to bounce the ball into the bricks.\nClear every brick without letting the ball fall.",
    entryScene: "BrickBreaker.Game",
  },
  {
    id: "tetris",
    title: "Block Drop",
    tagline: "Stack and clear the lines",
    howToPlay: "Move and rotate the falling blocks.\nFill a full row to clear it before the stack reaches the top.",
    entryScene: "Tetris.Game",
  },
  {
    id: "inverted-tetris",
    title: "Block Rise",
    tagline: "Rows push up from below",
    howToPlay: "Rows of blocks rise from the bottom.\nClear full rows before they reach the top.",
    entryScene: "InvertedTetris.Game",
  },
  {
    id: "snake",
    title: "Snake",
    tagline: "Grow long, don't bite yourself",
    howToPlay: "Steer the snake to eat food and grow.\nAvoid the walls and your own tail.",
    entryScene: "Snake.Game",
  },
  {
    id: "tank-war",
    title: "Tank War",
    tagline: "Blast through walls and foes",
    howToPlay: "Drive your tank and fire on enemies.\nWalls can be blasted through — watch your flank.",
    entryScene: "TankWar.Game",
  },
  {
    id: "formula-racing",
    title: "Racing",
    tagline: "Dodge traffic, survive the lanes",
    howToPlay: "Steer between lanes to dodge oncoming traffic.\nHold BOOST to speed up.\nSurvive as long as you can.",
    entryScene: "FormulaRacing.Game",
  },
  {
    id: "space-invaders",
    title: "Star Defender",
    tagline: "Hold the line against the fleet",
    howToPlay: "Move and fire to hold off the invading fleet.\nDon't let them reach the bottom.",
    entryScene: "SpaceInvaders.Game",
  },
  {
    id: "memory-match",
    title: "Memory Match",
    tagline: "Find every pair before time runs out",
    howToPlay: "Flip two tiles at a time to find matching pairs.\nMatch every pair before time runs out.",
    entryScene: "MemoryMatch.Difficulty",
  },
  {
    id: "sudoku",
    title: "Sudoku",
    tagline: "Fill the grid, five mistakes allowed",
    howToPlay: "Fill the grid so every row, column, and box\ncontains the digits 1-9 with no repeats.",
    entryScene: "Sudoku.Difficulty",
  },
  {
    id: "solitaire",
    title: "Solitaire",
    tagline: "Clear the tableau, ace to king",
    howToPlay: "Build tableau runs and move cards to the\nfoundations in order, ace to king.",
    entryScene: "Solitaire.Game",
  },
];

export function getGameMeta(id: GameId): GameMeta {
  const meta = GAMES.find((g) => g.id === id);
  if (!meta) throw new Error(`Unknown game id: ${id}`);
  return meta;
}
