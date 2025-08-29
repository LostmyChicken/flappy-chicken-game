// 🐔 Ultimate Flappy Chicken Game - Fully Complete Version
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameRunning = false;
let gameStarted = false;
let gamePaused = false;
let score = 0;
let frameCount = 0;
let bestScore = localStorage.getItem('flappyChickenBest') || 0;
let difficulty = localStorage.getItem('flappyChickenDifficulty') || 'normal';
let soundEnabled = localStorage.getItem('flappyChickenSound') !== 'false';
let currentLevel = 1;
let powerUpActive = null;
let powerUpTimer = 0;
let comboMultiplier = 1;
let comboTimer = 0;

// Enhanced chicken properties
const chickenBase = {
    x: 100,
    y: 250,
    width: 35,
    height: 25,
    velocity: 0,
    rotation: 0,
    maxVelocity: 8,
    trail: [],
    invulnerable: false,
    invulnerabilityTimer: 0,
    size: 1.0,
    glowIntensity: 0
};

// Difficulty settings with faster pipe appearance
const difficulties = {
    easy: { 
        gravity: 0.25, 
        jumpPower: -6, 
        pipeGap: 220, 
        pipeSpeed: 1.5,
        pipeInterval: 200,
        firstPipeDelay: 90  // Reduced from 240
    },
    normal: { 
        gravity: 0.35, 
        jumpPower: -7, 
        pipeSpeed: 2, 
        pipeGap: 200,
        pipeInterval: 180,
        firstPipeDelay: 80  // Reduced from 180
    },
    hard: { 
        gravity: 0.45, 
        jumpPower: -8, 
        pipeSpeed: 2.5, 
        pipeGap: 180,
        pipeInterval: 160,
        firstPipeDelay: 70  // Reduced from 120
    },
    insane: {
        gravity: 0.55,
        jumpPower: -9,
        pipeSpeed: 3.5,
        pipeGap: 160,
        pipeInterval: 140,
        firstPipeDelay: 60
    }
};

let chicken = { ...chickenBase };
let currentDifficulty = difficulties[difficulty];

// Game objects
let pipes = [];
let powerUps = [];
let particles = [];
let clouds = [];
let stars = [];
let explosions = [];
let chickenImages = [];
let currentChickenIndex = 0;

// Visual effects
let screenShake = 0;
let backgroundOffset = 0;
let timeOfDay = 0;

// Ground
const groundHeight = 80;
const ground = canvas.height - groundHeight;

// Enhanced Sound System
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let sounds = {};
let backgroundMusic = null;

// Power-up types
const powerUpTypes = {
    SHIELD: { color: '#00FFFF', duration: 300, name: 'Shield' },
    SLOW_TIME: { color: '#FF69B4', duration: 240, name: 'Slow Time' },
    DOUBLE_SCORE: { color: '#FFD700', duration: 360, name: '2x Score' },
    TINY_CHICKEN: { color: '#90EE90', duration: 300, name: 'Tiny Mode' },
    MAGNET: { color: '#FF4500', duration: 240, name: 'Score Magnet' }
};

// Enhanced sound creation
function createAdvancedSound(config) {
    return {
        play: (volume = 0.1) => {
            if (!soundEnabled) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const filterNode = audioContext.createBiquadFilter();
            
            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Configure oscillator
            oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
            oscillator.type = config.type || 'sine';
            
            // Configure filter
            if (config.filter) {
                filterNode.type = config.filter.type;
                filterNode.frequency.setValueAtTime(config.filter.frequency, audioContext.currentTime);
            }
            
            // Configure envelope
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
            
            if (config.frequencyRamp) {
                oscillator.frequency.exponentialRampToValueAtTime(
                    config.frequencyRamp.to, 
                    audioContext.currentTime + config.frequencyRamp.duration
                );
            }
            
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + config.duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + config.duration);
        }
    };
}

