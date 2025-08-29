// Complete Flappy Chicken Game - Fully Featured Version
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const menuElement = document.getElementById('menu');

// Game state
let gameRunning = false;
let gameStarted = false;
let gamePaused = false;
let score = 0;
let frameCount = 0;
let bestScore = localStorage.getItem('flappyChickenBest') || 0;
let difficulty = localStorage.getItem('flappyChickenDifficulty') || 'normal';
let soundEnabled = localStorage.getItem('flappyChickenSound') !== 'false';

// Chicken properties with difficulty scaling
const chickenBase = {
    x: 100,
    y: 250,
    width: 35,
    height: 25,
    velocity: 0,
    rotation: 0,
    maxVelocity: 8
};

const difficulties = {
    easy: { gravity: 0.25, jumpPower: -6, pipeGap: 220, pipeSpeed: 1.5 },
    normal: { gravity: 0.35, jumpPower: -7, pipeSpeed: 2, pipeGap: 200 },
    hard: { gravity: 0.45, jumpPower: -8, pipeSpeed: 2.5, pipeGap: 180 }
};

let chicken = { ...chickenBase };
let currentDifficulty = difficulties[difficulty];

// Pipes and obstacles
let pipes = [];
const pipeWidth = 60;

// Visual elements
let particles = [];
let clouds = [];
let stars = [];
let chickenImages = [];
let currentChickenIndex = 0;

// Ground
const groundHeight = 80;
const ground = canvas.height - groundHeight;

// Sound effects (using Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let sounds = {};

// Create sound effects
function createSound(frequency, duration, type = 'sine') {
    return {
        play: () => {
            if (!soundEnabled) return;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        }
    };
}

// Initialize sounds
sounds.jump = createSound(400, 0.1, 'square');
sounds.score = createSound(800, 0.2, 'sine');
sounds.gameOver = createSound(150, 0.5, 'sawtooth');

// Particle system
class Particle {
    constructor(x, y, color, velocity) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = velocity;
        this.life = 1.0;
        this.decay = 0.02;
        this.size = Math.random() * 3 + 1;
    }
    
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y += 0.1; // gravity
        this.life -= this.decay;
        this.size *= 0.98;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

// Create multiple chicken sprites
function createChickenVariations() {
    const variations = [
        { body: '#FFD700', accent: '#FFA500', comb: '#FF0000' }, // Golden
        { body: '#DEB887', accent: '#CD853F', comb: '#DC143C' }, // Brown
        { body: '#F5F5DC', accent: '#D2B48C', comb: '#FF6347' }, // Beige
        { body: '#FF7F50', accent: '#FF6347', comb: '#FF0000' }, // Orange
        { body: '#98FB98', accent: '#90EE90', comb: '#FF1493' }  // Special Green
    ];
    
    return variations.map(colors => {
        const img = new Image();
        const svgChicken = `
            <svg width="35" height="25" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="17" cy="17" rx="12" ry="8" fill="${colors.body}" stroke="${colors.accent}" stroke-width="1"/>
                <circle cx="25" cy="10" r="6" fill="${colors.body}" stroke="${colors.accent}" stroke-width="1"/>
                <polygon points="29,10 34,11 29,12" fill="#FF8C00"/>
                <circle cx="27" cy="8" r="1.2" fill="#000"/>
                <circle cx="27.3" cy="7.7" r="0.4" fill="#FFF"/>
                <path d="M 22 5 Q 24 3 26 5 Q 28 3 30 5" fill="${colors.comb}"/>
                <ellipse cx="15" cy="15" rx="4" ry="6" fill="${colors.accent}" stroke="${colors.body}" stroke-width="0.5"/>
                <ellipse cx="8" cy="16" rx="3" ry="5" fill="${colors.accent}" stroke="${colors.body}" stroke-width="0.5"/>
            </svg>
        `;
        img.src = 'data:image/svg+xml;base64,' + btoa(svgChicken);
        return img;
    });
}

// Try to fetch real chicken images
async function fetchChickenImages() {
    const apis = [
        'https://api.unsplash.com/photos/random?query=chicken&client_id=demo',
        'https://picsum.photos/35/25', // Fallback to random images
        'https://source.unsplash.com/35x25/?chicken'
    ];
    
    for (const api of apis) {
        try {
            const response = await fetch(api);
            if (response.ok) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                if (api.includes('unsplash.com/photos')) {
                    const data = await response.json();
                    img.src = data.urls.thumb;
                } else {
                    img.src = api;
                }
                
                return new Promise((resolve) => {
                    img.onload = () => resolve([img]);
                    img.onerror = () => resolve(createChickenVariations());
                });
            }
        } catch (error) {
            console.log('Failed to fetch from', api);
        }
    }
    
    return createChickenVariations();
}

// Initialize clouds
function initClouds() {
    clouds = [];
    for (let i = 0; i < 6; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 200 + 50,
            size: Math.random() * 30 + 20,
            speed: Math.random() * 0.5 + 0.2,
            opacity: Math.random() * 0.3 + 0.1
        });
    }
}

