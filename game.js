// Game Page JavaScript
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const comboElement = document.getElementById('combo');
const pauseBtn = document.getElementById('pauseBtn');
const soundToggle = document.getElementById('soundToggle');

const GRID_SIZE = 22;
const originalCanvasWidth = 1200;
const originalCanvasHeight = 900;

// Responsive grid size for better visibility on smaller devices
let currentGridSize = GRID_SIZE;

function updateGridSize() {
    if (window.innerWidth <= 360) {
        currentGridSize = 28; // Larger grid on very small screens
    } else if (window.innerWidth <= 480) {
        currentGridSize = 26; // Larger grid on small screens
    } else if (window.innerWidth <= 768) {
        currentGridSize = 24; // Slightly larger on tablets
    } else {
        currentGridSize = GRID_SIZE; // Default on desktop
    }
    
    // Grid dimensions will be calculated in setupCanvas based on actual canvas size
    // This function just sets the cell size
}

let GRID_WIDTH, GRID_HEIGHT;
let snake, direction, nextDirection, food;
let score, maxCombo, combo, comboTimer;
let gameOver, gameStarted, isPaused, sizeReduced;
let particles, screenShake, currentFPS;
let gameLoop;
let audioContext;

// Game settings
let soundEnabled = gameData.isSoundEnabled();
let shakeEnabled = gameData.isShakeEnabled();
let particlesEnabled = gameData.areParticlesEnabled();
let currentDifficulty = gameData.getCurrentDifficulty();

// Initialize game
function initGame() {
    updateGridSize();
    const difficultySettings = gameData.difficultySettings[currentDifficulty];
    currentFPS = difficultySettings.fps;
    
    // setupCanvas will handle canvas sizing
    setupCanvas();
    
    snake = [{x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2)}];
    direction = {x: 1, y: 0};
    nextDirection = {x: 1, y: 0};
    food = spawnFood();
    score = 0;
    maxCombo = 0;
    combo = 0;
    gameOver = false;
    gameStarted = false;
    isPaused = false;
    sizeReduced = false;
    particles = [];
    screenShake = 0;
    
    scoreElement.textContent = '0';
    highScoreElement.textContent = gameData.getHighScore(currentDifficulty);
    comboElement.textContent = '0';
    
    draw();
}

