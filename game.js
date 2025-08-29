// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');

// Game state
let gameRunning = false;
let gameStarted = false;
let score = 0;
let chickenImage = null;
let imageLoaded = false;
let gameTime = 0;

// Chicken properties
const chicken = {
    x: 100,
    y: canvas.height / 2,
    width: 40,
    height: 30,
    velocity: 0,
    gravity: 0.5,
    jumpPower: -10,
    rotation: 0
};

// Pipes array
let pipes = [];
const pipeWidth = 80;
const pipeGap = 250;
const pipeSpeed = 3;

// Background elements
let clouds = [];
let ground = canvas.height - 100;

// Initialize clouds
function initClouds() {
    clouds = [];
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 150 + 50,
            width: 60 + Math.random() * 40,
            height: 30 + Math.random() * 20,
            speed: 0.5 + Math.random() * 0.5
        });
    }
}

// Load random chicken image (will be overridden by chicken-api.js if available)
async function loadChickenImage() {
    // This function will be replaced by the enhanced version in chicken-api.js
    // Fallback implementation
    createSVGChicken();
}

function createSVGChicken() {
    const img = new Image();
    const svgChicken = `
        <svg width="50" height="40" xmlns="http://www.w3.org/2000/svg">
            <!-- Chicken body -->
            <ellipse cx="25" cy="25" rx="18" ry="12" fill="#FFD700" stroke="#FFA500" stroke-width="1"/>
            <!-- Chicken head -->
            <circle cx="35" cy="15" r="8" fill="#FFD700" stroke="#FFA500" stroke-width="1"/>
            <!-- Beak -->
            <polygon points="40,15 47,17 40,19" fill="#FF8C00"/>
            <!-- Eye -->
            <circle cx="37" cy="12" r="1.5" fill="#000"/>
            <circle cx="37.5" cy="11.5" r="0.5" fill="#FFF"/>
            <!-- Comb -->
            <path d="M 32 8 Q 34 5 36 8 Q 38 5 40 8 Q 38 10 36 8 Q 34 10 32 8" fill="#FF0000"/>
            <!-- Wing -->
            <ellipse cx="22" cy="20" rx="6" ry="8" fill="#FFA500" stroke="#FF8C00" stroke-width="1"/>
            <!-- Wing details -->
            <path d="M 18 18 Q 22 16 26 20 Q 22 24 18 22" fill="#FF8C00"/>
            <!-- Tail feathers -->
            <ellipse cx="10" cy="22" rx="4" ry="8" fill="#FFA500" stroke="#FF8C00" stroke-width="1"/>
            <ellipse cx="8" cy="20" rx="3" ry="6" fill="#FF8C00"/>
            <!-- Legs -->
            <rect x="20" y="35" width="2" height="4" fill="#FF8C00"/>
            <rect x="28" y="35" width="2" height="4" fill="#FF8C00"/>
            <!-- Feet -->
            <path d="M 18 39 L 24 39 M 21 39 L 21 41" stroke="#FF8C00" stroke-width="1" fill="none"/>
            <path d="M 26 39 L 32 39 M 29 39 L 29 41" stroke="#FF8C00" stroke-width="1" fill="none"/>
        </svg>
    `;
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgChicken);
    img.onload = () => {
        chickenImage = img;
        imageLoaded = true;
        console.log('SVG chicken loaded successfully!');
    };
}

// Create a fallback chicken using canvas drawing
function createFallbackChicken() {
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 50;
    fallbackCanvas.height = 40;
    const fallbackCtx = fallbackCanvas.getContext('2d');
    
    // Draw a simple chicken
    fallbackCtx.fillStyle = '#FFD700';
    fallbackCtx.fillRect(5, 15, 30, 20); // Body
    fallbackCtx.fillRect(25, 5, 20, 15); // Head
    
    fallbackCtx.fillStyle = '#FF8C00';
    fallbackCtx.fillRect(40, 10, 8, 5); // Beak
    
    fallbackCtx.fillStyle = '#000';
    fallbackCtx.fillRect(35, 8, 3, 3); // Eye
    
    fallbackCtx.fillStyle = '#FF0000';
    fallbackCtx.fillRect(30, 2, 10, 5); // Comb
    
    chickenImage = fallbackCanvas;
    imageLoaded = true;
}

