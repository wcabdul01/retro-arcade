import Phaser from "phaser";
import { ARENA, TANK } from "../config";

export const LEVEL_COUNT = 5;

const TOP_CLEAR = 3;
const BOTTOM_CLEAR = 4;

function canPlace(grid: string[][], row: number, col: number): boolean {
  for (let r = row; r < row + 2; r++) {
    for (let c = col; c < col + 2; c++) {
      if (grid[r][c] !== ".") return false;
    }
  }
  return true;
}

function placeBlock(grid: string[][], row: number, col: number): void {
  for (let r = row; r < row + 2; r++) {
    for (let c = col; c < col + 2; c++) {
      grid[r][c] = "X";
    }
  }
}

export function generateWallLayout(levelIndex: number): string[] {
  const rows = ARENA.ROWS;
  const cols = ARENA.COLS;
  const grid: string[][] = Array.from({ length: rows }, () => Array(cols).fill("."));
  const clusterPairs = 2 + levelIndex;
  const halfCols = Math.floor(cols / 2);
  const maxRow = rows - BOTTOM_CLEAR - 2;
  const maxCol = halfCols - 2;

  let placed = 0;
  let attempts = 0;
  while (placed < clusterPairs && attempts < clusterPairs * 30) {
    attempts++;
    const row = Phaser.Math.Between(TOP_CLEAR, maxRow);
    const col = Phaser.Math.Between(0, maxCol);
    const mirrorCol = cols - 2 - col;
    if (canPlace(grid, row, col) && canPlace(grid, row, mirrorCol)) {
      placeBlock(grid, row, col);
      placeBlock(grid, row, mirrorCol);
      placed += 1;
    }
  }

  return grid.map((r) => r.join(""));
}

export function enemyCountForLevel(levelIndex: number): number {
  return Math.min(4 + levelIndex, ARENA.COLS - 2);
}

export function enemySpawnCols(count: number): number[] {
  const usable = ARENA.COLS - 2;
  const cols: number[] = [];
  for (let i = 0; i < count; i++) {
    cols.push(1 + Math.round(((i + 0.5) * usable) / count));
  }
  return cols;
}

export function enemySpeedForLevel(levelIndex: number): number {
  return Math.min(TANK.SPEED + levelIndex * 12, TANK.SPEED * 1.6);
}