// Initialize enhanced sounds
function initSounds() {
    sounds.jump = createAdvancedSound({
        frequency: 400,
        type: 'square',
        duration: 0.1,
        frequencyRamp: { to: 600, duration: 0.05 }
    });
    
    sounds.score = createAdvancedSound({
        frequency: 800,
        type: 'sine',
        duration: 0.3,
        frequencyRamp: { to: 1200, duration: 0.2 }
    });
    
    sounds.powerUp = createAdvancedSound({
        frequency: 600,
        type: 'sawtooth',
        duration: 0.4,
        frequencyRamp: { to: 1000, duration: 0.3 }
    });
    
    sounds.gameOver = createAdvancedSound({
        frequency: 200,
        type: 'sawtooth',
        duration: 1.0,
        frequencyRamp: { to: 100, duration: 0.8 }
    });
    
    sounds.levelUp = createAdvancedSound({
        frequency: 500,
        type: 'triangle',
        duration: 0.6,
        frequencyRamp: { to: 800, duration: 0.4 }
    });
    
    sounds.explosion = createAdvancedSound({
        frequency: 150,
        type: 'sawtooth',
        duration: 0.5,
        filter: { type: 'lowpass', frequency: 800 }
    });
}

// Enhanced Particle System
class AdvancedParticle {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.velocity = config.velocity || { x: 0, y: 0 };
        this.color = config.color || '#FFF';
        this.life = config.life || 1.0;
        this.maxLife = this.life;
        this.decay = config.decay || 0.02;
        this.size = config.size || 2;
        this.maxSize = this.size;
        this.gravity = config.gravity || 0;
        this.bounce = config.bounce || 0;
        this.glow = config.glow || false;
        this.trail = config.trail || false;
        this.trailPoints = [];
        this.rotation = config.rotation || 0;
        this.rotationSpeed = config.rotationSpeed || 0;
        this.shape = config.shape || 'circle';
    }
    
    update() {
        // Store trail
        if (this.trail && this.trailPoints.length < 10) {
            this.trailPoints.push({ x: this.x, y: this.y, life: 1.0 });
        }
        
        // Update trail points
        this.trailPoints = this.trailPoints.filter(point => {
            point.life -= 0.1;
            return point.life > 0;
        });
        
        // Physics
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y += this.gravity;
        this.rotation += this.rotationSpeed;
        
        // Bounce off ground
        if (this.bounce > 0 && this.y > ground - this.size) {
            this.y = ground - this.size;
            this.velocity.y *= -this.bounce;
            this.velocity.x *= 0.8;
        }
        
        // Life decay
        this.life -= this.decay;
        this.size = this.maxSize * (this.life / this.maxLife);
    }
    
    draw() {
        ctx.save();
        
        // Draw trail
        if (this.trail) {
            this.trailPoints.forEach((point, index) => {
                ctx.globalAlpha = point.life * 0.3;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(point.x, point.y, this.size * point.life * 0.5, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        // Glow effect
        if (this.glow) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
        }
        
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw different shapes
        ctx.beginPath();
        switch (this.shape) {
            case 'circle':
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                break;
            case 'square':
                ctx.rect(-this.size, -this.size, this.size * 2, this.size * 2);
                break;
            case 'star':
                this.drawStar(0, 0, this.size);
                break;
        }
        ctx.fill();
        
        ctx.restore();
    }
    
    drawStar(x, y, radius) {
        const spikes = 5;
        const outerRadius = radius;
        const innerRadius = radius * 0.4;
        
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        
        ctx.moveTo(x, y - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
            rot += step;
            ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
            rot += step;
        }
        
        ctx.lineTo(x, y - outerRadius);
    }
    
    isDead() {
        return this.life <= 0;
    }
}

// Power-up class
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = powerUpTypes[type];
        this.size = 20;
        this.collected = false;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.rotation = 0;
        this.particles = [];
    }
    
    update() {
        this.bobOffset += 0.1;
        this.rotation += 0.05;
        this.x -= currentDifficulty.pipeSpeed * 0.8;
        
        // Add sparkle particles
        if (Math.random() < 0.3) {
            this.particles.push(new AdvancedParticle(
                this.x + (Math.random() - 0.5) * this.size,
                this.y + (Math.random() - 0.5) * this.size,
                {
                    velocity: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
                    color: this.config.color,
                    life: 0.5,
                    size: 2,
                    glow: true
                }
            ));
        }
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.update();
            return !particle.isDead();
        });
        
        // Check collision with chicken
        const dx = this.x - (chicken.x + chicken.width / 2);
        const dy = this.y - (chicken.y + chicken.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.size + 15 && !this.collected) {
            this.collect();
        }
    }
    
    collect() {
        this.collected = true;
        sounds.powerUp.play(0.15);
        
        // Activate power-up
        powerUpActive = this.type;
        powerUpTimer = this.config.duration;
        
        // Create collection effect
        for (let i = 0; i < 15; i++) {
            particles.push(new AdvancedParticle(
                this.x, this.y,
                {
                    velocity: {
                        x: (Math.random() - 0.5) * 8,
                        y: (Math.random() - 0.5) * 8
                    },
                    color: this.config.color,
                    life: 1.0,
                    size: 4,
                    glow: true,
                    shape: 'star'
                }
            ));
        }
        
        // Apply power-up effects
        this.applyEffect();
    }
    
    applyEffect() {
        switch (this.type) {
            case 'SHIELD':
                chicken.invulnerable = true;
                chicken.invulnerabilityTimer = this.config.duration;
                break;
            case 'TINY_CHICKEN':
                chicken.size = 0.6;
                break;
            case 'SLOW_TIME':
                // Time slowdown effect handled in update loop
                break;
        }
    }
    
    draw() {
        // Draw particles
        this.particles.forEach(particle => particle.draw());
        
        ctx.save();
        
        // Glow effect
        ctx.shadowColor = this.config.color;
        ctx.shadowBlur = 15;
        
        // Bob up and down
        const bobY = this.y + Math.sin(this.bobOffset) * 5;
        
        ctx.translate(this.x, bobY);
        ctx.rotate(this.rotation);
        
        // Draw power-up icon
        ctx.fillStyle = this.config.color;
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw symbol
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const symbols = {
            'SHIELD': '🛡️',
            'SLOW_TIME': '⏰',
            'DOUBLE_SCORE': '2x',
            'TINY_CHICKEN': '↓',
            'MAGNET': '🧲'
        };
        
        ctx.fillText(symbols[this.type] || '?', 0, 0);
        
        ctx.restore();
    }
}

