// 3 Kart Live — GitHub Pages frontend connection
// Put this near the end of index.html, before </body>.
// Replace BRIDGE_URL with your Render service URL.

const BRIDGE_URL = "https://YOUR-RENDER-SERVICE.onrender.com";

function updatePlayersFromTikTok(data) {
  if (!data) return;

  // Change these selectors only if your existing HTML uses different IDs.
  const list = document.querySelector("#waitingPlayers");
  const count = document.querySelector("#playerCount");

  if (count) count.textContent = `${data.count}`;

  if (list) {
    list.innerHTML = "";
    data.players.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "waiting-player";
      row.innerHTML = `<b>${i + 1}. ${escapeHtml(p.name)}</b><small>@${escapeHtml(p.username)}</small>`;
      list.appendChild(row);
    });
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[ch]));
}

async function loadTikTokState() {
  try {
    const r = await fetch(`${BRIDGE_URL}/api/state`);
    if (r.ok) updatePlayersFromTikTok(await r.json());
  } catch (e) {
    console.log("TikTok bridge offline", e);
  }
}

function connectTikTokEvents() {
  try {
    const es = new EventSource(`${BRIDGE_URL}/api/events`);
    es.onmessage = e => updatePlayersFromTikTok(JSON.parse(e.data));
    es.onerror = () => console.log("TikTok event stream reconnecting...");
  } catch (e) {
    console.log(e);
  }
}

loadTikTokState();
connectTikTokEvents();
