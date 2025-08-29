// Final Flappy Chicken Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');

// Game state
let gameRunning = false;
let gameStarted = false;
let score = 0;
let frameCount = 0;
let bestScore = localStorage.getItem('flappyChickenBest') || 0;

// Chicken properties (more forgiving physics)
const chicken = {
    x: 100,
    y: 250,
    width: 35,
    height: 25,
    velocity: 0,
    gravity: 0.35,
    jumpPower: -7,
    maxVelocity: 8
};

// Pipes
let pipes = [];
const pipeWidth = 60;
const pipeGap = 200; // Larger gap for easier gameplay
const pipeSpeed = 2;

// Ground
const groundHeight = 80;
const ground = canvas.height - groundHeight;

// Create beautiful SVG chicken
function createChicken() {
    const img = new Image();
    const svgChicken = `
        <svg width="35" height="25" xmlns="http://www.w3.org/2000/svg">
            <!-- Body -->
            <ellipse cx="17" cy="17" rx="12" ry="8" fill="#FFD700" stroke="#FFA500" stroke-width="1"/>
            <!-- Head -->
            <circle cx="25" cy="10" r="6" fill="#FFD700" stroke="#FFA500" stroke-width="1"/>
            <!-- Beak -->
            <polygon points="29,10 34,11 29,12" fill="#FF8C00"/>
            <!-- Eye -->
            <circle cx="27" cy="8" r="1.2" fill="#000"/>
            <circle cx="27.3" cy="7.7" r="0.4" fill="#FFF"/>
            <!-- Comb -->
            <path d="M 22 5 Q 24 3 26 5 Q 28 3 30 5" fill="#FF0000"/>
            <!-- Wing -->
            <ellipse cx="15" cy="15" rx="4" ry="6" fill="#FFA500" stroke="#FF8C00" stroke-width="0.5"/>
            <!-- Tail -->
            <ellipse cx="8" cy="16" rx="3" ry="5" fill="#FFA500" stroke="#FF8C00" stroke-width="0.5"/>
        </svg>
    `;
    img.src = 'data:image/svg+xml;base64,' + btoa(svgChicken);
    return img;
}

const chickenImg = createChicken();

// Initialize
function init() {
    reset();
    gameLoop();
    updateBestScore();
}

// Reset game
function reset() {
    chicken.y = 250;
    chicken.velocity = 0;
    pipes = [];
    score = 0;
    frameCount = 0;
    gameRunning = false;
    gameStarted = false;
    gameOverElement.style.display = 'none';
    updateScore();
}

// Create pipe with better positioning
function createPipe() {
    const minHeight = 80;
    const maxHeight = ground - pipeGap - 80;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + pipeGap,
        passed: false
    });
}

// Update game
function update() {
    if (!gameRunning) return;
    
    frameCount++;
    
    // Update chicken with max velocity limit
    chicken.velocity += chicken.gravity;
    if (chicken.velocity > chicken.maxVelocity) {
        chicken.velocity = chicken.maxVelocity;
    }
    chicken.y += chicken.velocity;
    
    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= pipeSpeed;
        
        // Score when passing pipe
        if (!pipe.passed && pipe.x + pipeWidth < chicken.x) {
            pipe.passed = true;
            score++;
            updateScore();
        }
        
        // Remove off-screen pipes
        if (pipe.x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
        
        // Collision detection with small margin for forgiveness
        const margin = 3;
        if (pipe.x < chicken.x + chicken.width - margin && 
            pipe.x + pipeWidth > chicken.x + margin) {
            if (chicken.y + margin < pipe.topHeight || 
                chicken.y + chicken.height - margin > pipe.bottomY) {
                gameOver();
                return;
            }
        }
    }
    
    // Create new pipes (wait 4 seconds before first pipe)
    if (frameCount > 240 && (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 300)) {
        createPipe();
    }
    
    // Ground and ceiling collision
    if (chicken.y + chicken.height > ground - 5 || chicken.y < 5) {
        gameOver();
    }
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#87CEEB');
    gradient.addColorStop(0.8, '#90EE90');
    gradient.addColorStop(1, '#228B22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clouds
    drawClouds();
    
    // Pipes
    ctx.fillStyle = '#228B22';
    ctx.strokeStyle = '#006400';
    ctx.lineWidth = 2;
    
    pipes.forEach(pipe => {
        // Top pipe
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, ground - pipe.bottomY);
        ctx.strokeRect(pipe.x, pipe.bottomY, pipeWidth, ground - pipe.bottomY);
        
        // Pipe caps
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(pipe.x - 3, pipe.topHeight - 15, pipeWidth + 6, 15);
        ctx.fillRect(pipe.x - 3, pipe.bottomY, pipeWidth + 6, 15);
        ctx.strokeRect(pipe.x - 3, pipe.topHeight - 15, pipeWidth + 6, 15);
        ctx.strokeRect(pipe.x - 3, pipe.bottomY, pipeWidth + 6, 15);
        ctx.fillStyle = '#228B22';
    });
    
    // Ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, ground, canvas.width, groundHeight);
    
    // Grass
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < canvas.width; i += 8) {
        ctx.fillRect(i, ground - 3, 4, 3);
    }
    
    // Chicken with rotation based on velocity
    ctx.save();
    ctx.translate(chicken.x + chicken.width/2, chicken.y + chicken.height/2);
    const rotation = Math.min(Math.max(chicken.velocity * 0.08, -0.3), 0.3);
    ctx.rotate(rotation);
    ctx.drawImage(chickenImg, -chicken.width/2, -chicken.height/2, chicken.width, chicken.height);
    ctx.restore();
    
    // Start screen
    if (!gameStarted) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 42px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🐔 Flappy Chicken 🐔', canvas.width/2, canvas.height/2 - 80);
        
        ctx.font = '20px Arial';
        ctx.fillText('Keep clicking or pressing SPACE', canvas.width/2, canvas.height/2 - 20);
        ctx.fillText('to keep the chicken flying!', canvas.width/2, canvas.height/2 + 10);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('Click anywhere to start!', canvas.width/2, canvas.height/2 + 60);
        
        if (bestScore > 0) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#FFF';
            ctx.fillText(`Best Score: ${bestScore}`, canvas.width/2, canvas.height/2 + 100);
        }
        
        ctx.textAlign = 'left';
    }
}

// Draw animated clouds
let cloudOffset = 0;
function drawClouds() {
    cloudOffset += 0.2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    for (let i = 0; i < 4; i++) {
        const x = (i * 200 + cloudOffset) % (canvas.width + 100) - 50;
        const y = 50 + i * 30;
        
        // Draw cloud
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
        ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Jump function
function jump() {
    if (!gameStarted) {
        gameStarted = true;
        gameRunning = true;
    }
    
    if (gameRunning) {
        chicken.velocity = chicken.jumpPower;
    }
}

// Game over
function gameOver() {
    gameRunning = false;
    
    // Update best score
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('flappyChickenBest', bestScore);
        updateBestScore();
    }
    
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
}

// Restart
function restartGame() {
    reset();
}

// Update score display
function updateScore() {
    scoreElement.textContent = `Score: ${score}`;
}

// Update best score display
function updateBestScore() {
    const bestElement = document.getElementById('bestScore');
    if (bestElement) {
        bestElement.textContent = `Best: ${bestScore}`;
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

canvas.addEventListener('click', jump);

// Prevent context menu on right click
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Start the game
init();