// Explosion effect
class Explosion {
    constructor(x, y, size = 30) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.maxSize = size;
        this.life = 1.0;
        this.particles = [];
        
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = Math.random() * 5 + 3;
            
            this.particles.push(new AdvancedParticle(
                x, y,
                {
                    velocity: {
                        x: Math.cos(angle) * speed,
                        y: Math.sin(angle) * speed
                    },
                    color: `hsl(${Math.random() * 60 + 10}, 100%, 60%)`,
                    life: 0.8,
                    size: Math.random() * 4 + 2,
                    gravity: 0.1,
                    glow: true
                }
            ));
        }
    }
    
    update() {
        this.life -= 0.05;
        this.size = this.maxSize * this.life;
        
        this.particles = this.particles.filter(particle => {
            particle.update();
            return !particle.isDead();
        });
    }
    
    draw() {
        // Draw explosion ring
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        // Draw particles
        this.particles.forEach(particle => particle.draw());
    }
    
    isDead() {
        return this.life <= 0 && this.particles.length === 0;
    }
}

// Enhanced chicken variations
function createEnhancedChickenVariations() {
    const variations = [
        { body: '#FFD700', accent: '#FFA500', comb: '#FF0000', name: 'Golden' },
        { body: '#DEB887', accent: '#CD853F', comb: '#DC143C', name: 'Brown' },
        { body: '#F5F5DC', accent: '#D2B48C', comb: '#FF6347', name: 'Beige' },
        { body: '#FF7F50', accent: '#FF6347', comb: '#FF0000', name: 'Orange' },
        { body: '#98FB98', accent: '#90EE90', comb: '#FF1493', name: 'Emerald' },
        { body: '#87CEEB', accent: '#4169E1', comb: '#FF69B4', name: 'Sky' },
        { body: '#DDA0DD', accent: '#9370DB', comb: '#FF1493', name: 'Purple' },
        { body: '#F0E68C', accent: '#DAA520', comb: '#FF4500', name: 'Golden Rod' }
    ];
    
    return variations.map(colors => {
        const img = new Image();
        const svgChicken = `
            <svg width="35" height="25" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="bodyGrad${colors.name}" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" style="stop-color:${colors.body};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:1" />
                    </radialGradient>
                </defs>
                <ellipse cx="17" cy="17" rx="12" ry="8" fill="url(#bodyGrad${colors.name})" stroke="${colors.accent}" stroke-width="1"/>
                <circle cx="25" cy="10" r="6" fill="url(#bodyGrad${colors.name})" stroke="${colors.accent}" stroke-width="1"/>
                <polygon points="29,10 34,11 29,12" fill="#FF8C00"/>
                <circle cx="27" cy="8" r="1.2" fill="#000"/>
                <circle cx="27.3" cy="7.7" r="0.4" fill="#FFF"/>
                <path d="M 22 5 Q 24 3 26 5 Q 28 3 30 5" fill="${colors.comb}"/>
                <ellipse cx="15" cy="15" rx="4" ry="6" fill="${colors.accent}" stroke="${colors.body}" stroke-width="0.5"/>
                <ellipse cx="8" cy="16" rx="3" ry="5" fill="${colors.accent}" stroke="${colors.body}" stroke-width="0.5"/>
                <ellipse cx="12" cy="20" rx="2" ry="3" fill="${colors.accent}" opacity="0.7"/>
            </svg>
        `;
        img.src = 'data:image/svg+xml;base64,' + btoa(svgChicken);
        img.chickenName = colors.name;
        return img;
    });
}

