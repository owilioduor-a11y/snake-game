// Game Page JavaScript
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const comboElement = document.getElementById('combo');
const pauseBtn = document.getElementById('pauseBtn');
const soundToggle = document.getElementById('soundToggle');

const GRID_SIZE = 22;
const MIN_GRID_CELLS = 8;

let currentGridSize = GRID_SIZE;
let logicalWidth = 0;
let logicalHeight = 0;

function updateGridSize() {
    if (window.innerWidth <= 360) {
        currentGridSize = 28;
    } else if (window.innerWidth <= 480) {
        currentGridSize = 26;
    } else if (window.innerWidth <= 768) {
        currentGridSize = 24;
    } else {
        currentGridSize = GRID_SIZE;
    }
}

function cellCenter(gridX, gridY) {
    return {
        x: gridX * currentGridSize + currentGridSize / 2,
        y: gridY * currentGridSize + currentGridSize / 2
    };
}

let GRID_WIDTH, GRID_HEIGHT;
let snake, direction, nextDirection, food;
let score, maxCombo, combo, comboTimer;
let gameOver, gameStarted, isPaused, sizeReduced;
let particles, overlayParticles, screenShake, currentFPS;
let gameLoop;
let renderHandle = 0;
let notificationHideTimer = 0;
let audioContext;

let soundEnabled = gameData.isSoundEnabled();
let shakeEnabled = gameData.isShakeEnabled();
let particlesEnabled = gameData.areParticlesEnabled();
let currentDifficulty = gameData.getCurrentDifficulty();

function initGame() {
    updateGridSize();
    const difficultySettings = gameData.difficultySettings[currentDifficulty];
    currentFPS = difficultySettings.fps;

    setupCanvas();

    snake = [{ x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    food = spawnFood();
    score = 0;
    maxCombo = 0;
    combo = 0;
    gameOver = false;
    gameStarted = false;
    isPaused = false;
    sizeReduced = false;
    particles = [];
    overlayParticles = [];
    screenShake = 0;

    scoreElement.textContent = '0';
    highScoreElement.textContent = gameData.getHighScore(currentDifficulty);
    comboElement.textContent = '0';
}

function setupCanvas() {
    const container = document.getElementById('gameContainer');
    const gamePage = document.querySelector('.game-page');
    const nav = document.querySelector('.game-nav');
    const instructions = document.getElementById('instructions');
    const dpr = window.devicePixelRatio || 1;
    const styles = getComputedStyle(container);
    const padX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
    const padY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
    const instructionsVisible = instructions && getComputedStyle(instructions).display !== 'none';
    const instructionsH = instructionsVisible ? instructions.offsetHeight + 10 : 0;
    const viewportH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const viewportW = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const fallbackW = Math.min(gamePage?.clientWidth || viewportW, viewportW) - padX;
    const fallbackH = (gamePage?.clientHeight || viewportH) - (nav?.offsetHeight || 0) - padY - instructionsH;

    const availW = Math.max(currentGridSize * MIN_GRID_CELLS, Math.max(container.clientWidth - padX, fallbackW));
    const availH = Math.max(currentGridSize * MIN_GRID_CELLS, Math.max(container.clientHeight - padY - instructionsH, fallbackH));

    GRID_WIDTH = Math.floor(availW / currentGridSize);
    GRID_HEIGHT = Math.floor(availH / currentGridSize);

    if (GRID_WIDTH < MIN_GRID_CELLS) {
        currentGridSize = Math.max(12, Math.floor(availW / MIN_GRID_CELLS));
        GRID_WIDTH = Math.floor(availW / currentGridSize);
    }
    if (GRID_HEIGHT < MIN_GRID_CELLS) {
        currentGridSize = Math.max(12, Math.min(currentGridSize, Math.floor(availH / MIN_GRID_CELLS)));
        GRID_WIDTH = Math.floor(availW / currentGridSize);
        GRID_HEIGHT = Math.floor(availH / currentGridSize);
    }

    GRID_WIDTH = Math.max(MIN_GRID_CELLS, GRID_WIDTH);
    GRID_HEIGHT = Math.max(MIN_GRID_CELLS, GRID_HEIGHT);

    logicalWidth = GRID_WIDTH * currentGridSize;
    logicalHeight = GRID_HEIGHT * currentGridSize;

    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;
    canvas.width = Math.round(logicalWidth * dpr);
    canvas.height = Math.round(logicalHeight * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
}

function spawnFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * GRID_WIDTH),
            y: Math.floor(Math.random() * GRID_HEIGHT)
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
}

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
    ctx.translate(shakeX, shakeY);

    ctx.fillStyle = '#000';
    ctx.fillRect(-shakeX, -shakeY, logicalWidth, logicalHeight);

    if (!gameStarted) {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(
            Math.floor(GRID_WIDTH / 2) * currentGridSize + 1,
            Math.floor(GRID_HEIGHT / 2) * currentGridSize + 1,
            currentGridSize - 2,
            currentGridSize - 2
        );
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(
            (Math.floor(GRID_WIDTH / 2) + 5) * currentGridSize + 1,
            Math.floor(GRID_HEIGHT / 2) * currentGridSize + 1,
            currentGridSize - 2,
            currentGridSize - 2
        );
        ctx.restore();
        return;
    }

    if (particlesEnabled) {
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => {
            ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
        });
    }

    snake.forEach((segment, index) => {
        const cx = segment.x * currentGridSize + currentGridSize / 2;
        const cy = segment.y * currentGridSize + currentGridSize / 2;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, currentGridSize / 2);

        if (index === 0) {
            gradient.addColorStop(0, '#00ff00');
            gradient.addColorStop(1, '#00cc00');
        } else {
            const alpha = 1 - (index / snake.length) * 0.5;
            gradient.addColorStop(0, `rgba(51, 153, 255, ${alpha})`);
            gradient.addColorStop(1, `rgba(0, 102, 204, ${alpha})`);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(
            segment.x * currentGridSize + 1,
            segment.y * currentGridSize + 1,
            currentGridSize - 2,
            currentGridSize - 2
        );

        if (index === 0) {
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 15;
            ctx.fillRect(
                segment.x * currentGridSize + 1,
                segment.y * currentGridSize + 1,
                currentGridSize - 2,
                currentGridSize - 2
            );
            ctx.shadowBlur = 0;
        }
    });

    const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.1;
    const foodSize = (currentGridSize - 2) * pulseScale;
    const foodOffset = (currentGridSize - foodSize) / 2;
    const foodCx = food.x * currentGridSize + currentGridSize / 2;
    const foodCy = food.y * currentGridSize + currentGridSize / 2;

    const foodGradient = ctx.createRadialGradient(foodCx, foodCy, 0, foodCx, foodCy, currentGridSize / 2);
    foodGradient.addColorStop(0, '#ff6666');
    foodGradient.addColorStop(1, '#ff0000');

    ctx.fillStyle = foodGradient;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.fillRect(
        food.x * currentGridSize + foodOffset,
        food.y * currentGridSize + foodOffset,
        foodSize,
        foodSize
    );
    ctx.shadowBlur = 0;

    if (combo > 1) {
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${combo}x COMBO!`, logicalWidth / 2, 30);
    }

    overlayParticles = overlayParticles.filter(p => p.life > 0);
    overlayParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) return;

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        if (p.text) {
            ctx.font = `bold ${p.size * 3}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(p.text, logicalWidth / 2, p.y);
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    ctx.globalAlpha = 1;

    ctx.restore();
}

