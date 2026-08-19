export type Grid = number[][];

export interface Puzzle {
  puzzle: Grid;
  solution: Grid;
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

function emptyGrid(): Grid {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function findEmptyCell(grid: Grid): [number, number] | null {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) return [r, c];
    }
  }
  return null;
}

export function isValidPlacement(grid: Grid, row: number, col: number, digit: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (i !== col && grid[row][i] === digit) return false;
    if (i !== row && grid[i][col] === digit) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === digit) return false;
    }
  }
  return true;
}

function fillGrid(grid: Grid): boolean {
  const pos = findEmptyCell(grid);
  if (!pos) return true;
  const [row, col] = pos;
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const digit of digits) {
    if (isValidPlacement(grid, row, col, digit)) {
      grid[row][col] = digit;
      if (fillGrid(grid)) return true;
      grid[row][col] = 0;
    }
  }
  return false;
}

export function generateSolvedGrid(): Grid {
  const grid = emptyGrid();
  fillGrid(grid);
  return grid;
}

function countSolutions(grid: Grid, limit: number): number {
  const pos = findEmptyCell(grid);
  if (!pos) return 1;
  const [row, col] = pos;
  let count = 0;
  for (let digit = 1; digit <= 9; digit++) {
    if (isValidPlacement(grid, row, col, digit)) {
      grid[row][col] = digit;
      count += countSolutions(grid, limit - count);
      grid[row][col] = 0;
      if (count >= limit) return count;
    }
  }
  return count;
}

function hasUniqueSolution(grid: Grid): boolean {
  return countSolutions(cloneGrid(grid), 2) === 1;
}

function removeCells(solution: Grid, cellsToRemove: number): Grid {
  const puzzle = cloneGrid(solution);
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number])
  );
  let removed = 0;
  for (const [row, col] of positions) {
    if (removed >= cellsToRemove) break;
    const backup = puzzle[row][col];
    puzzle[row][col] = 0;
    if (hasUniqueSolution(puzzle)) {
      removed++;
    } else {
      puzzle[row][col] = backup;
    }
  }
  return puzzle;
}

export function generatePuzzle(cluesToKeep: number): Puzzle {
  const solution = generateSolvedGrid();
  const cellsToRemove = Math.min(81 - 17, Math.max(0, 81 - cluesToKeep));
  const puzzle = removeCells(solution, cellsToRemove);
  return { puzzle, solution };
}