// Initialize enhanced clouds with different types
function initEnhancedClouds() {
    clouds = [];
    for (let i = 0; i < 8; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 200 + 50,
            size: Math.random() * 40 + 20,
            speed: Math.random() * 0.8 + 0.3,
            opacity: Math.random() * 0.4 + 0.1,
            type: Math.random() > 0.7 ? 'storm' : 'normal',
            lightning: 0
        });
    }
}

// Initialize stars with twinkling
function initEnhancedStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.6,
            size: Math.random() * 3 + 1,
            twinkle: Math.random() * Math.PI * 2,
            twinkleSpeed: Math.random() * 0.1 + 0.05,
            brightness: Math.random() * 0.8 + 0.2
        });
    }
}

// Initialize game
async function init() {
    chickenImages = createEnhancedChickenVariations();
    initEnhancedClouds();
    initEnhancedStars();
    initSounds();
    reset();
    gameLoop();
    updateBestScore();
    showMenu();
}

// Enhanced reset
function reset() {
    Object.assign(chicken, chickenBase);
    chicken.y = canvas.height / 2;
    chicken.trail = [];
    pipes = [];
    powerUps = [];
    particles = [];
    explosions = [];
    score = 0;
    frameCount = 0;
    currentLevel = 1;
    powerUpActive = null;
    powerUpTimer = 0;
    comboMultiplier = 1;
    comboTimer = 0;
    screenShake = 0;
    gameRunning = false;
    gameStarted = false;
    gamePaused = false;
    updateScore();
    currentDifficulty = difficulties[difficulty];
}

// Enhanced pipe creation with special pipes
function createEnhancedPipe() {
    const minHeight = 80;
    const maxHeight = ground - currentDifficulty.pipeGap - 80;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    const pipe = {
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + currentDifficulty.pipeGap,
        passed: false,
        highlight: false,
        special: Math.random() < 0.15, // 15% chance for special pipe
        type: 'normal'
    };
    
    // Special pipe types
    if (pipe.special) {
        const types = ['golden', 'crystal', 'fire'];
        pipe.type = types[Math.floor(Math.random() * types.length)];
    }
    
    pipes.push(pipe);
    
    // Maybe spawn power-up
    if (Math.random() < 0.2 && score > 5) { // 20% chance after score 5
        const powerUpTypeKeys = Object.keys(powerUpTypes);
        const randomType = powerUpTypeKeys[Math.floor(Math.random() * powerUpTypeKeys.length)];
        
        powerUps.push(new PowerUp(
            canvas.width + 100,
            topHeight + currentDifficulty.pipeGap / 2,
            randomType
        ));
    }
}

