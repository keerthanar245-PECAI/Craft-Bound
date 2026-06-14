// ⚡ FIX: Automatically clear old broken map memory so the game loads instantly
if (!localStorage.getItem("craftBoundVersion3")) {
    localStorage.clear();
    localStorage.setItem("craftBoundVersion3", "true");
}

const canvas = document.getElementById("sandboxCanvas");
const ctx = canvas.getContext("2d");

// Grid Map configuration settings
const tileSize = 30; 
const rows = canvas.height / tileSize; // 18 rows
const worldCols = 150;  // Massive horizontally scrollable canvas map

// Camera state trackers
let cameraX = 0; 
let keysPressed = {};

// Game Core Status Flags
let currentInteractionMode = "MINE"; 
let selectedBlockType = 1; 
let blocksMinedCount = parseInt(localStorage.getItem("craftBoundMinedCount")) || 0;
document.getElementById("stats-mined").innerText = blocksMinedCount;

// Day/Night Cycle variables
let timeTicks = 0;
let isNight = false;

// Color and rendering profiles
const blockProfiles = {
    0: { name: "Air", color: "transparent", isSolid: false },
    1: { name: "Dirt", color: "#5d4037", stroke: "#3e2723", isSolid: true },
    2: { name: "Grass", color: "#4caf50", stroke: "#2e7d32", isSolid: true },
    3: { name: "Stone", color: "#616161", stroke: "#424242", isSolid: true },
    4: { name: "Gold Ore", color: "#ffc107", stroke: "#ff8f00", isSolid: true, flash: true },
    5: { name: "Gem Crystal", color: "#00e5ff", stroke: "#00b8d4", isSolid: true, flash: true },
    6: { name: "TNT", color: "#d50000", stroke: "#9a0007", isSolid: true, tnt: true }
};

let worldGrid = [];
let particles = [];

// ==========================================================
// 🗺️ PROCEDURAL WORLD GENERATOR WITH CAMERA TRACKING
// ==========================================================
function initWorldMap() {
    const savedMap = localStorage.getItem("craftBoundWorldGridV2");
    
    if (savedMap) {
        try {
            worldGrid = JSON.parse(savedMap);
        } catch(e) {
            generateNewWorld();
        }
    } else {
        generateNewWorld();
    }
}

function generateNewWorld() {
    for (let r = 0; r < rows; r++) {
        worldGrid[r] = [];
        let heightOffset = 0;

        for (let c = 0; c < worldCols; c++) {
            if (c % 6 === 0) heightOffset = Math.floor(Math.sin(c * 0.15) * 2);
            let surfaceRow = 8 + heightOffset;
            
            let blockType = 0; 
            if (r === surfaceRow) {
                blockType = 2; // Surface Grass
            } else if (r > surfaceRow && r < surfaceRow + 4) {
                blockType = Math.random() > 0.2 ? 1 : 3; 
            } else if (r >= surfaceRow + 4) {
                let rand = Math.random();
                if (rand > 0.96) blockType = 5;      
                else if (rand > 0.90) blockType = 4; 
                else if (rand > 0.88) blockType = 6; 
                else blockType = 3;                  
            }
            worldGrid[r][c] = blockType;
        }
    }
    saveWorldToCache();
}

function saveWorldToCache() {
    localStorage.setItem("craftBoundWorldGridV2", JSON.stringify(worldGrid));
    localStorage.setItem("craftBoundMinedCount", blocksMinedCount);
}

// ==========================================
// 💥 TNT EXPLO ENGINE PHYSICS MODULE
// ==========================================
function triggerExplosion(startRow, startCol) {
    let targetRadius = 2; 
    
    for (let r = startRow - targetRadius; r <= startRow + targetRadius; r++) {
        for (let c = startCol - targetRadius; c <= startCol + targetRadius; c++) {
            if (r >= 0 && r < rows && c >= 0 && c < worldCols) {
                let typeId = worldGrid[r][c];
                if (typeId !== 0) {
                    for (let p = 0; p < 3; p++) {
                        particles.push({
                            x: c * tileSize + tileSize/2,
                            y: r * tileSize + tileSize/2,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            life: 25,
                            color: blockProfiles[typeId].color
                        });
                    }
                    worldGrid[r][c] = 0; 
                    blocksMinedCount++;
                }
            }
        }
    }
    document.getElementById("stats-mined").innerText = blocksMinedCount;
    saveWorldToCache();
}

