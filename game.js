// Game Page JavaScript — High-Performance Edition
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const comboElement = document.getElementById('combo');
const pauseBtn = document.getElementById('pauseBtn');
const soundToggle = document.getElementById('soundToggle');

const GRID_SIZE = 22;
const MIN_GRID_CELLS = 8;
const MAX_FRAME_DELTA = 0.25;
const TAU = Math.PI * 2;

let currentGridSize = GRID_SIZE;
let logicalWidth = 0;
let logicalHeight = 0;

function updateGridSize() {
    if (window.innerWidth <= 360) {
        currentGridSize = 16;
    } else if (window.innerWidth <= 480) {
        currentGridSize = 18;
    } else if (window.innerWidth <= 768) {
        currentGridSize = 20;
    } else {
        currentGridSize = GRID_SIZE;
    }
}

// Reusable cell center object — zero allocation in hot path
const _cellCenter = { x: 0, y: 0 };
function cellCenter(gridX, gridY) {
    _cellCenter.x = gridX * currentGridSize + (currentGridSize >> 1);
    _cellCenter.y = gridY * currentGridSize + (currentGridSize >> 1);
    return _cellCenter;
}

let GRID_WIDTH, GRID_HEIGHT;
let snake, direction, nextDirection, food;
let score, maxCombo, combo, comboTimer;
let gameOver, gameStarted, isPaused, lastSizeReductionScore;
let particles, particleCount;
let overlayParticles, overlayCount;
let screenShake, currentFPS;
let renderHandle = 0;
let notificationHideTimer = 0;
let audioContext;

// Spatial hash set for O(1) collision checks
let snakeSet = new Set();

function snakeKey(x, y) { return x + ',' + y; }

function rebuildSnakeSet() {
    snakeSet.clear();
    for (let i = 0, len = snake.length; i < len; i++) {
        snakeSet.add(snakeKey(snake[i].x, snake[i].y));
    }
}

// Cached container dimensions — only recomputed on resize
let cachedPadX = 0, cachedPadY = 0, cachedContainerW = 0, cachedContainerH = 0;
let cachedNavH = 0, cachedInstructionsH = 0;

// Pre-cached settings
let soundEnabled = gameData.isSoundEnabled();
let shakeEnabled = gameData.isShakeEnabled();
let particlesEnabled = gameData.areParticlesEnabled();
let currentDifficulty = gameData.getCurrentDifficulty();
let cachedHighScore = '';

// Pre-formatted color strings for particles (zero GC)
const PARTICLE_COLORS = [
    '#FFD700', '#FFA500', '#FF6347', '#4CAF50', '#2196F3', '#9C27B0'
];

// Pre-cached gradient objects by size
let snakeHeadGradient = null;
let snakeBodyGradientCache = new Map();
let foodGradient = null;
let lastFoodCx = -1, lastFoodCy = -1;

// Reusable direction objects — zero allocation
const DIR_LEFT  = { x: -1, y: 0 };
const DIR_RIGHT = { x: 1, y: 0 };
const DIR_UP    = { x: 0, y: -1 };
const DIR_DOWN  = { x: 0, y: 1 };