// Enhanced update with all new features
function update() {
    if (!gameRunning || gamePaused) return;
    
    frameCount++;
    timeOfDay = (frameCount / 2000) % 1; // Day/night cycle
    
    // Screen shake decay
    if (screenShake > 0) {
        screenShake *= 0.9;
    }
    
    // Update chicken physics with power-up effects
    const timeMultiplier = (powerUpActive === 'SLOW_TIME') ? 0.5 : 1.0;
    
    chicken.velocity += currentDifficulty.gravity * timeMultiplier;
    if (chicken.velocity > chicken.maxVelocity) {
        chicken.velocity = chicken.maxVelocity;
    }
    chicken.y += chicken.velocity * timeMultiplier;
    
    // Chicken rotation and trail
    chicken.rotation = Math.min(Math.max(chicken.velocity * 0.08, -0.3), 0.3);
    
    // Add trail point
    if (frameCount % 3 === 0) {
        chicken.trail.push({
            x: chicken.x + chicken.width / 2,
            y: chicken.y + chicken.height / 2,
            life: 1.0
        });
        
        if (chicken.trail.length > 10) {
            chicken.trail.shift();
        }
    }
    
    // Update trail
    chicken.trail.forEach(point => {
        point.life -= 0.1;
    });
    chicken.trail = chicken.trail.filter(point => point.life > 0);
    
    // Update invulnerability
    if (chicken.invulnerabilityTimer > 0) {
        chicken.invulnerabilityTimer--;
        if (chicken.invulnerabilityTimer <= 0) {
            chicken.invulnerable = false;
        }
    }
    
    // Update power-up timer
    if (powerUpTimer > 0) {
        powerUpTimer--;
        if (powerUpTimer <= 0) {
            // Remove power-up effects
            if (powerUpActive === 'TINY_CHICKEN') {
                chicken.size = 1.0;
            }
            powerUpActive = null;
        }
    }
    
    // Update combo timer
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer <= 0) {
            comboMultiplier = 1;
        }
    }
    
    // Update pipes with enhanced effects
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= currentDifficulty.pipeSpeed * timeMultiplier;
        
        // Highlight upcoming pipe
        pipe.highlight = pipe.x > chicken.x - 50 && pipe.x < chicken.x + 100;
        
        // Score when passing pipe
        if (!pipe.passed && pipe.x + 60 < chicken.x) {
            pipe.passed = true;
            
            let scoreGain = 1;
            if (pipe.special) {
                scoreGain = pipe.type === 'golden' ? 3 : pipe.type === 'crystal' ? 2 : 1;
            }
            
            // Apply multipliers
            if (powerUpActive === 'DOUBLE_SCORE') scoreGain *= 2;
            scoreGain *= comboMultiplier;
            
            score += scoreGain;
            sounds.score.play(0.12);
            updateScore();
            
            // Combo system
            comboMultiplier = Math.min(comboMultiplier + 0.1, 3.0);
            comboTimer = 180; // 3 seconds
            
            // Level progression
            if (score > currentLevel * 10) {
                currentLevel++;
                sounds.levelUp.play(0.15);
                
                // Add celebration particles
                for (let j = 0; j < 20; j++) {
                    particles.push(new AdvancedParticle(
                        canvas.width / 2, 50,
                        {
                            velocity: {
                                x: (Math.random() - 0.5) * 10,
                                y: Math.random() * -5 - 2
                            },
                            color: `hsl(${Math.random() * 360}, 100%, 60%)`,
                            life: 1.5,
                            size: 4,
                            gravity: 0.1,
                            glow: true,
                            shape: 'star'
                        }
                    ));
                }
            }
            
            // Score particles
            const particleColor = pipe.special ? 
                (pipe.type === 'golden' ? '#FFD700' : pipe.type === 'crystal' ? '#00FFFF' : '#FF4500') : 
                '#90EE90';
                
            for (let j = 0; j < scoreGain * 3; j++) {
                particles.push(new AdvancedParticle(
                    pipe.x + 30, pipe.topHeight + currentDifficulty.pipeGap / 2,
                    {
                        velocity: {
                            x: (Math.random() - 0.5) * 4,
                            y: (Math.random() - 0.5) * 4 - 2
                        },
                        color: particleColor,
                        life: 1.0,
                        size: 3,
                        glow: true
                    }
                ));
            }
            
            // Change chicken every 5 points
            if (score % 5 === 0 && chickenImages.length > 1) {
                currentChickenIndex = (currentChickenIndex + 1) % chickenImages.length;
            }
        }
        
        // Remove off-screen pipes
        if (pipe.x + 60 < 0) {
            pipes.splice(i, 1);
        }
        
        // Enhanced collision detection
        const margin = chicken.invulnerable ? 0 : 3;
        const chickenSize = chicken.size;
        
        if (pipe.x < chicken.x + chicken.width * chickenSize - margin && 
            pipe.x + 60 > chicken.x + margin) {
            if (chicken.y + margin < pipe.topHeight || 
                chicken.y + chicken.height * chickenSize - margin > pipe.bottomY) {
                
                if (!chicken.invulnerable) {
                    gameOver();
                    return;
                }
            }
        }
    }
    
    // Create new pipes with faster timing
    if (frameCount > currentDifficulty.firstPipeDelay && 
        (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - currentDifficulty.pipeInterval)) {
        createEnhancedPipe();
    }
    
    // Update power-ups
    powerUps = powerUps.filter(powerUp => {
        powerUp.update();
        return !powerUp.collected && powerUp.x > -50;
    });
    
    // Update particles
    particles = particles.filter(particle => {
        particle.update();
        return !particle.isDead();
    });
    
    // Update explosions
    explosions = explosions.filter(explosion => {
        explosion.update();
        return !explosion.isDead();
    });
    
    // Update clouds
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed * timeMultiplier;
        if (cloud.x + cloud.size < 0) {
            cloud.x = canvas.width + cloud.size;
            cloud.y = Math.random() * 200 + 50;
        }
        
        // Lightning effect for storm clouds
        if (cloud.type === 'storm' && Math.random() < 0.001) {
            cloud.lightning = 30;
        }
        if (cloud.lightning > 0) {
            cloud.lightning--;
        }
    });
    
    // Ground and ceiling collision
    if (chicken.y + chicken.height * chicken.size > ground - 5 || chicken.y < 5) {
        if (!chicken.invulnerable) {
            gameOver();
        }
    }
}

