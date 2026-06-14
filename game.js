// --- CRAFT BOUND: PRO EDITION RENDERING ENGINE ---
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

// Game State & Cloud Savings Init
let blocksMined = 0;
let currentMode = "build"; // "mine" or "build"
let selectedMaterial = "grass"; // default active slot

// Cloud Data Sync Placeholder
async function initCloudSave() {
    try {
        if (typeof cgsdk !== 'undefined') {
            await cgsdk.user.getStorage();
            console.log("CrazyGames Cloud Sync Active.");
        }
    } catch(e) { console.log("Local Sandbox Environment Active."); }
}
initCloudSave();

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

// Background Clouds Simulation
const clouds = [
    {x: 50, y: 40, w: 90, s: 0.2},
    {x: 400, y: 80, w: 120, s: 0.15},
    {x: 800, y: 30, w: 70, s: 0.25}
];

function updateClouds() {
    clouds.forEach(cloud => {
        cloud.x += cloud.s;
        if (cloud.x > WORLD_WIDTH) cloud.x = -cloud.w;
    });
}

// --- ADVANCED ADVANCED PROCEDURAL TEXTURE RENDERER ---
function drawBlock(type, x, y) {
    ctx.save();
    
    // Reset canvas composition parameters to default for safety
    ctx.shadowBlur = 0; 
    
    switch (type) {
        case "grass":
            // Dirt base layer
            ctx.fillStyle = "#4a2f1b";
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            // Dynamic Grass Cap matching 1000033447.png
            ctx.fillStyle = "#3cd03c";
            ctx.fillRect(x, y, BLOCK_SIZE, 8);
            // Hanging root/pixel blades
            ctx.fillStyle = "#2ca02c";
            for (let i = 0; i < BLOCK_SIZE; i += 6) {
                ctx.fillRect(x + i, y + 8, 3, Math.floor(Math.random() * 4) + 2);
            }
            break;

        case "dirt":
            // Warm earthy soil tone
            ctx.fillStyle = "#5c3d24";
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            // Soil noise/grit detail
            ctx.fillStyle = "#432b18";
            ctx.fillRect(x + 4, y + 6, 4, 4);
            ctx.fillRect(x + 18, y + 14, 4, 4);
            ctx.fillRect(x + 10, y + 22, 4, 4);
            break;

        case "stone":
            // Chiseled deep grey brick
            ctx.fillStyle = "#404040";
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            ctx.strokeStyle = "#2b2b2b";
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
            // Highlights
            ctx.fillStyle = "#555555";
            ctx.fillRect(x + 3, y + 3, 6, 2);
            break;

        case "gold":
            // Dark base stone
            ctx.fillStyle = "#333333";
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            // Glowing Neon Gold settings
            ctx.shadowColor = "#ffcc00";
            ctx.shadowBlur = 12;
            ctx.fillStyle = "#ffd700";
            // Scattered gold nuggets pattern
            ctx.fillRect(x + 6, y + 6, 6, 6);
            ctx.fillRect(x + 18, y + 16, 8, 6);
            ctx.fillRect(x + 8, y + 20, 4, 4);
            break;

        case "diamond":
            // Deep obsidian underground background
            ctx.fillStyle = "#262626";
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            // High-intensity cyan emission
            ctx.shadowColor = "#00ffff";
            ctx.shadowBlur = 15;
            ctx.fillStyle = "#5bf0f0";
            // Distinct crystalline shards
            ctx.fillRect(x + 6, y + 14, 8, 8);
            ctx.fillRect(x + 18, y + 4, 6, 6);
            ctx.fillRect(x + 16, y + 18, 6, 6);
            break;

        case "tnt":
            // Explosive red block
            ctx.fillStyle = "#cc2424";
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            // White strap across middle
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x, y + 10, BLOCK_SIZE, 10);
            // Black text stamp
            ctx.fillStyle = "#000000";
            ctx.font = "bold 9px sans-serif";
            ctx.fillText("TNT", x + 6, y + 18);
            break;
    }
    ctx.restore();
}

// Master Render System
function renderGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw High-fidelity Atmospheric Sky Gradient
    let skyGradient = ctx.createLinearGradient(0, 0, 0, 200);
    skyGradient.addColorStop(0, "#0f4c81"); // Deep cinematic blue
    skyGradient.addColorStop(1, "#2a75b3"); // Warm horizon light
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Render and draw background clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    clouds.forEach(cloud => {
        let renderX = cloud.x - cameraX;
        ctx.beginPath();
        ctx.arc(renderX, cloud.y, 18, 0, Math.PI * 2);
        ctx.arc(renderX + 20, cloud.y - 10, 22, 0, Math.PI * 2);
        ctx.arc(renderX + 45, cloud.y, 18, 0, Math.PI * 2);
        ctx.fill();
    });

    // 3. Render Blocks Layout inside visible Camera Bounds
    const startCol = Math.floor(cameraX / BLOCK_SIZE);
    const endCol = Math.min(startCol + Math.ceil(canvas.width / BLOCK_SIZE) + 1, COLS);

    for (let r = 0; r < ROWS; r++) {
        for (let c = startCol; c < endCol; c++) {
            let blockType = worldMatrix[r][c];
            if (blockType !== "sky") {
                let blockX = c * BLOCK_SIZE - cameraX;
                let blockY = r * BLOCK_SIZE;
                drawBlock(blockType, blockX, blockY);
            }
        }
    }

    // 4. Render Interface HUD
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(10, 10, 140, 65);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(SCORE: ${blocksMined}, 20, 28);
    ctx.fillText(MODE: ${currentMode.toUpperCase()}, 20, 48);
    ctx.fillText(USE: ${selectedMaterial.toUpperCase()}, 20, 64);
}

// Controls, Interactions, and Movement Mechanics
window.addEventListener("keydown", (e) => {
    if (e.key === "a" || e.key === "ArrowLeft") {
        cameraX = Math.max(0, cameraX - 15);
    }
    if (e.key === "d" || e.key === "ArrowRight") {
        cameraX = Math.min(WORLD_WIDTH - canvas.width, cameraX + 15);
    }
    if (e.key === " ") {
        e.preventDefault();
        currentMode = currentMode === "build" ? "mine" : "build";
    }
    // Hotbar selector loops
    if(e.key === "1") selectedMaterial = "grass";
    if(e.key === "2") selectedMaterial = "dirt";
    if(e.key === "3") selectedMaterial = "stone";
    if(e.key === "4") selectedMaterial = "tnt";
});

// Canvas Interaction (Click or Mobile Touch Coordinates mapping)
canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left + cameraX;
    const clickY = e.clientY - rect.top;

    const c = Math.floor(clickX / BLOCK_SIZE);
    const r = Math.floor(clickY / BLOCK_SIZE);

    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        if (currentMode === "mine") {
            if (worldMatrix[r][c] !== "sky" && worldMatrix[r][c] !== "grass") {
                if(worldMatrix[r][c] === "diamond") blocksMined += 100;
                else if(worldMatrix[r][c] === "gold") blocksMined += 30;
                else blocksMined += 10;
                
                worldMatrix[r][c] = "sky";
            }
        } else if (currentMode === "build") {
            if (worldMatrix[r][c] === "sky") {
                worldMatrix[r][c] = selectedMaterial;
            }
        }
    }
});

// Main Loop Setup
function mainGameLoop() {
    updateClouds();
    renderGame();
    requestAnimationFrame(mainGameLoop);
}
mainGameLoop();
