// Simple Flappy Chicken - Minimal working version
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

// Chicken
const chicken = {
    x: 100,
    y: 250,
    width: 40,
    height: 30,
    velocity: 0,
    gravity: 0.4,
    jumpPower: -8
};

// Pipes
let pipes = [];
const pipeWidth = 60;
const pipeGap = 180;
const pipeSpeed = 2;

// Ground
const groundHeight = 80;
const ground = canvas.height - groundHeight;

// Create SVG chicken
function createChicken() {
    const img = new Image();
    const svgChicken = `
        <svg width="40" height="30" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="20" cy="20" rx="15" ry="10" fill="#FFD700" stroke="#FFA500"/>
            <circle cx="28" cy="12" r="6" fill="#FFD700" stroke="#FFA500"/>
            <polygon points="32,12 38,14 32,16" fill="#FF8C00"/>
            <circle cx="30" cy="10" r="1" fill="#000"/>
            <path d="M 25 6 Q 27 4 29 6 Q 31 4 33 6" fill="#FF0000"/>
            <ellipse cx="15" cy="18" rx="5" ry="6" fill="#FFA500"/>
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

// Create pipe
function createPipe() {
    const minHeight = 50;
    const maxHeight = ground - pipeGap - 50;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + pipeGap,
        passed: false
    });
}

// Update
function update() {
    if (!gameRunning) return;
    
    frameCount++;
    
    // Update chicken
    chicken.velocity += chicken.gravity;
    chicken.y += chicken.velocity;
    
    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= pipeSpeed;
        
        // Score
        if (!pipe.passed && pipe.x + pipeWidth < chicken.x) {
            pipe.passed = true;
            score++;
            updateScore();
        }
        
        // Remove off-screen pipes
        if (pipe.x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
        
        // Collision check
        if (pipe.x < chicken.x + chicken.width && 
            pipe.x + pipeWidth > chicken.x) {
            if (chicken.y < pipe.topHeight || 
                chicken.y + chicken.height > pipe.bottomY) {
                gameOver();
                return;
            }
        }
    }
    
    // Create new pipes
    if (frameCount > 180 && (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 250)) {
        createPipe();
    }
    
    // Ground collision
    if (chicken.y + chicken.height > ground || chicken.y < 0) {
        gameOver();
    }
}

// Draw
function draw() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Sky
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.8, '#87CEEB');
    gradient.addColorStop(1, '#90EE90');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, ground, canvas.width, groundHeight);
    
    // Pipes
    ctx.fillStyle = '#228B22';
    pipes.forEach(pipe => {
        // Top pipe
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, ground - pipe.bottomY);
    });
    
    // Chicken
    ctx.drawImage(chickenImg, chicken.x, chicken.y, chicken.width, chicken.height);
    
    // Debug info
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.fillText(`Y: ${chicken.y.toFixed(1)} V: ${chicken.velocity.toFixed(2)}`, 10, 20);
    ctx.fillText(`Running: ${gameRunning} Started: ${gameStarted}`, 10, 35);
    ctx.fillText(`Pipes: ${pipes.length} Frame: ${frameCount}`, 10, 50);
    
    // Start screen
    if (!gameStarted) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Flappy Chicken', canvas.width/2, canvas.height/2 - 30);
        
        ctx.font = '18px Arial';
        ctx.fillText('Click or press SPACE to start!', canvas.width/2, canvas.height/2 + 20);
        ctx.textAlign = 'left';
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Jump
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
    console.log('Game Over! Score:', score);
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
}

// Restart
function restartGame() {
    reset();
}

// Update score
function updateScore() {
    scoreElement.textContent = `Score: ${score}`;
}

// Events
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

canvas.addEventListener('click', jump);

// Start
init();