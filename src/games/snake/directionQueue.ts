export interface Point {
  x: number;
  y: number;
}

const MAX_QUEUED = 2;

/**
 * Queues up to MAX_QUEUED turns so two direction changes landing in the
 * same tick are each preserved and applied on their own tick, instead of a
 * single "pending" slot letting the second one silently overwrite or
 * mis-validate against the first. Each candidate turn is checked against
 * the last *queued* direction (falling back to the current one if nothing's
 * queued yet) rather than the direction that's still actually executing —
 * so a same-tick double-turn can't collapse into an illegal 180 reversal
 * once both turns are applied across their own ticks.
 */
export class DirectionQueue {
  private queue: Point[] = [];

  constructor(private current: Point) {}

  /** Attempts to queue a turn. No-ops if it repeats or reverses the last
   * queued (or current, if the queue is empty) direction, or if the queue
   * is already full. */
  push(dx: number, dy: number): void {
    const last = this.queue[this.queue.length - 1] ?? this.current;
    if (dx === last.x && dy === last.y) return;
    if (dx === -last.x && dy === -last.y) return;
    if (this.queue.length >= MAX_QUEUED) return;
    this.queue.push({ x: dx, y: dy });
  }

  /** Advances to the next queued direction, if any, and returns the
   * (possibly unchanged) direction to move in for this tick. */
  advance(): Point {
    const next = this.queue.shift();
    if (next) this.current = next;
    return this.current;
  }

  reset(direction: Point): void {
    this.current = direction;
    this.queue = [];
  }
}
