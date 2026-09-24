import asyncio
import json
import os
import unicodedata
from typing import Set

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from TikTokLive import TikTokLiveClient
from TikTokLive.events import GiftEvent, ConnectEvent, DisconnectEvent

TIKTOK_USERNAME = os.getenv("TIKTOK_USERNAME", "").strip().lstrip("@")
GIFT_NAME = os.getenv("GIFT_NAME", "parfüm").strip().casefold()
MAX_PLAYERS = int(os.getenv("MAX_PLAYERS", "12"))

app = FastAPI(title="3 Kart Live TikTok Bridge")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

players = []
clients: Set[asyncio.Queue] = set()
tiktok_task = None

def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    return "".join(c for c in s if not unicodedata.combining(c)).casefold().strip()

def gift_matches(name: str) -> bool:
    # Accepts "Parfüm", "Parfum", or "Perfume" when GIFT_NAME is left at default.
    n = norm(name)
    wanted = norm(GIFT_NAME)
    if wanted in n:
        return True
    if wanted in ("parfum", "perfume", "parfüm") and ("parfum" in n or "perfume" in n):
        return True
    return False

async def broadcast(event_type="state"):
    payload = {"type": event_type, "players": players, "count": len(players), "max": MAX_PLAYERS}
    dead = []
    for q in list(clients):
        try:
            q.put_nowait(payload)
        except Exception:
            dead.append(q)
    for q in dead:
        clients.discard(q)

async def add_player(username: str, display_name: str):
    if len(players) >= MAX_PLAYERS:
        return
    username = (username or "").strip().lstrip("@")
    display_name = (display_name or username or "Oyunçu").strip()
    if not username:
        username = display_name
    # Do not add the same TikTok account twice in one round.
    if any(p["username"].casefold() == username.casefold() for p in players):
        return
    players.append({
        "username": username,
        "name": display_name,
        "number": len(players) + 1
    })
    await broadcast("player_joined")

async def tiktok_worker():
    if not TIKTOK_USERNAME:
        print("TIKTOK_USERNAME is not set.")
        return

    client = TikTokLiveClient(unique_id=TIKTOK_USERNAME)

    @client.on(ConnectEvent)
    async def on_connect(event):
        print(f"Connected to @{TIKTOK_USERNAME}")

    @client.on(GiftEvent)
    async def on_gift(event: GiftEvent):
        gift = event.gift
        if gift is None:
            return

        # For streakable gifts, only process the final event.
        if getattr(event, "streaking", False):
            return

        gift_name = getattr(gift, "name", "") or ""
        if not gift_matches(gift_name):
            return

        username = getattr(event.user, "unique_id", "") or ""
        nickname = getattr(event.user, "nickname", "") or username
        print(f"GIFT: @{username} -> {gift_name}")
        await add_player(username, nickname)

    @client.on(DisconnectEvent)
    async def on_disconnect(event):
        print("TikTok connection closed")

    try:
        await client.start()
    except Exception as e:
        print("TikTok connection error:", repr(e))

@app.on_event("startup")
async def startup():
    global tiktok_task
    tiktok_task = asyncio.create_task(tiktok_worker())

@app.get("/")
async def root():
    return {
        "ok": True,
        "service": "3 Kart Live TikTok Bridge",
        "tiktok_username": TIKTOK_USERNAME,
        "players": len(players),
        "max_players": MAX_PLAYERS,
    }

@app.get("/api/state")
async def state():
    return {"players": players, "count": len(players), "max": MAX_PLAYERS}

@app.post("/api/reset")
async def reset():
    players.clear()
    await broadcast("reset")
    return {"ok": True}

@app.get("/api/events")
async def events():
    q = asyncio.Queue()
    clients.add(q)

    async def stream():
        try:
            yield f"data: {json.dumps({'type':'state','players':players,'count':len(players),'max':MAX_PLAYERS}, ensure_ascii=False)}\\n\\n"
            while True:
                data = await q.get()
                yield f"data: {json.dumps(data, ensure_ascii=False)}\\n\\n"
        finally:
            clients.discard(q)

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