// Enhanced drawing with all visual effects
function draw() {
    // Apply screen shake
    ctx.save();
    if (screenShake > 0) {
        ctx.translate(
            (Math.random() - 0.5) * screenShake,
            (Math.random() - 0.5) * screenShake
        );
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dynamic background based on time of day and level
    const isNight = timeOfDay > 0.5;
    const stormIntensity = Math.min(currentLevel / 10, 1.0);
    
    // Sky gradient with weather effects
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (isNight) {
        gradient.addColorStop(0, `rgb(${25 - stormIntensity * 15}, ${25 - stormIntensity * 15}, ${112 - stormIntensity * 50})`);
        gradient.addColorStop(0.7, `rgb(${72 - stormIntensity * 30}, ${61 - stormIntensity * 30}, ${139 - stormIntensity * 50})`);
        gradient.addColorStop(1, `rgb(${47 - stormIntensity * 20}, ${79 - stormIntensity * 30}, ${79 - stormIntensity * 30})`);
    } else {
        gradient.addColorStop(0, `rgb(${135 - stormIntensity * 50}, ${206 - stormIntensity * 100}, ${235 - stormIntensity * 100})`);
        gradient.addColorStop(0.7, `rgb(${135 - stormIntensity * 50}, ${206 - stormIntensity * 100}, ${235 - stormIntensity * 100})`);
        gradient.addColorStop(0.8, `rgb(${144 - stormIntensity * 50}, ${238 - stormIntensity * 100}, ${144 - stormIntensity * 50})`);
        gradient.addColorStop(1, `rgb(${34 - stormIntensity * 20}, ${139 - stormIntensity * 50}, ${34 - stormIntensity * 20})`);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Enhanced stars with twinkling
    if (isNight) {
        stars.forEach(star => {
            star.twinkle += star.twinkleSpeed;
            const alpha = (Math.sin(star.twinkle) + 1) / 2 * star.brightness;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#FFF';
            ctx.shadowColor = '#FFF';
            ctx.shadowBlur = 3;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
    
    // Enhanced clouds with lightning
    clouds.forEach(cloud => {
        ctx.save();
        ctx.globalAlpha = cloud.opacity;
        
        let cloudColor = isNight ? '#E6E6FA' : '#FFF';
        if (cloud.type === 'storm') {
            cloudColor = isNight ? '#696969' : '#A9A9A9';
        }
        
        // Lightning flash
        if (cloud.lightning > 0) {
            ctx.globalAlpha = 1.0;
            cloudColor = '#FFFF00';
            ctx.shadowColor = '#FFFF00';
            ctx.shadowBlur = 20;
        }
        
        ctx.fillStyle = cloudColor;
        
        // Multi-part cloud
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.6, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 1.2, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.3, cloud.y - cloud.size * 0.3, cloud.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
    
    // Enhanced pipes with special effects
    pipes.forEach(pipe => {
        let pipeColor = '#228B22';
        let capColor = '#32CD32';
        let glowColor = null;
        
        // Special pipe colors and effects
        if (pipe.special) {
            switch (pipe.type) {
                case 'golden':
                    pipeColor = '#DAA520';
                    capColor = '#FFD700';
                    glowColor = '#FFD700';
                    break;
                case 'crystal':
                    pipeColor = '#4169E1';
                    capColor = '#00BFFF';
                    glowColor = '#00FFFF';
                    break;
                case 'fire':
                    pipeColor = '#DC143C';
                    capColor = '#FF4500';
                    glowColor = '#FF6347';
                    break;
            }
        }
        
        if (pipe.highlight) {
            pipeColor = '#32CD32';
            capColor = '#7FFF00';
            glowColor = '#7FFF00';
        }
        
        // Glow effect for special pipes
        if (glowColor) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 15;
        }
        
        ctx.fillStyle = pipeColor;
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 2;
        
        // Top pipe
        ctx.fillRect(pipe.x, 0, 60, pipe.topHeight);
        ctx.strokeRect(pipe.x, 0, 60, pipe.topHeight);
        
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomY, 60, ground - pipe.bottomY);
        ctx.strokeRect(pipe.x, pipe.bottomY, 60, ground - pipe.bottomY);
        
        // Pipe caps
        ctx.fillStyle = capColor;
        ctx.fillRect(pipe.x - 3, pipe.topHeight - 15, 66, 15);
        ctx.fillRect(pipe.x - 3, pipe.bottomY, 66, 15);
        ctx.strokeRect(pipe.x - 3, pipe.topHeight - 15, 66, 15);
        ctx.strokeRect(pipe.x - 3, pipe.bottomY, 66, 15);
        
        // Special pipe decorations
        if (pipe.special) {
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            
            const symbols = {
                'golden': '★',
                'crystal': '◆',
                'fire': '🔥'
            };
            
            ctx.fillText(symbols[pipe.type], pipe.x + 30, pipe.topHeight - 7);
            ctx.fillText(symbols[pipe.type], pipe.x + 30, pipe.bottomY + 7);
        }
        
        ctx.shadowBlur = 0;
    });
    
    // Enhanced ground with texture and grass
    const groundGradient = ctx.createLinearGradient(0, ground, 0, canvas.height);
    groundGradient.addColorStop(0, '#8B4513');
    groundGradient.addColorStop(1, '#654321');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, ground, canvas.width, groundHeight);
    
    // Animated grass
    ctx.fillStyle = '#228B22';
    for (let i = 0; i < canvas.width; i += 6) {
        const grassHeight = Math.sin(i * 0.1 + frameCount * 0.03) * 3 + 6;
        const grassSway = Math.sin(i * 0.05 + frameCount * 0.02) * 1;
        ctx.fillRect(i + grassSway, ground - grassHeight, 3, grassHeight);
    }
    
    // Draw power-ups
    powerUps.forEach(powerUp => powerUp.draw());
    
    // Draw particles
    particles.forEach(particle => particle.draw());
    
    // Draw explosions
    explosions.forEach(explosion => explosion.draw());
    
    // Enhanced chicken with trail and effects
    if (gameRunning) {
        // Draw trail
        chicken.trail.forEach((point, index) => {
            ctx.save();
            ctx.globalAlpha = point.life * 0.4;
            ctx.fillStyle = chickenImages[currentChickenIndex]?.chickenName === 'Golden' ? '#FFD700' : '#87CEEB';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3 * point.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // Chicken glow effects
        ctx.save();
        
        // Power-up effects
        if (powerUpActive) {
            const glowColors = {
                'SHIELD': '#00FFFF',
                'SLOW_TIME': '#FF69B4',
                'DOUBLE_SCORE': '#FFD700',
                'TINY_CHICKEN': '#90EE90',
                'MAGNET': '#FF4500'
            };
            
            ctx.shadowColor = glowColors[powerUpActive];
            ctx.shadowBlur = 15;
        }
        
        // Invulnerability flashing
        if (chicken.invulnerable && Math.floor(frameCount / 5) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        ctx.translate(chicken.x + chicken.width/2, chicken.y + chicken.height/2);
        ctx.rotate(chicken.rotation);
        ctx.scale(chicken.size, chicken.size);
        
        const chickenImg = chickenImages[currentChickenIndex] || chickenImages[0];
        ctx.drawImage(chickenImg, -chicken.width/2, -chicken.height/2, chicken.width, chicken.height);
        
        ctx.restore();
    }
    
    // Enhanced UI
    drawEnhancedUI();
    
    ctx.restore(); // Restore from screen shake
}

// Enhanced UI with all information
function drawEnhancedUI() {
    // Score with glow and combo
    ctx.save();
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 3;
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, 40);
    
    // Combo multiplier
    if (comboMultiplier > 1) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`${comboMultiplier.toFixed(1)}x COMBO!`, canvas.width / 2, 65);
    }
    
    // Level and difficulty
    ctx.font = '16px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText(`Level ${currentLevel} - ${difficulty.toUpperCase()}`, canvas.width / 2, 85);
    
    // Current chicken name
    if (chickenImages[currentChickenIndex]) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`${chickenImages[currentChickenIndex].chickenName} Chicken`, canvas.width / 2, 105);
    }
    
    // Power-up indicator
    if (powerUpActive) {
        const config = powerUpTypes[powerUpActive];
        const timeLeft = Math.ceil(powerUpTimer / 60);
        
        ctx.fillStyle = config.color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${config.name}: ${timeLeft}s`, 10, canvas.height - 60);
        
        // Power-up bar
        const barWidth = 100;
        const barHeight = 8;
        const progress = powerUpTimer / config.duration;
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(10, canvas.height - 45, barWidth, barHeight);
        
        ctx.fillStyle = config.color;
        ctx.fillRect(10, canvas.height - 45, barWidth * progress, barHeight);
    }
    
    // Best score
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFF';
    ctx.font = '16px Arial';
    ctx.fillText(`Best: ${bestScore}`, canvas.width - 10, 30);
    
    // FPS counter (debug)
    if (frameCount % 60 === 0) {
        window.currentFPS = Math.round(1000 / (performance.now() - (window.lastFrameTime || performance.now())));
        window.lastFrameTime = performance.now();
    }
    ctx.fillText(`FPS: ${window.currentFPS || 60}`, canvas.width - 10, 50);
    
    ctx.restore();
    
    // Pause indicator
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
        ctx.font = '20px Arial';
        ctx.fillText('Press P to resume', canvas.width/2, canvas.height/2 + 50);
    }
    
    // Start screen with enhanced info
    if (!gameStarted && !gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🐔 Ultimate Flappy Chicken 🐔', canvas.width/2, canvas.height/2 - 120);
        
        ctx.font = '24px Arial';
        ctx.fillText('Enhanced Edition', canvas.width/2, canvas.height/2 - 80);
        
        ctx.font = '18px Arial';
        ctx.fillText('Keep clicking to stay airborne!', canvas.width/2, canvas.height/2 - 40);
        
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('Click to start!', canvas.width/2, canvas.height/2);
        
        // Feature list
        ctx.font = '14px Arial';
        ctx.fillStyle = '#90EE90';
        const features = [
            '🎮 Enhanced Physics & Controls',
            '✨ Power-ups & Special Effects',
            '🌟 Multiple Difficulty Levels',
            '🎵 Dynamic Sound Effects',
            '🌈 8 Unique Chicken Variants',
            '⚡ Particle Systems & Explosions',
            '🏆 Combo System & Level Progression'
        ];
        
        features.forEach((feature, index) => {
            ctx.fillText(feature, canvas.width/2, canvas.height/2 + 40 + index * 20);
        });
        
        if (bestScore > 0) {
            ctx.font = '18px Arial';
            ctx.fillStyle = '#FFF';
            ctx.fillText(`Best Score: ${bestScore}`, canvas.width/2, canvas.height - 40);
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

// Enhanced jump with effects
function jump() {
    if (!gameStarted) {
        gameStarted = true;
        gameRunning = true;
        hideMenu();
    }
    
    if (gameRunning && !gamePaused) {
        chicken.velocity = currentDifficulty.jumpPower;
        sounds.jump.play(0.08);
        
        // Jump particles
        for (let i = 0; i < 5; i++) {
            particles.push(new AdvancedParticle(
                chicken.x + chicken.width / 2,
                chicken.y + chicken.height,
                {
                    velocity: {
                        x: (Math.random() - 0.5) * 4,
                        y: Math.random() * 2 + 1
                    },
                    color: '#87CEEB',
                    life: 0.6,
                    size: 2,
                    gravity: 0.1
                }
            ));
        }
    }
}

// Enhanced game over with explosion
function gameOver() {
    gameRunning = false;
    sounds.gameOver.play(0.12);
    
    // Screen shake
    screenShake = 15;
    
    // Create explosion at chicken position
    explosions.push(new Explosion(
        chicken.x + chicken.width / 2,
        chicken.y + chicken.height / 2,
        40
    ));
    
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

// Menu functions
function showMenu() {
    menuElement.style.display = 'block';
    gameOverElement.style.display = 'none';
    gameStarted = false;
    gameRunning = false;
}

function hideMenu() {
    menuElement.style.display = 'none';
}

// Restart game
function restartGame() {
    reset();
    jump();
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
        case 'KeyS':
            e.preventDefault();
            toggleSound();
            break;
    }
});

canvas.addEventListener('click', jump);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Enhanced touch support
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
});

// Start the ultimate game
init();