function update() {
    if (gameOver || isPaused) return;

    direction = { ...nextDirection };

    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    if (head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
        endGame();
        return;
    }

    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        if (comboTimer) clearTimeout(comboTimer);
        comboTimer = setTimeout(() => { combo = 0; }, 3000);

        const comboMultiplier = Math.min(combo, 5);
        const pointsEarned = 10 * comboMultiplier;
        score += pointsEarned;
        scoreElement.textContent = score;
        comboElement.textContent = combo;

        if (combo > 1) {
            playSound('combo');
            showComboEffect(combo);
        } else {
            playSound('eat');
        }

        if (particlesEnabled) {
            const center = cellCenter(food.x, food.y);
            createParticles(center.x, center.y);
        }

        if (score % 50 === 0 && currentFPS < 20) {
            currentFPS += 0.5;
            clearInterval(gameLoop);
            gameLoop = setInterval(gameStep, 1000 / currentFPS);
        }

        if (score % 100 === 0) {
            showMilestoneEffect();
        }

        if (score >= 250 && !sizeReduced) {
            sizeReduced = true;
            const segmentsToRemove = Math.max(5, Math.floor(snake.length * 0.3));
            for (let i = 0; i < segmentsToRemove; i++) {
                snake.pop();
            }
            showSizeReductionEffect();
        }

        food = spawnFood();
    } else {
        snake.pop();
        if (combo > 0) {
            combo = 0;
            comboElement.textContent = 0;
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
        setTimeout(() => {
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
    window.location.href = `gameover.html?data=${gameData_str}`;
}

function createParticles(x, y) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 4 + 2,
            color: '255, 100, 100',
            life: 1.0
        });
    }
}

function spawnOverlayParticles(text, count, decay) {
    const colors = ['#FFD700', '#FFA500', '#FF6347', '#4CAF50', '#2196F3', '#9C27B0'];
    for (let i = 0; i < count; i++) {
        overlayParticles.push({
            x: Math.random() * logicalWidth,
            y: -30 - Math.random() * 180,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 3 + 1.5,
            size: Math.random() * 8 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1.0,
            decay: decay,
            text: i === 0 ? text : null
        });
    }
}

