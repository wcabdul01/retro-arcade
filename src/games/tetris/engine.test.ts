import { describe, expect, it } from "vitest";
import { TetrisBoard, spawnPiece } from "./engine";

describe("TetrisBoard", () => {
  it("spawns a piece centered at the top", () => {
    const piece = spawnPiece("T", 10);
    expect(piece).toEqual({ type: "T", rotation: 0, x: 3, y: -1 });
  });

  it("allows placing a piece on an empty board", () => {
    const board = new TetrisBoard(10, 20);
    expect(board.canPlace(spawnPiece("O", 10))).toBe(true);
  });

  it("rejects placement past the left/right/bottom walls", () => {
    const board = new TetrisBoard(10, 20);
    expect(board.canPlace({ type: "I", rotation: 0, x: -1, y: 5 })).toBe(false);
    expect(board.canPlace({ type: "I", rotation: 0, x: 7, y: 5 })).toBe(false);
    // O's rotation-0 offsets reach y+1, so y=19 pushes a cell to row 20 (out of bounds on a 20-row board).
    expect(board.canPlace({ type: "O", rotation: 0, x: 0, y: 19 })).toBe(false);
  });

  it("rejects placement onto an occupied cell", () => {
    const board = new TetrisBoard(10, 20);
    board.lock({ type: "O", rotation: 0, x: 0, y: 18 });
    expect(board.canPlace({ type: "O", rotation: 0, x: 0, y: 17 })).toBe(false);
  });

  it("locks a piece's cells with its color index", () => {
    const board = new TetrisBoard(10, 20);
    // Placed explicitly at y=0 (rather than via spawnPiece's y=-1) so all four
    // O-piece cells land on the board and are checkable.
    board.lock({ type: "O", rotation: 0, x: 3, y: 0 });
    expect(board.grid[0][4]).toBe(2);
    expect(board.grid[0][5]).toBe(2);
    expect(board.grid[1][4]).toBe(2);
    expect(board.grid[1][5]).toBe(2);
  });

  it("clears full lines and shifts the board down, returning the count cleared", () => {
    const board = new TetrisBoard(4, 4);
    board.grid = [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [2, 2, 2, 2],
      [0, 0, 0, 0],
    ];
    const cleared = board.clearFullLines();
    expect(cleared).toBe(2);
    expect(board.grid).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
  });

  it("leaves non-full lines untouched", () => {
    const board = new TetrisBoard(4, 2);
    board.grid = [
      [1, 0, 1, 1],
      [1, 1, 1, 1],
    ];
    const cleared = board.clearFullLines();
    expect(cleared).toBe(1);
    expect(board.grid[1]).toEqual([1, 0, 1, 1]);
  });
});
