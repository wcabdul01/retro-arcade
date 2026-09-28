// Capture store screenshots straight from the running game in headless Chrome.
//
// Drives the real UI the way a player would (taps on the canvas), so it needs
// no hooks in the app code. The viewport is exactly the game's 480x1040
// canvas, so canvas coordinates == page coordinates.
//
// Usage (dev server must be running: `npm run dev`):
//   node tools/store-assets/capture_screenshots.mjs [url]
// Then: python tools/store-assets/compose_screenshots.py
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, "screenshots", "hires-raw");
const URL = process.argv[2] ?? "http://localhost:5173/";
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333;
const W = 480;
const H = 1040;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = targets.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome not up yet.
    }
    await sleep(200);
  }
  throw new Error("Chrome DevTools endpoint never came up");
}

function cdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    }
  });
  const ready = new Promise((r) => ws.addEventListener("open", r));
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  return { ready, send, close: () => ws.close() };
}

const profileDir = join(tmpdir(), `ra-capture-${Date.now()}`);
const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profileDir}`,
  `--window-size=${W},${H}`,
  "--autoplay-policy=no-user-gesture-required",
  "--mute-audio",
  "about:blank",
]);

const cdp = cdpClient(await connect());
await cdp.ready;
await cdp.send("Page.enable");
await cdp.send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: true });

async function tap(x, y) {
  for (const type of ["mousePressed", "mouseReleased"]) {
    await cdp.send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
    await sleep(40);
  }
}

async function key(code, keyName, holdMs = 60) {
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", code, key: keyName, windowsVirtualKeyCode: KEYCODES[code] });
  await sleep(holdMs);
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", code, key: keyName, windowsVirtualKeyCode: KEYCODES[code] });
}
const KEYCODES = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Space: 32 };

async function shot(name) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, `${name}.png`), Buffer.from(data, "base64"));
  console.log("captured", name);
}

async function loadHub() {
  await cdp.send("Page.navigate", { url: URL });
  await sleep(3500);
}

// --- Scenario runner ------------------------------------------------------
// Each scenario starts from a fresh page load on the hub.
const scenarios = (await import("./screenshot_scenarios.mjs")).default;
const only = process.argv[3];
try {
  for (const s of scenarios) {
    if (only && s.name !== only) continue;
    await loadHub();
    await s.run({ tap, key, shot: () => shot(s.name), sleep });
  }
} finally {
  cdp.close();
  chrome.kill();
  await sleep(500);
  try {
    rmSync(profileDir, { recursive: true, force: true });
  } catch {
    // Chrome may still hold a lock on Windows; the OS temp cleaner gets it.
  }
}