function showMilestoneEffect() {
    let flashCount = 0;
    const flashInterval = setInterval(() => {
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
        notificationHideTimer = setTimeout(() => {
            notification.classList.remove('visible');
        }, 3000);
    }

    spawnOverlayParticles('CONGRATULATIONS!', 50, 0.008);
}

function showComboEffect(comboCount) {
    spawnOverlayParticles(`${comboCount}x COMBO!`, 30, 0.01);
}

function gameStep() {
    update();
}

function startRenderLoop() {
    if (renderHandle) return;
    const frame = () => {
        draw();
        renderHandle = requestAnimationFrame(frame);
    };
    renderHandle = requestAnimationFrame(frame);
}

function stopRenderLoop() {
    if (renderHandle) {
        cancelAnimationFrame(renderHandle);
        renderHandle = 0;
    }
}

function startGame() {
    initAudio();
    playSound('click');
    gameStarted = true;
    pauseBtn.disabled = false;
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, 1000 / currentFPS);
}

function togglePause() {
    if (!gameStarted || gameOver) return;
    isPaused = !isPaused;

    if (isPaused) {
        pauseBtn.textContent = '▶️ Resume';
        pauseBtn.classList.add('paused');
        clearInterval(gameLoop);
    } else {
        pauseBtn.textContent = '⏸️ Pause';
        pauseBtn.classList.remove('paused');
        gameLoop = setInterval(gameStep, 1000 / currentFPS);
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

    switch (type) {
        case 'eat':
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'combo':
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1600, audioContext.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
        case 'gameOver':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;
        case 'click':
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
        case 'congratulation':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
            oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;
        case 'achievement':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(554.37, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2);
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;
    }
}

function goToStart() {
    if (gameLoop) clearInterval(gameLoop);
    stopRenderLoop();
    window.location.href = 'index.html';
}

function setNextDirection(x, y) {
    if (!gameStarted || gameOver || isPaused) return;
    if (x !== 0 && direction.x === 0) {
        nextDirection = { x, y: 0 };
    } else if (y !== 0 && direction.y === 0) {
        nextDirection = { x: 0, y };
    }
}

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    if (!gameStarted || gameOver || isPaused) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    touchStartX = e.changedTouches[0].clientX - rect.left;
    touchStartY = e.changedTouches[0].clientY - rect.top;
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (!gameStarted || gameOver || isPaused) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touchEndX = e.changedTouches[0].clientX - rect.left;
    const touchEndY = e.changedTouches[0].clientY - rect.top;
    handleSwipe(touchEndX, touchEndY, rect);
}, { passive: false });

function handleSwipe(touchEndX, touchEndY, rect) {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = Math.max(20, Math.min(rect.width, rect.height) * 0.04);

    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) return;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        setNextDirection(deltaX > 0 ? 1 : -1, 0);
    } else {
        setNextDirection(0, deltaY > 0 ? 1 : -1);
    }
}

canvas.addEventListener('click', (e) => {
    if (!gameStarted || gameOver || isPaused) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const head = cellCenter(snake[0].x, snake[0].y);
    const dx = mouseX - head.x;
    const dy = mouseY - head.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        setNextDirection(dx > 0 ? 1 : -1, 0);
    } else {
        setNextDirection(0, dy > 0 ? 1 : -1);
    }
});

function bindDpadControls() {
    const controls = [
        { id: 'btnUp', x: 0, y: -1 },
        { id: 'btnDown', x: 0, y: 1 },
        { id: 'btnLeft', x: -1, y: 0 },
        { id: 'btnRight', x: 1, y: 0 }
    ];

    controls.forEach(({ id, x, y }) => {
        const button = document.getElementById(id);
        if (!button) return;

        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            setNextDirection(x, y);
        }, { passive: false });

        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            setNextDirection(x, y);
        });
    });
}

document.addEventListener('keydown', (e) => {
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
    return Math.max(0, Math.min(value, max));
}

function handleResize() {
    updateGridSize();
    setupCanvas();

    if (!snake || snake.length === 0) {
        snake = [{ x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) }];
    } else {
        snake = snake.map(segment => ({
            x: clampCoord(segment.x, GRID_WIDTH - 1),
            y: clampCoord(segment.y, GRID_HEIGHT - 1)
        }));

        const uniqueSnake = [];
        const seenPositions = new Set();
        for (const segment of snake) {
            const key = `${segment.x},${segment.y}`;
            if (!seenPositions.has(key)) {
                seenPositions.add(key);
                uniqueSnake.push(segment);
            }
        }
        snake = uniqueSnake.length ? uniqueSnake : [{ x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) }];
    }

    if (!food || food.x < 0 || food.x >= GRID_WIDTH || food.y < 0 || food.y >= GRID_HEIGHT) {
        food = spawnFood();
    } else if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        food = spawnFood();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (soundToggle) {
        soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
    }

    if (pauseBtn) {
        pauseBtn.disabled = true;
    }

    bindDpadControls();
    initGame();
    startRenderLoop();
    requestAnimationFrame(() => {
        handleResize();
    });

    setTimeout(() => {
        startGame();
    }, 500);
});