function setupCanvas() {
    const container = document.getElementById('gameContainer');
    const navHeight = document.querySelector('.game-nav').offsetHeight;
    
    // Dynamic viewport sizing for mobile optimization - 95% screen coverage
    let heightPercentage = 0.75; // Default for larger screens
    let marginSize = 30;
    let prioritizeHeight = false;
    
    if (window.innerWidth <= 1400) {
        heightPercentage = 0.8;
        marginSize = 25;
    }
    if (window.innerWidth <= 1200) {
        heightPercentage = 0.85;
        marginSize = 20;
    }
    if (window.innerWidth <= 768) {
        heightPercentage = 0.9;
        marginSize = 15;
    }
    if (window.innerWidth <= 480) {
        heightPercentage = 0.95; // 95% height on mobile devices
        marginSize = 10;
        prioritizeHeight = true; // Prioritize height on mobile
    }
    if (window.innerWidth <= 360) {
        heightPercentage = 0.95; // Maintain 95% on very small screens
        marginSize = 5;
        prioritizeHeight = true;
    }
    
    // Use dynamic viewport height for mobile browsers
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const availableHeight = viewportHeight - navHeight - marginSize;
    const containerWidth = Math.min(window.innerWidth - marginSize, container.clientWidth - marginSize);
    const containerHeight = Math.min(availableHeight, viewportHeight * heightPercentage);
    
    // Use container's actual client dimensions for dynamic grid sizing
    const actualContainerWidth = container.clientWidth || containerWidth;
    const actualContainerHeight = container.clientHeight || containerHeight;
    
    // Calculate canvas resolution with device pixel ratio for retina displays
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = Math.floor(actualContainerWidth * dpr);
    const canvasHeight = Math.floor(actualContainerHeight * dpr);
    
    // Set canvas resolution
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Set display size
    canvas.style.width = actualContainerWidth + 'px';
    canvas.style.height = actualContainerHeight + 'px';
    
    // Dynamic cell sizing: Use fixed cell size (20-25px) and derive grid dimensions
    // Keep currentGridSize as the fixed cell size (already set by updateGridSize)
    const logicalWidth = canvasWidth / dpr;
    const logicalHeight = canvasHeight / dpr;
    
    // Derive GRID_COLUMNS and GRID_ROWS from container dimensions and fixed cell size
    GRID_WIDTH = Math.floor(logicalWidth / currentGridSize);
    GRID_HEIGHT = Math.floor(logicalHeight / currentGridSize);
    
    // Ensure minimum grid dimensions for playability
    const minGridSize = 8;
    if (GRID_WIDTH < minGridSize) GRID_WIDTH = minGridSize;
    if (GRID_HEIGHT < minGridSize) GRID_HEIGHT = minGridSize;
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
    let shakeX = 0, shakeY = 0;
    if (screenShake > 0 && shakeEnabled) {
        shakeX = (Math.random() - 0.5) * screenShake;
        shakeY = (Math.random() - 0.5) * screenShake;
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    ctx.fillStyle = '#000';
    ctx.fillRect(-shakeX, -shakeY, canvas.width, canvas.height);

    if (!gameStarted) {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(GRID_WIDTH/2 * currentGridSize + 1, GRID_HEIGHT/2 * currentGridSize + 1, currentGridSize - 2, currentGridSize - 2);
        ctx.fillStyle = '#ff3333';
        ctx.fillRect((GRID_WIDTH/2 + 5) * currentGridSize + 1, GRID_HEIGHT/2 * currentGridSize + 1, currentGridSize - 2, currentGridSize - 2);
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
        const gradient = ctx.createRadialGradient(
            segment.x * currentGridSize + currentGridSize / 2,
            segment.y * currentGridSize + currentGridSize / 2,
            0,
            segment.x * currentGridSize + currentGridSize / 2,
            segment.y * currentGridSize + currentGridSize / 2,
            currentGridSize / 2
        );

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

    const foodGradient = ctx.createRadialGradient(
        food.x * currentGridSize + currentGridSize / 2,
        food.y * currentGridSize + currentGridSize / 2,
        0,
        food.x * currentGridSize + currentGridSize / 2,
        food.y * currentGridSize + currentGridSize / 2,
        currentGridSize / 2
    );
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
        ctx.fillText(`${combo}x COMBO!`, canvas.width / 2, 30);
    }

    ctx.restore();
}

function update() {
    if (gameOver || isPaused) return;

    direction = {...nextDirection};

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
            createParticles(food.x * currentGridSize + currentGridSize / 2, food.y * currentGridSize + currentGridSize / 2);
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

    // Navigate to game over page with data
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

function showMilestoneEffect() {
    let flashCount = 0;
    const flashInterval = setInterval(() => {
        ctx.fillStyle = flashCount % 2 === 0 ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0, 255, 255, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        flashCount++;
        if (flashCount >= 4) {
            clearInterval(flashInterval);
            draw();
        }
    }, 100);
}

function showSizeReductionEffect() {
    // Play congratulation sound
    playSound('congratulation');
    
    // Show HTML notification
    const notification = document.getElementById('sizeReductionNotification');
    if (notification) {
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
    
    // Create falling particles with "congratulations" text
    const text = "CONGRATULATIONS!";
    const particles = [];
    const colors = ['#FFD700', '#FFA500', '#FF6347', '#4CAF50', '#2196F3', '#9C27B0'];
    
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: -50 - Math.random() * 200,
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 3 + 2,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1.0,
            text: i === 0 ? text : null
        });
    }
    
    // Animate particles
    const animateParticles = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        draw();
        
        particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.008;
            
            if (p.life > 0) {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                
                if (p.text) {
                    ctx.font = `bold ${p.size * 3}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.fillText(p.text, canvas.width / 2, p.y);
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });
        
        ctx.globalAlpha = 1;
        
        if (particles.some(p => p.life > 0)) {
            requestAnimationFrame(animateParticles);
        } else {
            draw();
        }
    };
    
    animateParticles();
}

function showComboEffect(comboCount) {
    // Create falling particles with combo text
    const text = `${comboCount}x COMBO!`;
    const particles = [];
    const colors = ['#FFD700', '#FFA500', '#FF6347', '#4CAF50', '#2196F3', '#9C27B0'];
    
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: -30 - Math.random() * 150,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 2 + 1.5,
            size: Math.random() * 6 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1.0,
            text: i === 0 ? text : null
        });
    }
    
    // Animate particles
    const animateParticles = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        draw();
        
        particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.01;
            
            if (p.life > 0) {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                
                if (p.text) {
                    ctx.font = `bold ${p.size * 3}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.fillText(p.text, canvas.width / 2, p.y);
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });
        
        ctx.globalAlpha = 1;
        
        if (particles.some(p => p.life > 0)) {
            requestAnimationFrame(animateParticles);
        } else {
            draw();
        }
    };
    
    animateParticles();
}

