let lastSignature = "";

function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}

async function getState(){
  const r=await fetch("/api/state",{cache:"no-store"});
  return r.json();
}

function render(s){
  document.getElementById("round").textContent=s.round;
  const live=s.players.length>0;
  document.querySelector(".status").classList.toggle("live",live);
  document.getElementById("statusText").textContent =
    s.phase==="waiting" ? `${s.players.length}/12 iştirakçı gözlənilir` :
    s.phase==="reveal" ? "Kartlar açıldı" : "Raund bitdi";

  const area=document.getElementById("players");
  let html="";
  for(let i=0;i<12;i++){
    const p=s.players[i];
    if(!p){
      html+=`<div class="cardPlayer empty"><div class="playerHead"><span class="name">Boş yer</span><span class="num">${i+1}</span></div><div class="cards"><div class="card hiddenCard">?</div><div class="card hiddenCard">?</div><div class="card hiddenCard">?</div></div><div class="total">Parfum gözlənilir</div></div>`;
      continue;
    }
    const cards=p.cards.map(v=>`<div class="card ${v===null?'hiddenCard':''}">${v===null?'?':v}</div>`).join("");
    html+=`<div class="cardPlayer"><div class="playerHead"><span class="name">${esc(p.name)}</span><span class="num">#${i+1}</span></div><div class="cards">${cards}</div><div class="total">${p.total===null?'Gizli':'Cəm: <b>'+p.total+' xal</b>'}</div></div>`;
  }
  area.innerHTML=html;

  document.getElementById("startBtn").disabled = s.players.length===0 || s.phase!=="waiting";
  document.getElementById("resetBtn").disabled = s.phase==="waiting" && s.players.length===0;

  const w=document.getElementById("winner");
  if(s.phase==="reveal" && s.winner){
    w.classList.remove("hidden");
    document.getElementById("winnerName").textContent=s.winner.name;
    document.getElementById("winnerScore").textContent=s.winner.total+" XAL";
  } else w.classList.add("hidden");
}

async function refresh(){
  try{render(await getState());}catch(e){}
}
document.getElementById("startBtn").onclick=async()=>{await fetch("/api/start",{method:"POST"});refresh();};
document.getElementById("resetBtn").onclick=async()=>{await fetch("/api/reset",{method:"POST"});refresh();};
document.getElementById("testBtn").onclick=async()=>{
  const name=prompt("Test iştirakçının adı:","TikTokUser");
  if(name) await fetch("/api/test-parfum?name="+encodeURIComponent(name),{method:"POST"});
  refresh();
};
setInterval(refresh,500);
refresh();
