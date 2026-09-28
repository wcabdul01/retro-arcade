// One scenario per screenshot. Each starts on a freshly loaded hub; `run`
// drives the UI with taps/keys and calls shot() when the frame looks good.
// Coordinates are canvas pixels (480x1040), read off earlier captures.

// Hub tile centers: two columns, five rows, in gameRegistry order.
const COL = [129, 351];
const ROW = [315, 423, 531, 639, 747];
const tile = (i) => [COL[i % 2], ROW[Math.floor(i / 2)]];
// IntroScene auto-advances after HOLD_MS (2000) + fade.
const INTRO_MS = 2400;
// "MEDIUM" on the Memory Match / Sudoku difficulty screens.
const MEDIUM_BTN = [240, 510];

const open = async ({ tap, sleep }, i) => {
  await tap(...tile(i));
  await sleep(INTRO_MS);
};

// Drop a few pieces at different columns so the board isn't empty.
// Each entry: [rotations, horizontal shift (negative = left)].
const STACK = [[0, -4], [1, -2], [0, 0], [2, 2], [0, 4], [1, -3], [0, 1], [3, 3], [0, -1]];
const stackPieces = async ({ key, sleep }) => {
  for (const [rot, shift] of STACK) {
    for (let r = 0; r < rot; r++) await key("ArrowUp", "ArrowUp");
    const dir = shift < 0 ? "ArrowLeft" : "ArrowRight";
    for (let s = 0; s < Math.abs(shift); s++) await key(dir, dir);
    await key("Space", " ");
    await sleep(250);
  }
};

export default [
  { name: "00-hub", run: async ({ shot }) => shot() },
  {
    name: "01-brick-breaker",
    run: async (ctx) => {
      await open(ctx, 0);
      await ctx.key("Space", " ");
      await ctx.sleep(2200);
      await ctx.shot();
    },
  },
  {
    name: "02-block-drop",
    run: async (ctx) => {
      await open(ctx, 1);
      await stackPieces(ctx);
      await ctx.sleep(600);
      await ctx.shot();
    },
  },
  {
    name: "03-block-rise",
    run: async (ctx) => {
      await open(ctx, 2);
      await stackPieces(ctx);
      await ctx.sleep(600);
      await ctx.shot();
    },
  },
  {
    name: "04-snake",
    run: async (ctx) => {
      await open(ctx, 3);
      // Starts center, heading right: turn down then left to stay on the board.
      await ctx.sleep(150);
      await ctx.key("ArrowDown", "ArrowDown");
      await ctx.sleep(450);
      await ctx.key("ArrowLeft", "ArrowLeft");
      await ctx.sleep(350);
      await ctx.shot();
    },
  },
  {
    name: "05-tank-war",
    run: async (ctx) => {
      await open(ctx, 4);
      await ctx.sleep(3500);
      await ctx.shot();
    },
  },
  {
    name: "06-racing",
    run: async (ctx) => {
      await open(ctx, 5);
      await ctx.sleep(2500);
      await ctx.shot();
    },
  },
  {
    name: "07-star-defender",
    run: async (ctx) => {
      await open(ctx, 6);
      await ctx.sleep(2500);
      await ctx.shot();
    },
  },
  {
    name: "08-memory-match",
    run: async (ctx) => {
      await open(ctx, 7);
      await ctx.tap(...MEDIUM_BTN);
      await ctx.sleep(1500);
      await ctx.shot();
    },
  },
  {
    name: "09-sudoku",
    run: async (ctx) => {
      await open(ctx, 8);
      await ctx.tap(...MEDIUM_BTN);
      await ctx.sleep(1500);
      await ctx.shot();
    },
  },
  {
    name: "10-solitaire",
    run: async (ctx) => {
      await open(ctx, 9);
      await ctx.sleep(1500);
      await ctx.shot();
    },
  },
];