function gameStep() {
    update();
    draw();
}

function startGame() {
    initAudio();
    playSound('click');
    gameStarted = true;
    pauseBtn.disabled = false;
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
    const soundToggle = document.getElementById('soundToggle');
    soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
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
    
    switch(type) {
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
    window.location.href = 'index.html';
}

// Touch controls
let touchStartX = 0, touchStartY = 0;

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
    const scaleX = originalCanvasWidth / rect.width;
    const scaleY = originalCanvasHeight / rect.height;
    const deltaX = (touchEndX - touchStartX) * scaleX;
    const deltaY = (touchEndY - touchStartY) * scaleY;
    const minSwipeDistance = 20;

    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) return;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && direction.x === 0) nextDirection = {x: 1, y: 0};
        else if (deltaX < 0 && direction.x === 0) nextDirection = {x: -1, y: 0};
    } else {
        if (deltaY > 0 && direction.y === 0) nextDirection = {x: 0, y: 1};
        else if (deltaY < 0 && direction.y === 0) nextDirection = {x: 0, y: -1};
    }
}

// Mouse controls
canvas.addEventListener('click', (e) => {
    if (!gameStarted || gameOver || isPaused) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = originalCanvasWidth / rect.width;
    const scaleY = originalCanvasHeight / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const headX = snake[0].x * currentGridSize + currentGridSize / 2;
    const headY = snake[0].y * currentGridSize + currentGridSize / 2;

    const dx = mouseX - headX;
    const dy = mouseY - headY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy) {
        if (dx > 0 && direction.x === 0) nextDirection = {x: 1, y: 0};
        else if (dx < 0 && direction.x === 0) nextDirection = {x: -1, y: 0};
    } else {
        if (dy > 0 && direction.y === 0) nextDirection = {x: 0, y: 1};
        else if (dy < 0 && direction.y === 0) nextDirection = {x: 0, y: -1};
    }
});

// Keyboard controls
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

    switch(e.code) {
        case 'ArrowUp':
        case 'KeyW':
            if (direction.y === 0) nextDirection = {x: 0, y: -1};
            break;
        case 'ArrowDown':
        case 'KeyS':
            if (direction.y === 0) nextDirection = {x: 0, y: 1};
            break;
        case 'ArrowLeft':
        case 'KeyA':
            if (direction.x === 0) nextDirection = {x: -1, y: 0};
            break;
        case 'ArrowRight':
        case 'KeyD':
            if (direction.x === 0) nextDirection = {x: 1, y: 0};
            break;
    }
    e.preventDefault();
});

// Window resize and viewport changes
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        handleResize();
    }, 100);
});

// Handle screen orientation changes for unified dynamic grid calculation
window.addEventListener('orientationchange', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        handleResize();
    }, 100);
});

// Handle mobile viewport changes (address bar, keyboard, etc.)
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            handleResize();
        }, 100);
    });
}

// Handle resize with clamping to keep snake and food within new boundaries
function handleResize() {
    // Store old grid dimensions for comparison
    const oldGridWidth = GRID_WIDTH;
    const oldGridHeight = GRID_HEIGHT;
    
    updateGridSize();
    setupCanvas();
    
    // Clamp snake segments to new grid boundaries
    snake = snake.map(segment => ({
        x: Math.min(segment.x, GRID_WIDTH - 1),
        y: Math.min(segment.y, GRID_HEIGHT - 1)
    }));
    
    // Remove duplicate segments if clamping caused overlaps
    const uniqueSnake = [];
    const seenPositions = new Set();
    for (const segment of snake) {
        const key = `${segment.x},${segment.y}`;
        if (!seenPositions.has(key)) {
            seenPositions.add(key);
            uniqueSnake.push(segment);
        }
    }
    snake = uniqueSnake;
    
    // Clamp or respawn food if outside new boundaries
    if (food.x >= GRID_WIDTH || food.y >= GRID_HEIGHT) {
        food = spawnFood();
    }
    
    // Ensure snake head is still valid
    if (snake.length === 0) {
        snake = [{x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2)}];
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
    }
    
    if (pauseBtn) {
        pauseBtn.disabled = true;
    }
    
    initGame();
    
    // Auto-start game
    setTimeout(() => {
        startGame();
    }, 500);
});