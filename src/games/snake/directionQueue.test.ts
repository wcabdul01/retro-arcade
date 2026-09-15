import { describe, expect, it } from "vitest";
import { DirectionQueue } from "./directionQueue";

const RIGHT = { x: 1, y: 0 };
const LEFT = { x: -1, y: 0 };
const UP = { x: 0, y: -1 };
const DOWN = { x: 0, y: 1 };

describe("DirectionQueue", () => {
  it("advances to a single queued turn on the next tick", () => {
    const q = new DirectionQueue(RIGHT);
    q.push(UP.x, UP.y);
    expect(q.advance()).toEqual(UP);
  });

  it("holds direction when nothing is queued", () => {
    const q = new DirectionQueue(RIGHT);
    expect(q.advance()).toEqual(RIGHT);
  });

  it("rejects an immediate 180 reversal of the current direction", () => {
    const q = new DirectionQueue(RIGHT);
    q.push(LEFT.x, LEFT.y);
    expect(q.advance()).toEqual(RIGHT); // reversal was dropped, still moving right
  });

  it("ignores a same-direction no-op push", () => {
    const q = new DirectionQueue(RIGHT);
    q.push(RIGHT.x, RIGHT.y);
    expect(q.advance()).toEqual(RIGHT);
  });

  it("preserves two legal turns queued in the same tick, applying one per tick", () => {
    // This is the reported bug scenario: moving right, then two quick turns
    // (up, then left) land before the next tick fires. Both are legal in
    // sequence (right->up is not a reversal, up->left is not a reversal),
    // so both must survive and apply in order across two ticks -- not have
    // the second one silently dropped.
    const q = new DirectionQueue(RIGHT);
    q.push(UP.x, UP.y);
    q.push(LEFT.x, LEFT.y);
    expect(q.advance()).toEqual(UP);
    expect(q.advance()).toEqual(LEFT);
  });

  it("rejects a second queued turn that would reverse the first queued turn", () => {
    // Moving right; queue up, then immediately queue down (the reverse of
    // the *queued* up, even though it isn't the reverse of the still-live
    // "right"). Must be rejected -- otherwise up then down would apply
    // across two ticks and run the snake straight back into its own neck.
    const q = new DirectionQueue(RIGHT);
    q.push(UP.x, UP.y);
    q.push(DOWN.x, DOWN.y);
    expect(q.advance()).toEqual(UP);
    expect(q.advance()).toEqual(UP); // second push was rejected, direction holds
  });

  it("caps the queue at 2 pending turns", () => {
    const q = new DirectionQueue(RIGHT);
    q.push(UP.x, UP.y); // queued
    q.push(LEFT.x, LEFT.y); // queued
    q.push(DOWN.x, DOWN.y); // queue full, dropped
    expect(q.advance()).toEqual(UP);
    expect(q.advance()).toEqual(LEFT);
    expect(q.advance()).toEqual(LEFT); // nothing left queued, holds
  });

  it("reset clears the queue and sets a fresh current direction", () => {
    const q = new DirectionQueue(RIGHT);
    q.push(UP.x, UP.y);
    q.reset(DOWN);
    expect(q.advance()).toEqual(DOWN);
  });
});