function initGame() {
    updateGridSize();
    const difficultySettings = gameData.difficultySettings[currentDifficulty];
    currentFPS = difficultySettings.fps;

    recalcContainerDims();
    setupCanvas();

    snake = [{ x: (GRID_WIDTH >> 1), y: (GRID_HEIGHT >> 1) }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    food = spawnFood();
    score = 0;
    maxCombo = 0;
    combo = 0;
    gameOver = false;
    gameStarted = false;
    isPaused = false;
    lastSizeReductionScore = 0;
    particles = new Array(512);
    particleCount = 0;
    overlayParticles = new Array(256);
    overlayCount = 0;
    screenShake = 0;
    snakeBodyGradientCache.clear();
    snakeHeadGradient = null;
    foodGradient = null;

    rebuildSnakeSet();

    scoreElement.textContent = '0';
    cachedHighScore = gameData.getHighScore(currentDifficulty);
    highScoreElement.textContent = cachedHighScore;
    comboElement.textContent = '0';
}

function recalcContainerDims() {
    const container = document.getElementById('gameContainer');
    const nav = document.querySelector('.game-nav');
    const instructions = document.getElementById('instructions');
    const styles = getComputedStyle(container);
    cachedPadX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
    cachedPadY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
    cachedContainerW = container.clientWidth;
    cachedContainerH = container.clientHeight;
    cachedNavH = nav ? nav.offsetHeight : 0;
    const instructionsVisible = instructions && getComputedStyle(instructions).display !== 'none';
    cachedInstructionsH = instructionsVisible ? instructions.offsetHeight + 10 : 0;
}

function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const gamePage = document.querySelector('.game-page');
    const viewportH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const viewportW = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const fallbackW = Math.min(gamePage ? gamePage.clientWidth || viewportW : viewportW, viewportW) - cachedPadX;
    const fallbackH = (gamePage ? gamePage.clientHeight || viewportH : viewportH) - cachedNavH - cachedPadY - cachedInstructionsH;

    const availW = Math.max(currentGridSize * MIN_GRID_CELLS, Math.max(cachedContainerW - cachedPadX, fallbackW));
    const availH = Math.max(currentGridSize * MIN_GRID_CELLS, Math.max(cachedContainerH - cachedPadY - cachedInstructionsH, fallbackH));

    GRID_WIDTH = (availW / currentGridSize) | 0;
    GRID_HEIGHT = (availH / currentGridSize) | 0;

    if (GRID_WIDTH < MIN_GRID_CELLS || GRID_HEIGHT < MIN_GRID_CELLS) {
        const sizeForWidth = (availW / MIN_GRID_CELLS) | 0;
        const sizeForHeight = (availH / MIN_GRID_CELLS) | 0;
        currentGridSize = Math.max(12, Math.min(currentGridSize, sizeForWidth, sizeForHeight));
        GRID_WIDTH = (availW / currentGridSize) | 0;
        GRID_HEIGHT = (availH / currentGridSize) | 0;
    }

    GRID_WIDTH = Math.max(MIN_GRID_CELLS, GRID_WIDTH);
    GRID_HEIGHT = Math.max(MIN_GRID_CELLS, GRID_HEIGHT);

    logicalWidth = GRID_WIDTH * currentGridSize;
    logicalHeight = GRID_HEIGHT * currentGridSize;

    canvas.style.width = logicalWidth + 'px';
    canvas.style.height = logicalHeight + 'px';
    canvas.width = Math.round(logicalWidth * dpr);
    canvas.height = Math.round(logicalHeight * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    // Invalidate gradient caches on grid size change
    snakeHeadGradient = null;
    snakeBodyGradientCache.clear();
    foodGradient = null;
}

function spawnFood() {
    let fx, fy, attempt = 0;
    do {
        fx = (Math.random() * GRID_WIDTH) | 0;
        fy = (Math.random() * GRID_HEIGHT) | 0;
        attempt++;
    } while (snakeSet.has(snakeKey(fx, fy)) && attempt < 1000);
    food = { x: fx, y: fy };
    return food;
}

// ─── DRAW (hot path — zero GC) ───────────────────────────────────────
function draw() {
    let shakeX = 0;
    let shakeY = 0;
    if (screenShake > 0 && shakeEnabled) {
        shakeX = (Math.random() - 0.5) * screenShake;
        shakeY = (Math.random() - 0.5) * screenShake;
        screenShake *= 0.92;
        if (screenShake < 0.5) screenShake = 0;
    }

    ctx.save();
    if (shakeX !== 0 || shakeY !== 0) ctx.translate(shakeX, shakeY);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    if (!gameStarted) {
        const halfW = GRID_WIDTH >> 1;
        const halfH = GRID_HEIGHT >> 1;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(halfW * currentGridSize + 1, halfH * currentGridSize + 1, currentGridSize - 2, currentGridSize - 2);
        ctx.fillStyle = '#ff3333';
        ctx.fillRect((halfW + 5) * currentGridSize + 1, halfH * currentGridSize + 1, currentGridSize - 2, currentGridSize - 2);
        ctx.restore();
        return;
    }

    const gs = currentGridSize;
    const gsHalf = gs >> 1;
    const gsInner = gs - 2;
    const snakeLen = snake.length;
    let i, s, cx, cy;

    // ── Particles (in-place truncation) ──
    if (particlesEnabled && particleCount > 0) {
        let alive = 0;
        for (i = 0; i < particleCount; i++) {
            const p = particles[i];
            if (p.life <= 0) continue;
            ctx.globalAlpha = p.life;
            ctx.fillStyle = '#ff6464';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, TAU);
            ctx.fill();
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life > 0) {
                if (alive !== i) particles[alive] = p;
                alive++;
            }
        }
        particleCount = alive;
        ctx.globalAlpha = 1;
    }

    // ── Snake body ──
    for (i = snakeLen - 1; i >= 0; i--) {
        s = snake[i];
        cx = s.x * gs + gsHalf;
        cy = s.y * gs + gsHalf;

        if (i === 0) {
            // Head — cache gradient
            if (!snakeHeadGradient || snakeHeadGradient._cx !== cx) {
                snakeHeadGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, gsHalf);
                snakeHeadGradient.addColorStop(0, '#00ff00');
                snakeHeadGradient.addColorStop(1, '#00cc00');
                snakeHeadGradient._cx = cx;
            }
            ctx.fillStyle = snakeHeadGradient;
        } else {
            // Body — cache gradient per alpha bucket (quantize to 10 levels)
            const alphaBucket = ((1 - (i / snakeLen) * 0.5) * 10 | 0) / 10;
            let grad = snakeBodyGradientCache.get(alphaBucket);
            if (!grad) {
                grad = ctx.createRadialGradient(0, 0, 0, 0, 0, gsHalf);
                grad.addColorStop(0, 'rgba(51,153,255,' + alphaBucket.toFixed(1) + ')');
                grad.addColorStop(1, 'rgba(0,102,204,' + alphaBucket.toFixed(1) + ')');
                snakeBodyGradientCache.set(alphaBucket, grad);
            }
            ctx.fillStyle = grad;
            // Translate gradient to segment position
            ctx.save();
            ctx.translate(cx, cy);
            ctx.fillRect(-gsHalf + 1, -gsHalf + 1, gsInner, gsInner);
            ctx.restore();
            continue;
        }

        ctx.fillRect(s.x * gs + 1, s.y * gs + 1, gsInner, gsInner);

        if (i === 0) {
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 15;
            ctx.fillRect(s.x * gs + 1, s.y * gs + 1, gsInner, gsInner);
            ctx.shadowBlur = 0;
        }
    }

    // ── Food ──
    const foodCx = food.x * gs + gsHalf;
    const foodCy = food.y * gs + gsHalf;
    if (!foodGradient || lastFoodCx !== foodCx || lastFoodCy !== foodCy) {
        foodGradient = ctx.createRadialGradient(foodCx, foodCy, 0, foodCx, foodCy, gsHalf);
        foodGradient.addColorStop(0, '#ff6666');
        foodGradient.addColorStop(1, '#ff0000');
        lastFoodCx = foodCx;
        lastFoodCy = foodCy;
    }
    const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.1;
    const foodSize = gsInner * pulseScale;
    const foodOffset = (gs - foodSize) * 0.5;

    ctx.fillStyle = foodGradient;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.fillRect(food.x * gs + foodOffset, food.y * gs + foodOffset, foodSize, foodSize);
    ctx.shadowBlur = 0;

    // ── Combo text ──
    if (combo > 1) {
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(combo + 'x COMBO!', logicalWidth >> 1, 30);
    }

    // ── Overlay particles (in-place truncation) ──
    if (overlayCount > 0) {
        let alive = 0;
        for (i = 0; i < overlayCount; i++) {
            const op = overlayParticles[i];
            op.x += op.vx;
            op.y += op.vy;
            op.life -= op.decay;
            if (op.life <= 0) continue;
            ctx.globalAlpha = op.life;
            ctx.fillStyle = op.color;
            if (op.text) {
                ctx.font = 'bold ' + (op.size * 3 | 0) + 'px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(op.text, logicalWidth >> 1, op.y);
            } else {
                ctx.beginPath();
                ctx.arc(op.x, op.y, op.size, 0, TAU);
                ctx.fill();
            }
            if (alive !== i) overlayParticles[alive] = op;
            alive++;
        }
        overlayCount = alive;
        ctx.globalAlpha = 1;
    }

    ctx.restore();
}

