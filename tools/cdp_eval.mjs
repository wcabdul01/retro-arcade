const wsUrl = process.argv[2];
const expr = process.argv[3];

const ws = new WebSocket(wsUrl);
let id = 1;

ws.addEventListener("open", () => {
  ws.send(JSON.stringify({ id: id++, method: "Runtime.enable" }));
  ws.send(JSON.stringify({ id: id++, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true, awaitPromise: true } }));
});

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method === "Runtime.consoleAPICalled") {
    const args = msg.params.args.map((a) => a.value ?? a.description).join(" ");
    console.log("[console." + msg.params.type + "]", args);
    return;
  }
  if (msg.id === 2) {
    console.log("RESULT:", JSON.stringify(msg.result, null, 2));
    ws.close();
    process.exit(0);
  }
});

ws.addEventListener("error", (e) => {
  console.error("WS ERROR", e.message);
  process.exit(1);
});

setTimeout(() => {
  console.error("TIMEOUT");
  process.exit(1);
}, 8000);
