import type { BrickType } from "../entities/Brick";

export interface LevelDef {
  cols: number;
  rows: string[];
}

const CHAR_MAP: Record<string, BrickType | null> = {
  ".": null,
  N: "normal",
  R: "reinforced",
  X: "indestructible",
};

export function charToBrickType(ch: string): BrickType | null {
  return CHAR_MAP[ch] ?? null;
}

export const LEVEL_COUNT = 5;

const COLS = 8;
const HALF_COLS = COLS / 2;

function randomBrickChar(levelIndex: number): string {
  const emptyChance = 0.1;
  const indestructibleChance = levelIndex >= 1 ? 0.04 + levelIndex * 0.02 : 0;
  const reinforcedChance = 0.12 + levelIndex * 0.06;

  const roll = Math.random();
  if (roll < emptyChance) return ".";
  if (roll < emptyChance + indestructibleChance) return "X";
  if (roll < emptyChance + indestructibleChance + reinforcedChance) return "R";
  return "N";
}

function ensureDestructible(rows: string[]): string[] {
  const hasDestructible = rows.some((row) => row.includes("N") || row.includes("R"));
  if (hasDestructible) return rows;
  const mid = Math.floor(rows.length / 2);
  const chars = rows[mid].split("");
  chars[Math.floor(COLS / 2)] = "N";
  rows[mid] = chars.join("");
  return rows;
}

export function generateLevel(levelIndex: number): LevelDef {
  const rowCount = 4 + Math.min(2, levelIndex);
  const rows: string[] = [];

  for (let r = 0; r < rowCount; r++) {
    const half: string[] = [];
    for (let c = 0; c < HALF_COLS; c++) {
      half.push(randomBrickChar(levelIndex));
    }
    const mirrored = [...half].reverse();
    rows.push(half.concat(mirrored).join(""));
  }

  return { cols: COLS, rows: ensureDestructible(rows) };
}