// ─── UPDATE (hot path — zero GC) ─────────────────────────────────────
function update() {
    if (gameOver || isPaused) return;

    direction.x = nextDirection.x;
    direction.y = nextDirection.y;

    const headX = snake[0].x + direction.x;
    const headY = snake[0].y + direction.y;

    // Wall collision — O(1)
    if (headX < 0 || headX >= GRID_WIDTH || headY < 0 || headY >= GRID_HEIGHT) {
        endGame();
        return;
    }

    // Self collision — O(1) via spatial hash
    if (snakeSet.has(snakeKey(headX, headY))) {
        endGame();
        return;
    }

    // Grow snake
    snake.unshift({ x: headX, y: headY });
    snakeSet.add(snakeKey(headX, headY));

    if (headX === food.x && headY === food.y) {
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        if (comboTimer) clearTimeout(comboTimer);
        comboTimer = setTimeout(function() { combo = 0; }, 3000);

        const comboMultiplier = combo < 5 ? combo : 5;
        score += 10 * comboMultiplier;
        scoreElement.textContent = score;
        comboElement.textContent = combo;

        if (combo > 1) {
            playSound('combo');
            showComboEffect(combo);
        } else {
            playSound('eat');
        }

        if (particlesEnabled) {
            const cc = cellCenter(food.x, food.y);
            createParticles(cc.x, cc.y);
        }

        if (score % 100 === 0) {
            showMilestoneEffect();
        }

        if (score >= lastSizeReductionScore + 250) {
            lastSizeReductionScore = (score / 250 | 0) * 250;
            const segmentsToRemove = Math.max(5, (snake.length * 0.3) | 0);
            const removable = Math.min(segmentsToRemove, snake.length - 1);
            for (let r = 0; r < removable; r++) {
                const removed = snake.pop();
                snakeSet.delete(snakeKey(removed.x, removed.y));
            }
            showSizeReductionEffect();
        }

        spawnFood();
    } else {
        const tail = snake.pop();
        snakeSet.delete(snakeKey(tail.x, tail.y));
        if (combo > 0) {
            combo = 0;
            comboElement.textContent = '0';
            if (comboTimer) clearTimeout(comboTimer);
        }
    }
}

