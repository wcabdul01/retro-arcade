import { PieceType, PIECE_ROTATIONS, PIECE_COLOR_INDEX, PIECE_TYPES } from "./pieces";

export interface ActivePiece {
  type: PieceType;
  rotation: number;
  x: number;
  y: number;
}

export class TetrisBoard {
  readonly cols: number;
  readonly rows: number;
  grid: number[][];

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  }

  cellsFor(piece: ActivePiece): Array<[number, number]> {
    return PIECE_ROTATIONS[piece.type][piece.rotation].map(([ox, oy]) => [piece.x + ox, piece.y + oy]);
  }

  canPlace(piece: ActivePiece): boolean {
    return this.cellsFor(piece).every(([x, y]) => {
      if (x < 0 || x >= this.cols || y >= this.rows) return false;
      if (y < 0) return true;
      return this.grid[y][x] === 0;
    });
  }

  lock(piece: ActivePiece): void {
    const color = PIECE_COLOR_INDEX[piece.type];
    this.cellsFor(piece).forEach(([x, y]) => {
      if (y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
        this.grid[y][x] = color;
      }
    });
  }

  clearFullLines(): number {
    let cleared = 0;
    for (let y = this.rows - 1; y >= 0; y--) {
      if (this.grid[y].every((cell) => cell !== 0)) {
        this.grid.splice(y, 1);
        this.grid.unshift(Array(this.cols).fill(0));
        cleared += 1;
        y += 1;
      }
    }
    return cleared;
  }
}

export function randomPieceType(): PieceType {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
}

export function spawnPiece(type: PieceType, cols: number): ActivePiece {
  return { type, rotation: 0, x: Math.floor(cols / 2) - 2, y: -1 };
}