// ==========================================
// 🎨 ENGINE RUNTIME ENVIRONMENT RENDERING
// ==========================================
function renderLoop() {
    // Process Smooth Camera Scroll Inputs
    if (keysPressed['KeyD'] || keysPressed['ArrowRight']) cameraX += 5;
    if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) cameraX -= 5;
    
    if (cameraX < 0) cameraX = 0;
    if (cameraX > (worldCols * tileSize) - canvas.width) cameraX = (worldCols * tileSize) - canvas.width;

    timeTicks++;
    if (timeTicks % 900 === 0) { 
        isNight = !isNight;
        let timeBadge = document.getElementById("time-display");
        if(timeBadge) {
            timeBadge.innerText = isNight ? "🌙 NIGHT" : "☀️ DAY";
            timeBadge.style.color = isNight ? "#81b214" : "#ffb300";
        }
    }
    
    ctx.fillStyle = isNight ? "#0f172a" : "#1f4068";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraX, 0); 

    // Render Grid Tiles
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < worldCols; c++) {
            let typeId = worldGrid[r][c];
            if (typeId === undefined || typeId === 0) continue; 

            let profile = blockProfiles[typeId];
            if (!profile) continue;

            ctx.fillStyle = profile.color;
            ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);

            if (profile.flash && Math.sin(timeTicks * 0.1 + (r + c)) > 0.5) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
                ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
            }
            
            if (profile.tnt) {
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 9px sans-serif";
                ctx.fillText("TNT", c * tileSize + 6, r * tileSize + 18);
            }

            ctx.strokeStyle = profile.stroke;
            ctx.lineWidth = 1;
            ctx.strokeRect(c * tileSize, r * tileSize, tileSize, tileSize);
        }
    }

    // Update Particle Simulation Layer
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life--;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
        if (p.life <= 0) particles.splice(i, 1);
    }

    ctx.restore();
    requestAnimationFrame(renderLoop);
}

// ==========================================
// ⚡ INTERACTION ACTION RESOLUTION OVERSEE
// ==========================================
function handleActionClick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const tapX = clientX - rect.left + cameraX; 
    const tapY = clientY - rect.top;

    const targetCol = Math.floor(tapX / tileSize);
    const targetRow = Math.floor(tapY / tileSize);

    if (targetRow < 0 || targetRow >= rows || targetCol < 0 || targetCol >= worldCols) return;

    if (currentInteractionMode === "MINE") {
        let blockAtTarget = worldGrid[targetRow][targetCol];
        if (blockAtTarget !== 0 && blockAtTarget !== undefined) {
            if (blockProfiles[blockAtTarget] && blockProfiles[blockAtTarget].tnt) {
                triggerExplosion(targetRow, targetCol);
            } else {
                worldGrid[targetRow][targetCol] = 0; 
                blocksMinedCount++;
                document.getElementById("stats-mined").innerText = blocksMinedCount;
                saveWorldToCache();
            }
        }
    } 
    else if (currentInteractionMode === "BUILD") {
        let blockAtTarget = worldGrid[targetRow][targetCol];
        if (blockAtTarget === 0 || blockAtTarget === undefined) { 
            worldGrid[targetRow][targetCol] = selectedBlockType; 
            saveWorldToCache();
        }
    }
}

function toggleMode() {
    let modeBadge = document.getElementById("mode-display");
    if (currentInteractionMode === "MINE") {
        currentInteractionMode = "BUILD";
        modeBadge.innerText = "🏗️ BUILDING";
        modeBadge.className = "mode-badge badge-build";
    } else {
        currentInteractionMode = "MINE";
        modeBadge.innerText = "⛏️ MINING";
        modeBadge.className = "mode-badge badge-mine";
    }
}

// ==========================================
// 🎒 HUD ELEMENT INTERACTIVE LISTENERS HOOKS
// ==========================================
document.querySelectorAll(".slot").forEach(slotElement => {
    slotElement.addEventListener("click", (e) => {
        document.querySelectorAll(".slot").forEach(s => s.classList.remove("active-slot"));
        let targetSlot = e.currentTarget;
        targetSlot.classList.add("active-slot");
        selectedBlockType = parseInt(targetSlot.getAttribute("data-block"));
        
        if (currentInteractionMode !== "BUILD") toggleMode();
    });
});

// Watch keyboard mapping hooks
window.addEventListener("keydown", (e) => {
    keysPressed[e.code] = true;
    if (e.code === "Space") {
        toggleMode();
        e.preventDefault();
    }
});
window.addEventListener("keyup", (e) => { keysPressed[e.code] = false; });

canvas.addEventListener("mousedown", (e) => handleActionClick(e.clientX, e.clientY));
canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length > 0) handleActionClick(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault();
}, { passive: false });

// Bootstrap Engine Initiation
initWorldMap();
renderLoop();