// Initialize game
function init() {
    initClouds();
    loadChickenImage();
    resetGame();
    gameLoop();
}

// Reset game state
function resetGame() {
    chicken.x = 100;
    chicken.y = canvas.height / 2;
    chicken.velocity = 0;
    chicken.rotation = 0;
    pipes = [];
    score = 0;
    gameTime = 0;
    gameRunning = false;
    gameStarted = false;
    gameOverElement.style.display = 'none';
    updateScore();
    console.log('Game reset! Chicken Y:', chicken.y, 'Canvas height:', canvas.height, 'Ground:', ground);
}

// Create new pipe
function createPipe() {
    const pipeHeight = Math.random() * (canvas.height - ground - pipeGap - 100) + 50;
    const newPipe = {
        x: canvas.width,
        topHeight: pipeHeight,
        bottomY: pipeHeight + pipeGap,
        bottomHeight: ground - (pipeHeight + pipeGap),
        passed: false
    };
    console.log('Creating pipe:', newPipe);
    pipes.push(newPipe);
}

// Update game state
function update() {
    if (!gameRunning) return;
    
    gameTime++;
    
    // Update chicken
    chicken.velocity += chicken.gravity;
    chicken.y += chicken.velocity;
    
    // Debug chicken position
    if (gameTime % 60 === 0) { // Log every second
        console.log('Chicken position - y:', chicken.y, 'velocity:', chicken.velocity, 'ground:', ground);
    }
    
    // Rotate chicken based on velocity
    chicken.rotation = Math.min(Math.max(chicken.velocity * 0.1, -0.5), 0.5);
    
    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= pipeSpeed;
        
        // Check if pipe passed chicken
        if (!pipe.passed && pipe.x + pipeWidth < chicken.x) {
            pipe.passed = true;
            score++;
            updateScore();
        }
        
        // Remove pipes that are off screen
        if (pipe.x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
        
        // Check collision with pipes
        if (checkPipeCollision(pipe)) {
            console.log('Pipe collision!');
            gameOver();
        }
    }
    
    // Create new pipes (wait longer before first pipe)
    if (pipes.length === 0 && gameStarted) {
        // Only create first pipe after some time has passed
        if (gameTime > 120) { // About 2 seconds at 60fps
            createPipe();
        }
    } else if (pipes.length > 0 && pipes[pipes.length - 1].x < canvas.width - 400) {
        createPipe();
    }
    
    // Check ground collision (only if game has been running for a bit)
    if (gameTime > 10 && (chicken.y + chicken.height > ground || chicken.y < 0)) {
        console.log('Ground collision! Chicken y:', chicken.y, 'Ground:', ground);
        gameOver();
    }
    
    // Update clouds
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width;
            cloud.y = Math.random() * 150 + 50;
        }
    });
}