function endGame() {
    gameOver = true;
    playSound('gameOver');

    if (shakeEnabled) {
        screenShake = 20;
        const gameContainer = document.getElementById('gameContainer');
        gameContainer.classList.add('shake');
        setTimeout(function() {
            gameContainer.classList.remove('shake');
        }, 500);
    }

    gameData.incrementTotalGames();
    gameData.addTotalScore(score);
    gameData.setBestCombo(maxCombo);

    const newAchievements = gameData.checkAchievements({
        score: score,
        maxCombo: maxCombo
    });

    if (gameData.setHighScore(currentDifficulty, score)) {
        playSound('achievement');
    }

    const gameData_str = encodeURIComponent(JSON.stringify({
        score: score,
        highScore: gameData.getHighScore(currentDifficulty),
        maxCombo: maxCombo,
        difficulty: currentDifficulty,
        newAchievements: newAchievements
    }));
    window.location.href = 'gameover.html?data=' + gameData_str;
}

// ─── Particle spawning (pre-formatted colors, bounded arrays) ────────
function createParticles(x, y) {
    for (let i = 0; i < 15; i++) {
        if (particleCount >= particles.length) {
            // Expand once
            particles.length = particles.length + 64;
        }
        particles[particleCount++] = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 4 + 2,
            life: 1.0
        };
    }
}