// Initialize stars (for night mode)
function initStars() {
    stars = [];
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.6,
            size: Math.random() * 2 + 1,
            twinkle: Math.random() * Math.PI * 2
        });
    }
}

// Initialize game
async function init() {
    chickenImages = await fetchChickenImages();
    initClouds();
    initStars();
    reset();
    gameLoop();
    updateBestScore();
    showMenu();
}

// Show main menu
function showMenu() {
    menuElement.style.display = 'block';
    gameOverElement.style.display = 'none';
    gameStarted = false;
    gameRunning = false;
}

// Hide menu and start game
function hideMenu() {
    menuElement.style.display = 'none';
}

// Reset game
function reset() {
    Object.assign(chicken, chickenBase);
    chicken.y = canvas.height / 2;
    pipes = [];
    particles = [];
    score = 0;
    frameCount = 0;
    gameRunning = false;
    gameStarted = false;
    gamePaused = false;
    gameOverElement.style.display = 'none';
    updateScore();
    currentDifficulty = difficulties[difficulty];
}

// Create pipe with enhanced visuals
function createPipe() {
    const minHeight = 80;
    const maxHeight = ground - currentDifficulty.pipeGap - 80;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + currentDifficulty.pipeGap,
        passed: false,
        highlight: false
    });
}

// Add particles
function addParticles(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(
            x + Math.random() * 20 - 10,
            y + Math.random() * 20 - 10,
            color,
            {
                x: (Math.random() - 0.5) * 4,
                y: (Math.random() - 0.5) * 4 - 2
            }
        ));
    }
}

// Update game
function update() {
    if (!gameRunning || gamePaused) return;
    
    frameCount++;
    
    // Update chicken physics
    chicken.velocity += currentDifficulty.gravity;
    if (chicken.velocity > chicken.maxVelocity) {
        chicken.velocity = chicken.maxVelocity;
    }
    chicken.y += chicken.velocity;
    
    // Chicken rotation based on velocity
    chicken.rotation = Math.min(Math.max(chicken.velocity * 0.08, -0.3), 0.3);
    
    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= currentDifficulty.pipeSpeed;
        
        // Highlight upcoming pipe
        pipe.highlight = pipe.x > chicken.x - 50 && pipe.x < chicken.x + 100;
        
        // Score when passing pipe
        if (!pipe.passed && pipe.x + pipeWidth < chicken.x) {
            pipe.passed = true;
            score++;
            sounds.score.play();
            updateScore();
            
            // Add score particles
            addParticles(pipe.x + pipeWidth, pipe.topHeight + currentDifficulty.pipeGap / 2, '#FFD700', 8);
            
            // Change chicken every 5 points
            if (score % 5 === 0 && chickenImages.length > 1) {
                currentChickenIndex = (currentChickenIndex + 1) % chickenImages.length;
            }
        }
        
        // Remove off-screen pipes
        if (pipe.x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
        
        // Collision detection
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
    
    // Create new pipes
    const pipeInterval = difficulty === 'easy' ? 300 : difficulty === 'normal' ? 250 : 200;
    if (frameCount > 240 && (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - pipeInterval)) {
        createPipe();
    }
    
    // Update particles
    particles = particles.filter(particle => {
        particle.update();
        return !particle.isDead();
    });
    
    // Update clouds
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.size < 0) {
            cloud.x = canvas.width + cloud.size;
            cloud.y = Math.random() * 200 + 50;
        }
    });
    
    // Ground and ceiling collision
    if (chicken.y + chicken.height > ground - 5 || chicken.y < 5) {
        gameOver();
    }
}