// Check collision with pipe
function checkPipeCollision(pipe) {
    // Add some margin for more forgiving collision detection
    const margin = 5;
    if (chicken.x + margin < pipe.x + pipeWidth &&
        chicken.x + chicken.width - margin > pipe.x) {
        if (chicken.y + margin < pipe.topHeight ||
            chicken.y + chicken.height - margin > pipe.bottomY) {
            return true;
        }
    }
    return false;
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#87CEEB');
    gradient.addColorStop(0.7, '#90EE90');
    gradient.addColorStop(1, '#228B22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.width/3, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width/3, cloud.y, cloud.width/4, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width/2, cloud.y, cloud.width/3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw pipes
    ctx.fillStyle = '#228B22';
    ctx.strokeStyle = '#006400';
    ctx.lineWidth = 3;
    
    pipes.forEach(pipe => {
        // Top pipe
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, pipe.bottomHeight);
        ctx.strokeRect(pipe.x, pipe.bottomY, pipeWidth, pipe.bottomHeight);
        
        // Pipe caps
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, pipeWidth + 10, 20);
        ctx.fillRect(pipe.x - 5, pipe.bottomY, pipeWidth + 10, 20);
        ctx.strokeRect(pipe.x - 5, pipe.topHeight - 20, pipeWidth + 10, 20);
        ctx.strokeRect(pipe.x - 5, pipe.bottomY, pipeWidth + 10, 20);
        ctx.fillStyle = '#228B22';
    });
    
    // Draw ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, ground, canvas.width, canvas.height - ground);
    
    // Draw grass on ground
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < canvas.width; i += 10) {
        ctx.fillRect(i, ground - 5, 5, 5);
    }
    
    // Draw chicken
    if (imageLoaded && chickenImage) {
        ctx.save();
        ctx.translate(chicken.x + chicken.width/2, chicken.y + chicken.height/2);
        ctx.rotate(chicken.rotation);
        ctx.drawImage(chickenImage, -chicken.width/2, -chicken.height/2, chicken.width, chicken.height);
        ctx.restore();
    } else {
        // Fallback chicken drawing
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(chicken.x, chicken.y, chicken.width, chicken.height);
        ctx.fillStyle = '#FF8C00';
        ctx.fillRect(chicken.x + chicken.width - 10, chicken.y + 10, 8, 5);
    }
    
    // Draw debug info
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Chicken Y: ${chicken.y.toFixed(1)}`, 10, 20);
    ctx.fillText(`Ground: ${ground}`, 10, 35);
    ctx.fillText(`Game Running: ${gameRunning}`, 10, 50);
    ctx.fillText(`Game Started: ${gameStarted}`, 10, 65);
    ctx.fillText(`Velocity: ${chicken.velocity.toFixed(2)}`, 10, 80);
    ctx.fillText(`Chicken Bottom: ${(chicken.y + chicken.height).toFixed(1)}`, 10, 95);
    ctx.fillText(`Ground Check: ${chicken.y + chicken.height > ground}`, 10, 110);
    ctx.fillText(`Top Check: ${chicken.y < 0}`, 10, 125);
    ctx.fillText(`Pipes: ${pipes.length}`, 10, 140);
    ctx.fillText(`Game Time: ${gameTime}`, 10, 155);
    
    // Draw start message
    if (!gameStarted) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Flappy Chicken', canvas.width/2, canvas.height/2 - 50);
        
        ctx.font = '18px Arial';
        ctx.fillText('Press SPACE or click to start!', canvas.width/2, canvas.height/2 + 20);
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Make chicken jump
function jump() {
    console.log('Jump called! gameStarted:', gameStarted, 'gameRunning:', gameRunning);
    if (!gameStarted) {
        gameStarted = true;
        gameRunning = true;
        console.log('Game started!');
    }
    
    if (gameRunning) {
        chicken.velocity = chicken.jumpPower;
        console.log('Chicken jumped! Velocity:', chicken.velocity);
    }
}

// Game over
function gameOver() {
    console.log('GAME OVER CALLED!');
    console.log('Stack trace:', new Error().stack);
    console.log('Chicken position:', chicken.y, 'height:', chicken.height, 'bottom:', chicken.y + chicken.height);
    console.log('Ground position:', ground);
    console.log('Chicken top:', chicken.y, 'vs 0');
    console.log('Game time:', gameTime);
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
}

// Restart game
function restartGame() {
    resetGame();
}

// Update score display
function updateScore() {
    scoreElement.textContent = `Score: ${score}`;
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

canvas.addEventListener('click', jump);

// Start the game
init();