function spawnOverlayParticles(text, count, decay) {
    for (let i = 0; i < count; i++) {
        if (overlayCount >= overlayParticles.length) {
            overlayParticles.length = overlayParticles.length + 64;
        }
        overlayParticles[overlayCount++] = {
            x: Math.random() * logicalWidth,
            y: -30 - Math.random() * 180,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 3 + 1.5,
            size: Math.random() * 8 + 3,
            color: PARTICLE_COLORS[(Math.random() * 6) | 0],
            life: 1.0,
            decay: decay,
            text: i === 0 ? text : null
        };
    }
}

function showMilestoneEffect() {
    let flashCount = 0;
    const flashInterval = setInterval(function() {
        ctx.fillStyle = flashCount % 2 === 0 ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0, 255, 255, 0.05)';
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);
        flashCount++;
        if (flashCount >= 4) {
            clearInterval(flashInterval);
        }
    }, 100);
}

function showSizeReductionEffect() {
    playSound('congratulation');

    const notification = document.getElementById('sizeReductionNotification');
    if (notification) {
        notification.classList.add('visible');
        clearTimeout(notificationHideTimer);
        notificationHideTimer = setTimeout(function() {
            notification.classList.remove('visible');
        }, 3000);
    }

    spawnOverlayParticles('CONGRATULATIONS!', 50, 0.008);
}

function showComboEffect(comboCount) {
    spawnOverlayParticles(comboCount + 'x COMBO!', 30, 0.01);
}

// ─── GAME LOOP (rAF + fixed delta-time accumulator) ──────────────────
let lastFrameTime = 0;
let accumulator = 0;

function gameLoop(timestamp) {
    if (!renderHandle) return;

    if (lastFrameTime === 0) lastFrameTime = timestamp;
    let dt = (timestamp - lastFrameTime) * 0.001;
    lastFrameTime = timestamp;

    if (dt > MAX_FRAME_DELTA) dt = MAX_FRAME_DELTA;

    if (gameStarted && !gameOver && !isPaused) {
        accumulator += dt;
        const stepInterval = 1 / currentFPS;

        while (accumulator >= stepInterval) {
            update();
            accumulator -= stepInterval;
        }
    }

    draw();
    renderHandle = requestAnimationFrame(gameLoop);
}

function startGameLoop() {
    if (renderHandle) return;
    lastFrameTime = 0;
    accumulator = 0;
    renderHandle = requestAnimationFrame(gameLoop);
}

function stopGameLoop() {
    if (renderHandle) {
        cancelAnimationFrame(renderHandle);
        renderHandle = 0;
    }
    lastFrameTime = 0;
    accumulator = 0;
}

function startGame() {
    initAudio();
    playSound('click');
    gameStarted = true;
    pauseBtn.disabled = false;
}

