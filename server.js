const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 12;
const QUALIFYING_GIFT = "Parfum";

let state = {
  round: 1,
  phase: "waiting", // waiting | reveal | finished
  players: [],
  winner: null,
  lastEvent: null
};

function json(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(body);
}

function publicState() {
  return {
    round: state.round,
    phase: state.phase,
    winner: state.winner,
    lastEvent: state.lastEvent,
    players: state.players.map(p => ({
      id: p.id,
      name: p.name,
      cards: state.phase === "waiting" ? p.cards.map(() => null) : p.cards,
      total: state.phase === "waiting" ? null : p.total,
      joinedBy: p.joinedBy
    }))
  };
}

function cardValue() {
  return Math.floor(Math.random() * 10) + 1;
}

function makePlayer(name, giftName = QUALIFYING_GIFT) {
  const cards = [cardValue(), cardValue(), cardValue()];
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name: String(name || "İştirakçı").slice(0, 28),
    cards,
    total: cards.reduce((a,b) => a+b, 0),
    joinedBy: giftName
  };
}

function addGift(name, giftName) {
  if (state.phase !== "waiting") return { ok:false, message:"Raund artıq başlayıb." };
  if (String(giftName).toLowerCase() !== QUALIFYING_GIFT.toLowerCase()) {
    return { ok:false, message:`Yalnız ${QUALIFYING_GIFT} oyuna qoşur.` };
  }
  if (state.players.length >= MAX_PLAYERS) {
    return { ok:false, message:"12 iştirakçı limiti dolub." };
  }
  const p = makePlayer(name, giftName);
  state.players.push(p);
  state.lastEvent = { type:"join", name:p.name, gift:giftName, at:Date.now() };
  return { ok:true, player:p };
}

function startRound() {
  if (state.players.length === 0) return { ok:false, message:"Əvvəl iştirakçı əlavə olunmalıdır." };
  state.phase = "reveal";
  state.winner = [...state.players].sort((a,b) => b.total - a.total || Math.max(...b.cards) - Math.max(...a.cards))[0];
  state.lastEvent = { type:"round_start", at:Date.now() };
  return { ok:true };
}

function nextRound() {
  state.round += 1;
  state.phase = "waiting";
  state.players = [];
  state.winner = null;
  state.lastEvent = { type:"reset", at:Date.now() };
  return { ok:true };
}

const server = http.createServer((req,res) => {
  const u = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && u.pathname === "/api/state") {
    return json(res, 200, publicState());
  }

  if (req.method === "POST" && u.pathname === "/api/gift") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const data = JSON.parse(body || "{}");
        const result = addGift(data.username || data.user || "İştirakçı", data.gift || data.giftName || "");
        return json(res, result.ok ? 200 : 400, result);
      } catch {
        return json(res, 400, {ok:false, message:"JSON formatı yanlışdır."});
      }
    });
    return;
  }

  if (req.method === "POST" && u.pathname === "/api/start") {
    const result = startRound();
    return json(res, result.ok ? 200 : 400, result);
  }

  if (req.method === "POST" && u.pathname === "/api/reset") {
    return json(res, nextRound());
  }

  if (req.method === "POST" && u.pathname === "/api/test-parfum") {
    const result = addGift(u.searchParams.get("name") || "Test İştirakçı", QUALIFYING_GIFT);
    return json(res, result.ok ? 200 : 400, result);
  }

  let file = u.pathname === "/" ? "/index.html" : u.pathname;
  const filePath = path.join(__dirname, "public", path.normalize(file).replace(/^(\.\.[\/\\])+/, ""));
  if (!filePath.startsWith(path.join(__dirname, "public"))) return json(res, 403, {error:"Forbidden"});

  fs.readFile(filePath, (err, data) => {
    if (err) return json(res, 404, {error:"Not found"});
    const ext = path.extname(filePath);
    const types = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8"};
    res.writeHead(200, {"Content-Type": types[ext] || "application/octet-stream"});
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`3 Kart Live running on http://localhost:${PORT}`));