// Enhanced drawing
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Time-based background
    const timeOfDay = (frameCount / 1000) % 1;
    const isNight = timeOfDay > 0.5;
    
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (isNight) {
        gradient.addColorStop(0, '#191970');
        gradient.addColorStop(0.7, '#483D8B');
        gradient.addColorStop(1, '#2F4F4F');
    } else {
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#87CEEB');
        gradient.addColorStop(0.8, '#90EE90');
        gradient.addColorStop(1, '#228B22');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Stars (night mode)
    if (isNight) {
        ctx.fillStyle = '#FFF';
        stars.forEach(star => {
            star.twinkle += 0.1;
            const alpha = (Math.sin(star.twinkle) + 1) / 2 * 0.8 + 0.2;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
    
    // Clouds
    clouds.forEach(cloud => {
        ctx.save();
        ctx.globalAlpha = cloud.opacity;
        ctx.fillStyle = isNight ? '#E6E6FA' : '#FFF';
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.6, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 1.2, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    
    // Enhanced pipes
    pipes.forEach(pipe => {
        const pipeColor = pipe.highlight ? '#32CD32' : '#228B22';
        const capColor = pipe.highlight ? '#7FFF00' : '#32CD32';
        
        ctx.fillStyle = pipeColor;
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 2;
        
        // Top pipe
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, ground - pipe.bottomY);
        ctx.strokeRect(pipe.x, pipe.bottomY, pipeWidth, ground - pipe.bottomY);
        
        // Pipe caps with glow effect
        if (pipe.highlight) {
            ctx.shadowColor = '#7FFF00';
            ctx.shadowBlur = 10;
        }
        
        ctx.fillStyle = capColor;
        ctx.fillRect(pipe.x - 3, pipe.topHeight - 15, pipeWidth + 6, 15);
        ctx.fillRect(pipe.x - 3, pipe.bottomY, pipeWidth + 6, 15);
        ctx.strokeRect(pipe.x - 3, pipe.topHeight - 15, pipeWidth + 6, 15);
        ctx.strokeRect(pipe.x - 3, pipe.bottomY, pipeWidth + 6, 15);
        
        ctx.shadowBlur = 0;
    });
    
    // Ground with texture
    const groundGradient = ctx.createLinearGradient(0, ground, 0, canvas.height);
    groundGradient.addColorStop(0, '#8B4513');
    groundGradient.addColorStop(1, '#654321');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, ground, canvas.width, groundHeight);
    
    // Grass
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < canvas.width; i += 8) {
        const grassHeight = Math.sin(i * 0.1 + frameCount * 0.02) * 2 + 5;
        ctx.fillRect(i, ground - grassHeight, 4, grassHeight);
    }
    
    // Particles
    particles.forEach(particle => particle.draw());
    
    // Enhanced chicken with glow effect
    if (gameRunning) {
        ctx.save();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 5;
        ctx.translate(chicken.x + chicken.width/2, chicken.y + chicken.height/2);
        ctx.rotate(chicken.rotation);
        
        const chickenImg = chickenImages[currentChickenIndex] || chickenImages[0];
        ctx.drawImage(chickenImg, -chicken.width/2, -chicken.height/2, chicken.width, chicken.height);
        ctx.restore();
    }
    
    // UI Elements
    drawUI();
}

// Draw UI elements
function drawUI() {
    // Score with glow
    ctx.save();
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 3;
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, 40);
    
    // Difficulty indicator
    ctx.font = '14px Arial';
    ctx.fillText(`${difficulty.toUpperCase()} MODE`, canvas.width / 2, 60);
    ctx.restore();
    
    // Pause indicator
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
        ctx.font = '18px Arial';
        ctx.fillText('Press P to resume', canvas.width/2, canvas.height/2 + 40);
    }
    
    // Start screen
    if (!gameStarted && !gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 42px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🐔 Flappy Chicken 🐔', canvas.width/2, canvas.height/2 - 80);
        
        ctx.font = '20px Arial';
        ctx.fillText('Keep clicking to stay airborne!', canvas.width/2, canvas.height/2 - 20);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('Click to start!', canvas.width/2, canvas.height/2 + 20);
        
        if (bestScore > 0) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#FFF';
            ctx.fillText(`Best Score: ${bestScore}`, canvas.width/2, canvas.height/2 + 60);
        }
        
        ctx.textAlign = 'left';
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Jump with enhanced effects
function jump() {
    if (!gameStarted) {
        gameStarted = true;
        gameRunning = true;
        hideMenu();
    }
    
    if (gameRunning && !gamePaused) {
        chicken.velocity = currentDifficulty.jumpPower;
        sounds.jump.play();
        
        // Add jump particles
        addParticles(chicken.x, chicken.y + chicken.height, '#87CEEB', 3);
    }
}

// Game over with effects
function gameOver() {
    gameRunning = false;
    sounds.gameOver.play();
    
    // Add explosion particles
    addParticles(chicken.x + chicken.width/2, chicken.y + chicken.height/2, '#FF4500', 15);
    
    // Update best score
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('flappyChickenBest', bestScore);
        updateBestScore();
        document.getElementById('newRecord').style.display = 'block';
    } else {
        document.getElementById('newRecord').style.display = 'none';
    }
    
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
}

// Restart game
function restartGame() {
    reset();
    jump(); // Start immediately
}

// Toggle pause
function togglePause() {
    if (gameStarted && gameRunning) {
        gamePaused = !gamePaused;
    }
}

// Change difficulty
function changeDifficulty(newDifficulty) {
    difficulty = newDifficulty;
    localStorage.setItem('flappyChickenDifficulty', difficulty);
    currentDifficulty = difficulties[difficulty];
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
    });
}

// Toggle sound
function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('flappyChickenSound', soundEnabled);
    document.getElementById('soundToggle').textContent = soundEnabled ? '🔊' : '🔇';
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
    switch(e.code) {
        case 'Space':
            e.preventDefault();
            jump();
            break;
        case 'KeyP':
            e.preventDefault();
            togglePause();
            break;
        case 'KeyM':
            e.preventDefault();
            showMenu();
            break;
    }
});

canvas.addEventListener('click', jump);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Touch support for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
});

// Start the game
init();