function togglePause() {
    if (!gameStarted || gameOver) return;
    isPaused = !isPaused;

    if (isPaused) {
        pauseBtn.textContent = '▶️ Resume';
        pauseBtn.classList.add('paused');
    } else {
        pauseBtn.textContent = '⏸️ Pause';
        pauseBtn.classList.remove('paused');
        lastFrameTime = 0;
        accumulator = 0;
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    gameData.setSoundEnabled(soundEnabled);
    const toggle = document.getElementById('soundToggle');
    toggle.textContent = soundEnabled ? '🔊' : '🔇';
    if (soundEnabled) initAudio();
}

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!audioContext || !soundEnabled) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const t = audioContext.currentTime;
    switch (type) {
        case 'eat':
            oscillator.frequency.setValueAtTime(600, t);
            oscillator.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
            gainNode.gain.setValueAtTime(0.3, t);
            gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            oscillator.start(t);
            oscillator.stop(t + 0.1);
            break;
        case 'combo':
            oscillator.frequency.setValueAtTime(800, t);
            oscillator.frequency.exponentialRampToValueAtTime(1600, t + 0.15);
            gainNode.gain.setValueAtTime(0.4, t);
            gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            oscillator.start(t);
            oscillator.stop(t + 0.15);
            break;
        case 'gameOver':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(400, t);
            oscillator.frequency.exponentialRampToValueAtTime(100, t + 0.5);
            gainNode.gain.setValueAtTime(0.4, t);
            gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            oscillator.start(t);
            oscillator.stop(t + 0.5);
            break;
        case 'click':
            oscillator.frequency.setValueAtTime(800, t);
            gainNode.gain.setValueAtTime(0.1, t);
            gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
            oscillator.start(t);
            oscillator.stop(t + 0.05);
            break;
        case 'congratulation':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, t);
            oscillator.frequency.setValueAtTime(659.25, t + 0.1);
            oscillator.frequency.setValueAtTime(783.99, t + 0.2);
            oscillator.frequency.setValueAtTime(1046.50, t + 0.3);
            gainNode.gain.setValueAtTime(0.5, t);
            gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            oscillator.start(t);
            oscillator.stop(t + 0.5);
            break;
        case 'achievement':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(440, t);
            oscillator.frequency.setValueAtTime(554.37, t + 0.1);
            oscillator.frequency.setValueAtTime(659.25, t + 0.2);
            oscillator.frequency.setValueAtTime(880, t + 0.3);
            gainNode.gain.setValueAtTime(0.4, t);
            gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            oscillator.start(t);
            oscillator.stop(t + 0.4);
            break;
    }
}

function goToStart() {
    stopGameLoop();
    window.location.href = 'index.html';
}

function setNextDirection(x, y) {
    if (!gameStarted || gameOver || isPaused) return;
    if (x !== 0 && direction.x === 0) {
        nextDirection.x = x;
        nextDirection.y = 0;
    } else if (y !== 0 && direction.y === 0) {
        nextDirection.x = 0;
        nextDirection.y = y;
    }
}

// ─── TOUCH INPUT (passive:false, scroll/zoom blocking) ───────────────
let touchStartX = 0;
let touchStartY = 0;
let touchHandled = false;

canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (!gameStarted || gameOver || isPaused) return;
    touchHandled = true;
    const touch = e.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}, { passive: false });

canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    if (!gameStarted || gameOver || isPaused) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const absDX = deltaX < 0 ? -deltaX : deltaX;
    const absDY = deltaY < 0 ? -deltaY : deltaY;
    const minSwipeDistance = 20;

    if (absDX < minSwipeDistance && absDY < minSwipeDistance) return;

    if (absDX > absDY) {
        setNextDirection(deltaX > 0 ? 1 : -1, 0);
    } else {
        setNextDirection(0, deltaY > 0 ? 1 : -1);
    }
    setTimeout(function() { touchHandled = false; }, 100);
}, { passive: false });

canvas.addEventListener('click', function(e) {
    if (touchHandled) return;
    if (!gameStarted || gameOver || isPaused) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const cc = cellCenter(snake[0].x, snake[0].y);
    const dx = mouseX - cc.x;
    const dy = mouseY - cc.y;

    if ((dx < 0 ? -dx : dx) > (dy < 0 ? -dy : dy)) {
        setNextDirection(dx > 0 ? 1 : -1, 0);
    } else {
        setNextDirection(0, dy > 0 ? 1 : -1);
    }
});

