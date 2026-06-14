(function(){
const cv = document.getElementById("cb");
const cx = cv.getContext("2d");
const W = cv.width, H = cv.height;
const BS = 32, COLS = 75, ROWS = Math.floor(H / BS);
const WW = COLS * BS;
let camX = 0, score = 0, mode = "mine", sel = "grass", musicOn = false;

const BLOCKS = {
  grass:    { label:"Grass",    score:5  },
  dirt:     { label:"Dirt",     score:5  },
  stone:    { label:"Stone",    score:10 },
  wood:     { label:"Wood",     score:8  },
  leaves:   { label:"Leaves",   score:3  },
  sand:     { label:"Sand",     score:5  },
  coal:     { label:"Coal",     score:20 },
  gold:     { label:"Gold",     score:30 },
  iron:     { label:"Iron",     score:25 },
  diamond:  { label:"Diamond",  score:100},
  emerald:  { label:"Emerald",  score:80 },
  lava:     { label:"Lava",     score:15 },
  obsidian: { label:"Obsidian", score:40 },
  tnt:      { label:"TNT",      score:0  }
};
const BUILDABLE = ["grass","dirt","stone","wood","leaves","sand","tnt"];

// --- WORLD GENERATION ---
const world = [];
function genWorld() {
  const surf = 5;
  for (let r = 0; r < ROWS; r++) {
    world[r] = [];
    for (let c = 0; c < COLS; c++) {
      if (r < surf) {
        world[r][c] = "sky";
      } else if (r === surf) {
        world[r][c] = "grass";
      } else if (r <= surf + 2) {
        world[r][c] = Math.random() < 0.04 ? "wood" : "dirt";
      } else if (r <= surf + 5) {
        let x = Math.random();
        if      (x < 0.05) world[r][c] = "coal";
        else if (x < 0.09) world[r][c] = "iron";
        else if (x < 0.11) world[r][c] = "sand";
        else                world[r][c] = "dirt";
      } else if (r <= surf + 9) {
        let x = Math.random();
        if      (x < 0.07) world[r][c] = "coal";
        else if (x < 0.12) world[r][c] = "iron";
        else if (x < 0.15) world[r][c] = "gold";
        else if (x < 0.17) world[r][c] = "tnt";
        else                world[r][c] = "stone";
      } else {
        let x = Math.random();
        if      (x < 0.05) world[r][c] = "diamond";
        else if (x < 0.09) world[r][c] = "emerald";
        else if (x < 0.13) world[r][c] = "gold";
        else if (x < 0.16) world[r][c] = "iron";
        else if (x < 0.19) world[r][c] = "lava";
        else if (x < 0.21) world[r][c] = "obsidian";
        else if (x < 0.23) world[r][c] = "tnt";
        else                world[r][c] = "stone";
      }
    }
  }
  addTrees();
}

function addTrees() {
  for (let c = 3; c < COLS - 3; c += Math.floor(5 + Math.random() * 8)) {
    let r = 4;
    if (world[r] && world[r][c] === "sky" && world[r+1] && world[r+1][c] === "grass") {
      world[r][c] = "leaves";
      if (world[r-1]) {
        world[r-1][c]   = "leaves";
        world[r-1][c-1] = "leaves";
        world[r-1][c+1] = "leaves";
      }
      world[r+1][c] = "wood";
    }
  }
}

genWorld();

// --- CLOUDS & STARS ---
const clouds = [
  {x:80,  y:30, s:0.25},
  {x:320, y:50, s:0.18},
  {x:560, y:24, s:0.30},
  {x:800, y:42, s:0.22}
];
const stars = Array.from({length:32}, () => ({
  x: Math.random() * WW,
  y: Math.random() * 90,
  r: Math.random() * 1.3 + 0.4
}));

// --- AUDIO ENGINE ---
let ac = null;
let musicPlaying = false;

function getAC() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function playSound(type) {
  try {
    const a = getAC();
    const o = a.createOscillator(), g = a.createGain();
    o.connect(g); g.connect(a.destination);
    const n = a.currentTime;
    if (type === "mine") {
      o.type = "sine";
      o.frequency.setValueAtTime(320, n);
      o.frequency.exponentialRampToValueAtTime(80, n + 0.12);
      g.gain.setValueAtTime(0.25, n);
      g.gain.linearRampToValueAtTime(0.001, n + 0.12);
      o.start(n); o.stop(n + 0.12);
    } else if (type === "build") {
      o.type = "triangle";
      o.frequency.setValueAtTime(500, n);
      o.frequency.exponentialRampToValueAtTime(300, n + 0.08);
      g.gain.setValueAtTime(0.15, n);
      g.gain.linearRampToValueAtTime(0.001, n + 0.08);
      o.start(n); o.stop(n + 0.08);
    } else if (type === "tnt") {
      o.type = "sawtooth";
      o.frequency.setValueAtTime(150, n);
      o.frequency.linearRampToValueAtTime(15, n + 0.6);
      g.gain.setValueAtTime(0.7, n);
      g.gain.linearRampToValueAtTime(0.001, n + 0.6);
      o.start(n); o.stop(n + 0.6);
    } else if (type === "diamond") {
      o.type = "sine";
      o.frequency.setValueAtTime(900, n);
      o.frequency.setValueAtTime(1200, n + 0.05);
      o.frequency.setValueAtTime(900, n + 0.1);
      g.gain.setValueAtTime(0.2, n);
      g.gain.linearRampToValueAtTime(0.001, n + 0.2);
      o.start(n); o.stop(n + 0.2);
    } else if (type === "lava") {
      o.type = "sawtooth";
      o.frequency.setValueAtTime(60, n);
      g.gain.setValueAtTime(0.3, n);
      g.gain.linearRampToValueAtTime(0.001, n + 0.3);
      o.start(n); o.stop(n + 0.3);
    }
  } catch(e) {}
}

function startMusic() {
  if (musicPlaying) return;
  musicPlaying = true;
  const melody = [262,294,330,349,392,349,330,294,262,0,330,392,440,392,330,0];
  const bass   = [131,131,165,165,196,196,165,165];
  let step = 0, bstep = 0;
  function tick() {
    if (!musicPlaying) return;
    const a2 = getAC();
    const n = a2.currentTime;
    const freq = melody[step % melody.length];
    if (freq > 0) {
      const o = a2.createOscillator(), g = a2.createGain();
      o.type = "square";
      o.frequency.setValueAtTime(freq, n);
      g.gain.setValueAtTime(0.06, n);
      g.gain.linearRampToValueAtTime(0.001, n + 0.22);
      o.connect(g); g.connect(a2.destination);
      o.start(n); o.stop(n + 0.22);
    }
    const bf = bass[bstep % bass.length];
    const ob = a2.createOscillator(), gb = a2.createGain();
    ob.type = "triangle";
    ob.frequency.setValueAtTime(bf, n);
    gb.gain.setValueAtTime(0.05, n);
    gb.gain.linearRampToValueAtTime(0.001, n + 0.28);
    ob.connect(gb); gb.connect(a2.destination);
    ob.start(n); ob.stop(n + 0.28);
    step++;
    if (step % 2 === 0) bstep++;
    if (musicPlaying) setTimeout(tick, 280);
  }
  tick();
}

function stopMusic() { musicPlaying = false; }

// --- BLOCK RENDERER ---
function drawBlock(type, x, y) {
  const S = BS;
  const drawOre = (bg, oc, dots) => {
    cx.fillStyle = bg; cx.fillRect(x, y, S, S);
    cx.strokeStyle = "rgba(0,0,0,0.35)"; cx.lineWidth = 0.5;
    cx.strokeRect(x + 0.5, y + 0.5, S - 1, S - 1);
    cx.fillStyle = oc;
    dots.forEach(d => cx.fillRect(x + d[0], y + d[1], d[2], d[2]));
  };
  switch (type) {
    case "grass":
      cx.fillStyle = "#6b3e1e"; cx.fillRect(x, y, S, S);
      cx.fillStyle = "#22c55e"; cx.fillRect(x, y, S, 8);
      cx.fillStyle = "#16a34a"; cx.fillRect(x, y, S, 3);
      cx.strokeStyle = "rgba(0,0,0,0.25)"; cx.lineWidth = 0.5; cx.strokeRect(x, y, S, S);
      break;
    case "dirt":
      cx.fillStyle = "#7c4a1e"; cx.fillRect(x, y, S, S);
      cx.fillStyle = "#6b3e16";
      for (let i = 0; i < 3; i++) cx.fillRect(x + 4 + i * 9, y + 5 + (i * 6) % (S - 8), 3, 3);
      cx.strokeStyle = "rgba(0,0,0,0.2)"; cx.lineWidth = 0.5; cx.strokeRect(x, y, S, S);
      break;
    case "stone":
      cx.fillStyle = "#6b6b6b"; cx.fillRect(x, y, S, S);
      cx.fillStyle = "#5a5a5a";
      cx.fillRect(x, y, S/2, S/2); cx.fillRect(x+S/2, y+S/2, S/2, S/2);
      cx.strokeStyle = "#444"; cx.lineWidth = 0.5;
      cx.strokeRect(x, y, S/2, S/2); cx.strokeRect(x+S/2, y, S/2, S/2);
      cx.strokeRect(x, y+S/2, S/2, S/2); cx.strokeRect(x+S/2, y+S/2, S/2, S/2);
      break;
    case "wood":
      cx.fillStyle = "#8B5E3C"; cx.fillRect(x, y, S, S);
      cx.fillStyle = "#7a4f2d"; cx.fillRect(x + S/2 - 2, y, 4, S);
      cx.strokeStyle = "#5c3412"; cx.lineWidth = 0.5;
      for (let i = 0; i < 4; i++) cx.strokeRect(x, y + i*(S/4), S, S/4);
      break;
    case "leaves":
      cx.fillStyle = "#1a6b1a"; cx.fillRect(x, y, S, S);
      cx.fillStyle = "#15571a"; cx.fillRect(x+2, y+2, S-4, S-4);
      cx.fillStyle = "#22a822";
      cx.fillRect(x+4, y+4, 6, 6); cx.fillRect(x+S-12, y+8, 5, 5); cx.fillRect(x+6, y+S-12, 5, 5);
      cx.strokeStyle = "rgba(0,0,0,0.3)"; cx.lineWidth = 0.5; cx.strokeRect(x, y, S, S);
      break;
    case "sand":
      cx.fillStyle = "#d4b483"; cx.fillRect(x, y, S, S);
      cx.fillStyle = "#c9a96e";
      for (let i = 0; i < 6; i++) cx.fillRect(x + 2 + i*5, y + 3 + (i*7)%S, 2, 2);
      cx.strokeStyle = "rgba(0,0,0,0.15)"; cx.lineWidth = 0.5; cx.strokeRect(x, y, S, S);
      break;
    case "coal":
      drawOre("#2d2d2d", "#111", [[5,5,5],[15,14,4],[8,17,5],[18,7,4]]);
      break;
    case "iron":
      drawOre("#8c7055", "#d4956a", [[5,5,6],[17,5,5],[5,17,5],[17,17,6],[11,11,5]]);
      break;
    case "gold":
      drawOre("#2a2a2a", "#facc15", [[5,5,6],[17,5,5],[5,17,6],[17,17,5],[12,12,4]]);
      break;
    case "diamond":
      drawOre("#1a1a2e", "#22d3ee", [[6,4,6],[17,4,6],[4,15,6],[17,15,6],[12,10,5]]);
      break;
    case "emerald":
      drawOre("#1a2e1a", "#4ade80", [[5,4,6],[17,5,6],[5,17,6],[17,17,5],[12,11,5]]);
      break;
    case "lava":
      cx.fillStyle = "#7f1d1d"; cx.fillRect(x, y, S, S);
      cx.fillStyle = "#ef4444"; cx.fillRect(x+2, y+2, S-4, 11);
      cx.fillStyle = "#f97316"; cx.fillRect(x+4, y+4, 9, 5); cx.fillRect(x+18, y+7, 6, 4);
      cx.fillStyle = "#fbbf24"; cx.fillRect(x+7, y+5, 4, 3);
      break;
    case "obsidian":
      cx.fillStyle = "#1a0a2e"; cx.fillRect(x, y, S, S);
      cx.fillStyle = "#2d1b4e"; cx.fillRect(x+2, y+2, S-4, S-4);
      cx.fillStyle = "#4c1d95";
      cx.fillRect(x+9, y+9, 5, 5); cx.fillRect(x+18, y+3, 4, 4);
      cx.strokeStyle = "#312059"; cx.lineWidth = 0.5; cx.strokeRect(x, y, S, S);
      break;
    case "tnt":
      cx.fillStyle = "#dc2626"; cx.fillRect(x, y, S, S);
      cx.fillStyle = "#ffffff"; cx.fillRect(x, y+9, S, 11);
      cx.fillStyle = "#000000"; cx.font = "bold 9px monospace"; cx.fillText("TNT", x+6, y+18);
      cx.fillStyle = "#7f1d1d"; cx.fillRect(x, y, S, 5); cx.fillRect(x, y+S-5, S, 5);
      break;
  }
}

// --- RENDER LOOP ---
let frame = 0;
function render() {
  frame++;
  cx.clearRect(0, 0, W, H);

  // Sky
  const skyH = 5 * BS;
  cx.fillStyle = "#0f1a4a"; cx.fillRect(0, 0, W, skyH * 0.45);
  cx.fillStyle = "#1e3a8a"; cx.fillRect(0, skyH * 0.45, W, skyH * 0.55);

  // Stars (parallax)
  stars.forEach(s => {
    let sx = s.x - camX * 0.2;
    while (sx < 0) sx += W; while (sx > W) sx -= W;
    cx.fillStyle = "rgba(255,255,255," + (0.5 + 0.4 * Math.sin(frame * 0.05 + s.x)) + ")";
    cx.beginPath(); cx.arc(sx, s.y, s.r, 0, Math.PI*2); cx.fill();
  });

  // Clouds (parallax)
  cx.fillStyle = "rgba(255,255,255,0.52)";
  clouds.forEach(cl => {
    let rx = cl.x - camX * 0.35;
    while (rx < -120) rx += WW + 120;
    cx.beginPath();
    cx.arc(rx, cl.y, 13, 0, Math.PI*2);
    cx.arc(rx+18, cl.y-11, 18, 0, Math.PI*2);
    cx.arc(rx+38, cl.y-2, 13, 0, Math.PI*2);
    cx.arc(rx+52, cl.y+5, 11, 0, Math.PI*2);
    cx.fill();
  });

  // Blocks
  const sc = Math.max(0, Math.floor(camX / BS));
  const ec = Math.min(sc + Math.ceil(W / BS) + 2, COLS);
  for (let r = 0; r < ROWS; r++) {
    for (let c = sc; c < ec; c++) {
      const t = world[r][c];
      if (t && t !== "sky") drawBlock(t, c*BS - camX, r*BS);
    }
  }

  // HUD
  cx.fillStyle = "rgba(0,0,0,0.72)";
  cx.fillRect(8, 8, 220, 110);
  const mCol = mode === "mine" ? "#f87171" : "#4ade80";
  cx.fillStyle = mCol; cx.fillRect(8, 8, 5, 110);
  cx.fillStyle = "#ffffff"; cx.font = "bold 13px monospace";
  cx.fillText("SCORE: " + score,                  20, 30);
  cx.fillText("MODE:  " + mode.toUpperCase() + " [SPACE]", 20, 50);
  cx.fillText("BLOCK: " + sel.toUpperCase(),       20, 70);
  cx.fillStyle = musicOn ? "#4ade80" : "#f87171";
  cx.fillText("MUSIC: " + (musicOn ? "ON" : "OFF") + " [M]", 20, 90);
  cx.fillStyle = "#666"; cx.font = "10px monospace";
  cx.fillText("CRAFT BOUND v2", 20, 108);
}

// --- TOOLBAR ---
function buildToolbar() {
  const tb = document.getElementById("toolbar");
  BUILDABLE.forEach((b, i) => {
    const btn = document.createElement("button");
    btn.id = "btn_" + b;
    btn.className = "tbtn" + (b === sel ? " active" : "");
    btn.textContent = (i+1) + " " + b.charAt(0).toUpperCase() + b.slice(1);
    btn.onclick = () => { sel = b; updateBtns(); };
    tb.appendChild(btn);
  });

  const mbtn = document.createElement("button");
  mbtn.id = "mbtn";
  mbtn.textContent = "M  Music";
  mbtn.onclick = toggleMusic;
  tb.appendChild(mbtn);

  const modbtn = document.createElement("button");
  modbtn.id = "modbtn";
  modbtn.textContent = "Space  Mine";
  modbtn.onclick = () => { mode = mode === "mine" ? "build" : "mine"; updateMode(); };
  tb.appendChild(modbtn);
}

function updateBtns() {
  BUILDABLE.forEach(b => {
    const btn = document.getElementById("btn_" + b);
    if (btn) btn.className = "tbtn" + (b === sel ? " active" : "");
  });
}

function updateMode() {
  const btn = document.getElementById("modbtn");
  if (!btn) return;
  btn.textContent = "Space  " + (mode === "mine" ? "Mine" : "Build");
  btn.className = mode === "build" ? "build" : "";
}

function toggleMusic() {
  musicOn = !musicOn;
  if (musicOn) { getAC(); startMusic(); } else stopMusic();
  const mb = document.getElementById("mbtn");
  if (mb) mb.className = musicOn ? "on" : "";
}

buildToolbar();

// --- CONTROLS ---
window.addEventListener("keydown", e => {
  if (e.key === "a" || e.key === "ArrowLeft")  { e.preventDefault(); camX = Math.max(0, camX - 36); }
  if (e.key === "d" || e.key === "ArrowRight") { e.preventDefault(); camX = Math.min(WW - W, camX + 36); }
  if (e.key === " ") { e.preventDefault(); mode = mode === "mine" ? "build" : "mine"; updateMode(); }
  if (e.key === "m" || e.key === "M") toggleMusic();
  const bi = parseInt(e.key) - 1;
  if (bi >= 0 && bi < BUILDABLE.length) { sel = BUILDABLE[bi]; updateBtns(); }
});

cv.addEventListener("click", e => {
  const rect = cv.getBoundingClientRect();
  const scX = W / rect.width, scY = H / rect.height;
  const wx = (e.clientX - rect.left) * scX + camX;
  const wy = (e.clientY - rect.top) * scY;
  const c = Math.floor(wx / BS), r = Math.floor(wy / BS);
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;

  if (mode === "mine") {
    const t = world[r][c];
    if (!t || t === "sky") return;
    if (t === "tnt") {
      playSound("tnt");
      for (let dr = -3; dr <= 3; dr++) {
        for (let dc = -3; dc <= 3; dc++) {
          const nr = r+dr, nc = c+dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && world[nr][nc] !== "sky") {
            score += BLOCKS[world[nr][nc]]?.score || 5;
            world[nr][nc] = "sky";
          }
        }
      }
    } else {
      score += BLOCKS[t]?.score || 5;
      if (t === "diamond" || t === "emerald") playSound("diamond");
      else if (t === "lava") playSound("lava");
      else playSound("mine");
      world[r][c] = "sky";
    }
  } else {
    if (world[r][c] === "sky") {
      playSound("build");
      world[r][c] = sel;
    }
  }
});

function loop() {
  clouds.forEach(cl => { cl.x += cl.s; if (cl.x > WW+120) cl.x = -120; });
  render();
  requestAnimationFrame(loop);
}
loop();
})();
