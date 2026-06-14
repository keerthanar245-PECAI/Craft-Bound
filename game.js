const canvas = document.getElementById("sandboxCanvas");
const ctx = canvas.getContext("2d");

// Grid Map configuration settings
const tileSize = 30; 
const rows = canvas.height / tileSize; // 18 rows
const cols = canvas.width / tileSize;  // 12 columns

// Game Core Status Flags
let currentInteractionMode = "MINE"; // MINE or BUILD
let selectedBlockType = 1; // Default to Dirt
let blocksMinedCount = parseInt(localStorage.getItem("craftBoundMinedCount")) || 0;
document.getElementById("stats-mined").innerText = blocksMinedCount;

// Color and rendering keys mapping dictionary
const blockProfiles = {
    0: { name: "Air", color: "transparent", isSolid: false },
    1: { name: "Dirt", color: "#5d4037", stroke: "#3e2723", isSolid: true },
    2: { name: "Grass", color: "#4caf50", stroke: "#2e7d32", isSolid: true },
    3: { name: "Stone", color: "#616161", stroke: "#424242", isSolid: true },
    4: { name: "Gold Ore", color: "#ffc107", stroke: "#ff8f00", isSolid: true, flash: true },
    5: { name: "Gem Crystal", color: "#00e5ff", stroke: "#00b8d4", isSolid: true, flash: true }
};

let worldGrid = [];

// ==========================================================
// 🗺️ PROCEDURAL WORLD GENERATOR WITH AUTO-LOAD MECHANIC
// ==========================================================
function initWorldMap() {
    const savedMap = localStorage.getItem("craftBoundWorldGrid");
    
    if (savedMap) {
        worldGrid = JSON.parse(savedMap);
    } else {
        // Generate a completely clean procedural mountain horizon lines array structure 
        for (let r = 0; r < rows; r++) {
            worldGrid[r] = [];
            for (let c = 0; c < cols; c++) {
                let blockType = 0; // Default to Air sky space

                if (r > 7) { // Ground layer baseline profile starts here
                    let rand = Math.random();
                    if (r === 8) {
                        blockType = 2; // Surface always sprouts green grass
                    } else if (r > 8 && r < 13) {
                        blockType = rand > 0.15 ? 1 : 3; // Mixed Subsurface dirt and stones
                    } else {
                        // Deep cavern veins with high tier ores placement distribution formulas
                        if (rand > 0.94) blockType = 5;      // Rare Gems Crystal
                        else if (rand > 0.86) blockType = 4; // Gold Veins
                        else blockType = 3;                  // Solid rock bed
                    }
                }
                worldGrid[r][c] = blockType;
            }
        }
        saveWorldToCache();
    }
}

function saveWorldToCache() {
    localStorage.setItem("craftBoundWorldGrid", JSON.stringify(worldGrid));
    localStorage.setItem("craftBoundMinedCount", blocksMinedCount);
}

// ==========================================
// 🎨 RENDERING LOOPS PROCESSING MANAGEMENT
// ==========================================
let frameTick = 0;
function renderLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frameTick++;

    // Draw Sky sun elements background decoration
    ctx.fillStyle = "rgba(255, 252, 220, 0.08)";
    ctx.beginPath(); ctx.arc(60, 80, 40, 0, Math.PI*2); ctx.fill();

    // Iterate structural matrix grid paths array layouts updates
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let typeId = worldGrid[r][c];
            if (typeId === 0) continue; // Skip rendering transparent sky space profiles

            let profile = blockProfiles[typeId];
            ctx.fillStyle = profile.color;
            ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);

            // Add shimmering canvas effects to rare gold and gem blocks to attract players
            if (profile.flash && Math.sin(frameTick * 0.15 + (r + c)) > 0.4) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
            }

            // Outer structural block framing grids accents line drawing routines
            ctx.strokeStyle = profile.stroke;
            ctx.lineWidth = 1;
            ctx.strokeRect(c * tileSize, r * tileSize, tileSize, tileSize);
        }
    }

    requestAnimationFrame(renderLoop);
}

// ==========================================
// ⚡ CORE INTERACTION MECHANICS (MINE/BUILD)
// ==========================================
function handleActionClick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const tapX = clientX - rect.left;
    const tapY = clientY - rect.top;

    // Convert pixels to index coordinates mapping indicators properties
    const targetCol = Math.floor(tapX / tileSize);
    const targetRow = Math.floor(tapY / tileSize);

    // Guard safe boundaries ranges limits exceptions exits
    if (targetRow < 0 || targetRow >= rows || targetCol < 0 || targetCol >= cols) return;

    if (currentInteractionMode === "MINE") {
        let blockAtTarget = worldGrid[targetRow][targetCol];
        if (blockAtTarget !== 0) { // If it's not air, mine it
            worldGrid[targetRow][targetCol] = 0; // Instantly convert to Air
            blocksMinedCount++;
            document.getElementById("stats-mined").innerText = blocksMinedCount;
            saveWorldToCache();
        }
    } 
    else if (currentInteractionMode === "BUILD") {
        let blockAtTarget = worldGrid[targetRow][targetCol];
        if (blockAtTarget === 0) { // Can only build over empty air blocks
            worldGrid[targetRow][targetCol] = selectedBlockType; // Instantly place selected item
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
        
        // Auto switch to construction placement mode on selection action
        if (currentInteractionMode !== "BUILD") {
            toggleMode();
        }
    });
});

// Watch keyboard hotkey observers
window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        toggleMode();
        e.preventDefault();
    }
});

// Canvas pointer input parsing observers standard listeners
canvas.addEventListener("mousedown", (e) => handleActionClick(e.clientX, e.clientY));
canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length > 0) {
        handleActionClick(e.touches[0].clientX, e.touches[0].clientY);
    }
    e.preventDefault();
}, { passive: false });

// Boostrap world engine setup runtime loops lifecycle initialization execution updates
initWorldMap();
renderLoop();