// ─── D-PAD CONTROLS (passive:false, 48px minimum) ───────────────────
function bindDpadControls() {
    const controls = [
        { id: 'btnUp', x: 0, y: -1 },
        { id: 'btnDown', x: 0, y: 1 },
        { id: 'btnLeft', x: -1, y: 0 },
        { id: 'btnRight', x: 1, y: 0 }
    ];

    let dpadTouchHandled = false;

    controls.forEach(function(c) {
        const button = document.getElementById(c.id);
        if (!button) return;

        button.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dpadTouchHandled = true;
            setNextDirection(c.x, c.y);
        }, { passive: false });

        button.addEventListener('touchmove', function(e) {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        button.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            setTimeout(function() { dpadTouchHandled = false; }, 300);
        }, { passive: false });

        button.addEventListener('mousedown', function(e) {
            e.preventDefault();
            if (dpadTouchHandled) return;
            setNextDirection(c.x, c.y);
        });
    });
}

// ─── KEYBOARD INPUT ──────────────────────────────────────────────────
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' && !gameStarted) {
        startGame();
        return;
    }

    if (!gameStarted) return;

    if (e.code === 'KeyP' || e.code === 'Escape') {
        togglePause();
        return;
    }

    if (isPaused) return;

    switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
            setNextDirection(0, -1);
            break;
        case 'ArrowDown':
        case 'KeyS':
            setNextDirection(0, 1);
            break;
        case 'ArrowLeft':
        case 'KeyA':
            setNextDirection(-1, 0);
            break;
        case 'ArrowRight':
        case 'KeyD':
            setNextDirection(1, 0);
            break;
        default:
            return;
    }
    e.preventDefault();
});

// ─── RESIZE HANDLING ─────────────────────────────────────────────────
let resizeTimeout;
function scheduleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 100);
}

window.addEventListener('resize', scheduleResize);
window.addEventListener('orientationchange', scheduleResize);
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleResize);
}

function clampCoord(value, max) {
    return value < 0 ? 0 : (value > max ? max : value);
}

function handleResize() {
    updateGridSize();
    recalcContainerDims();
    setupCanvas();

    if (!snake || snake.length === 0) {
        snake = [{ x: (GRID_WIDTH >> 1), y: (GRID_HEIGHT >> 1) }];
        rebuildSnakeSet();
    } else {
        const gw1 = GRID_WIDTH - 1;
        const gh1 = GRID_HEIGHT - 1;
        for (let i = 0, len = snake.length; i < len; i++) {
            snake[i].x = clampCoord(snake[i].x, gw1);
            snake[i].y = clampCoord(snake[i].y, gh1);
        }

        // Deduplicate
        const seen = new Set();
        let write = 0;
        for (let i = 0; i < snake.length; i++) {
            const k = snakeKey(snake[i].x, snake[i].y);
            if (!seen.has(k)) {
                seen.add(k);
                if (write !== i) snake[write] = snake[i];
                write++;
            }
        }
        snake.length = write || 1;
        if (write === 0) {
            snake[0] = { x: (GRID_WIDTH >> 1), y: (GRID_HEIGHT >> 1) };
        }
        rebuildSnakeSet();
    }

    if (!food || food.x < 0 || food.x >= GRID_WIDTH || food.y < 0 || food.y >= GRID_HEIGHT) {
        spawnFood();
    } else if (snakeSet.has(snakeKey(food.x, food.y))) {
        spawnFood();
    }
}

// ─── BOOT ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    if (soundToggle) {
        soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
    }

    if (pauseBtn) {
        pauseBtn.disabled = true;
    }

    bindDpadControls();
    initGame();
    startGameLoop();
    requestAnimationFrame(function() {
        handleResize();
    });

    setTimeout(function() {
        startGame();
    }, 500);
});
