// --- CRAFT BOUND: OPTIMIZED PRO AUDIO & VISUAL ENGINE ---
const canvas = document.getElementById("sandboxCanvas");
const ctx = canvas.getContext("2d");

// Grid and World Properties
const BLOCK_SIZE = 30; 
const COLS = 40;
const ROWS = 30;
const WORLD_WIDTH = COLS * BLOCK_SIZE;
const WORLD_HEIGHT = ROWS * BLOCK_SIZE;

// Camera System
let cameraX = 0;

// Game State
let blocksMined = 0;
let currentMode = "mine"; // "mine" or "build"
let selectedMaterial = "grass";

// Generate World Matrix
const worldMatrix = [];
function generateWorld() {
    for (let r = 0; r < ROWS; r++) {
        worldMatrix[r] = [];
        for (let c = 0; c < COLS; c++) {
            if (r < 6) {
                worldMatrix[r][c] = "sky";
            } else if (r === 6) {
                worldMatrix[r][c] = "grass";
            } else if (r > 6 && r < 12) {
                worldMatrix[r][c] = Math.random() < 0.08 ? "gold" : "dirt";
            } else {
                let rand = Math.random();
                if (rand < 0.06) worldMatrix[r][c] = "diamond";
                else if (rand < 0.12) worldMatrix[r][c] = "gold";
                else if (rand < 0.17) worldMatrix[r][c] = "tnt";
                else worldMatrix[r][c] = "stone";
            }
        }
    }
}
generateWorld();

// Background Clouds Configuration
const clouds = [
    {x: 50, y: 30, w: 70, s: 0.1},
    {x: 250, y: 60, w: 90, s: 0.07},
    {x: 500, y: 25, w: 60, s: 0.13}
];

function updateClouds() {
    clouds.forEach(cloud => {
        cloud.x += cloud.s;
        if (cloud.x > WORLD_WIDTH) cloud.x = -cloud.w;
    });
}

// --- MATHEMATICAL AUDIO SYNTHESIZER (NO FILES NEEDED) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    // Resume audio context if browser suspended it
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === "mine") {
        // High-pitched retro mining pop/click
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === "build") {
        // Soft synth construction note
        osc.type = "triangle";
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === "tnt") {
        // Deep explosive white-noise simulation
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.4);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    }
}

// --- HIGH-PERFORMANCE VECTOR RENDERER ---
function drawBlock(type, x, y) {
    switch (type) {
        case "grass":
            ctx.fillStyle = "#5c3d24"; // soil base
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            ctx.fillStyle = "#4ade80"; // Bright vibrant green top
            ctx.fillRect(x, y, BLOCK_SIZE, 8);
            break;
        case "dirt":
            ctx.fillStyle = "#78350f";
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            break;
        case "stone":
            ctx.fillStyle = "#52525b";
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            ctx.strokeStyle = "#3f3f46";
            ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            break;
        case "gold":
            ctx.fillStyle = "#27272a";
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            ctx.fillStyle = "#facc15"; // High contrast golden elements
            ctx.fillRect(x+6, y+6, 8, 8);
            ctx.fillRect(x+16, y+16, 6, 6);
            break;
        case "diamond":
            ctx.fillStyle = "#18181b";
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            ctx.fillStyle = "#22d3ee"; // High-visibility neon cyan
            ctx.fillRect(x+8, y+4, 8, 8);
            ctx.fillRect(x+14, y+16, 8, 8);
            break;
        case "tnt":
            ctx.fillStyle = "#dc2626";
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x, y + 10, BLOCK_SIZE, 10);
            ctx.fillStyle = "#000000";
            ctx.font = "bold 9px sans-serif";
            ctx.fillText("TNT", x + 6, y + 18);
            break;
    }
}

// Master Render System
function renderGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Beautiful Custom Sky Gradient
    let skyGradient = ctx.createLinearGradient(0, 0, 0, 180);
    skyGradient.addColorStop(0, "#1e3a8a"); // Rich twilight blue
    skyGradient.addColorStop(1, "#3b82f6"); // Vibrant daytime horizon
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render Drifting Aesthetic Clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    clouds.forEach(cloud => {
        let renderX = cloud.x - cameraX;
        ctx.beginPath();
        ctx.arc(renderX, cloud.y, 14, 0, Math.PI * 2);
        ctx.arc(renderX + 15, cloud.y - 8, 18, 0, Math.PI * 2);
        ctx.arc(renderX + 35, cloud.y, 14, 0, Math.PI * 2);
        ctx.fill();
    });

    // Render Grid Layout within bounds
    const startCol = Math.floor(cameraX / BLOCK_SIZE);
    const endCol = Math.min(startCol + Math.ceil(canvas.width / BLOCK_SIZE) + 1, COLS);

    for (let r = 0; r < ROWS; r++) {
        for (let c = startCol; c < endCol; c++) {
            let blockType = worldMatrix[r][c];
            if (blockType !== "sky") {
                drawBlock(blockType, c * BLOCK_SIZE - cameraX, r * BLOCK_SIZE);
            }
        }
    }

    // Modern Interface HUD Overlay
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.fillRect(10, 10, 150, 70);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(SCORE: ${blocksMined}, 20, 28);
    ctx.fillText(MODE: ${currentMode.toUpperCase()} [Space], 20, 46);
    ctx.fillText(ITEM: ${selectedMaterial.toUpperCase()} [1-4], 20, 64);
}

// User Control Mapping
window.addEventListener("keydown", (e) => {
    if (e.key === "a" || e.key === "ArrowLeft") cameraX = Math.max(0, cameraX - 20);
    if (e.key === "d" || e.key === "ArrowRight") cameraX = Math.min(WORLD_WIDTH - canvas.width, cameraX + 20);
    if (e.key === " ") {
        e.preventDefault();
        currentMode = currentMode === "build" ? "mine" : "build";
    }
    if (e.key === "1") selectedMaterial = "grass";
    if (e.key === "2") selectedMaterial = "dirt";
    if (e.key === "3") selectedMaterial = "stone";
    if (e.key === "4") selectedMaterial = "tnt";
});

// Grid Interactions with Sound Integrations
canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left + cameraX;
    const clickY = e.clientY - rect.top;

    const c = Math.floor(clickX / BLOCK_SIZE);
    const r = Math.floor(clickY / BLOCK_SIZE);

    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        if (currentMode === "mine") {
            let targeted = worldMatrix[r][c];
            if (targeted !== "sky" && targeted !== "grass") {
                if (targeted === "tnt") {
                    playSound("tnt");
                    worldMatrix[r][c] = "sky";
                    blocksMined += 50;
                } else {
                    playSound("mine");
                    if (targeted === "diamond") blocksMined += 100;
                    else if (targeted === "gold") blocksMined += 30;
                    else blocksMined += 10;
                    worldMatrix[r][c] = "sky";
                }
            }
        } else if (currentMode === "build") {
            if (worldMatrix[r][c] === "sky") {
                playSound("build");
                worldMatrix[r][c] = selectedMaterial;
            }
        }
    }
});

// Smooth Execution Frame Loop
function mainGameLoop() {
    updateClouds();
    renderGame();
    requestAnimationFrame(mainGameLoop);
}
mainGameLoop();
