// Settings Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadHighScores();
    loadStatistics();
    loadAchievements();
    updateToggleStates();
    
    // Initialize checkbox event listeners
    document.querySelectorAll('.difficulty-card input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const difficulty = e.target.value;
            selectDifficulty(difficulty);
        });
    });
});

function loadSettings() {
    const currentDifficulty = gameData.getCurrentDifficulty();
    selectDifficulty(currentDifficulty);
}

function selectDifficulty(difficulty) {
    gameData.setCurrentDifficulty(difficulty);
    
    // Update UI
    document.querySelectorAll('.difficulty-card').forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.checked = (card.dataset.difficulty === difficulty);
        }
        card.classList.remove('active');
        if (card.dataset.difficulty === difficulty) {
            card.classList.add('active');
        }
    });
}

function loadHighScores() {
    document.getElementById('easyHighScore').textContent = gameData.getHighScore('easy');
    document.getElementById('mediumHighScore').textContent = gameData.getHighScore('medium');
    document.getElementById('hardHighScore').textContent = gameData.getHighScore('hard');
}

function loadStatistics() {
    document.getElementById('totalGames').textContent = gameData.getTotalGames();
    document.getElementById('totalScore').textContent = gameData.getTotalScore();
    document.getElementById('achievementCount').textContent = 
        `${gameData.getAchievements().length}/${gameData.getAllAchievementInfo().length}`;
    document.getElementById('bestCombo').textContent = gameData.getBestCombo() + 'x';
}

function loadAchievements() {
    const achievementsGrid = document.getElementById('achievementsGrid');
    const allAchievements = gameData.getAllAchievementInfo();
    const unlockedAchievements = gameData.getAchievements();
    
    achievementsGrid.innerHTML = allAchievements.map(achievement => {
        const isUnlocked = unlockedAchievements.includes(achievement.id);
        return `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${isUnlocked ? achievement.name.split(' ')[0] : '🔒'}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `;
    }).join('');
}

function updateToggleStates() {
    // Sound toggle
    const soundToggle = document.getElementById('soundToggle');
    if (gameData.isSoundEnabled()) {
        soundToggle.classList.add('active');
    } else {
        soundToggle.classList.remove('active');
    }
    
    // Shake toggle
    const shakeToggle = document.getElementById('shakeToggle');
    if (gameData.isShakeEnabled()) {
        shakeToggle.classList.add('active');
    } else {
        shakeToggle.classList.remove('active');
    }
    
    // Particles toggle
    const particlesToggle = document.getElementById('particlesToggle');
    if (gameData.areParticlesEnabled()) {
        particlesToggle.classList.add('active');
    } else {
        particlesToggle.classList.remove('active');
    }
}

function toggleSound() {
    const newState = !gameData.isSoundEnabled();
    gameData.setSoundEnabled(newState);
    const soundToggle = document.getElementById('soundToggle');
    soundToggle.classList.toggle('active', newState);
}

function toggleShake() {
    const newState = !gameData.isShakeEnabled();
    gameData.setShakeEnabled(newState);
    const shakeToggle = document.getElementById('shakeToggle');
    shakeToggle.classList.toggle('active', newState);
}

function toggleParticles() {
    const newState = !gameData.areParticlesEnabled();
    gameData.setParticlesEnabled(newState);
    const particlesToggle = document.getElementById('particlesToggle');
    particlesToggle.classList.toggle('active', newState);
}

function resetAllData() {
    if (confirm('Are you sure you want to reset all game data? This cannot be undone.')) {
        gameData.resetAllData();
        loadHighScores();
        loadStatistics();
        loadAchievements();
        updateToggleStates();
        alert('All data has been reset successfully.');
    }
}

function goToStart() {
    window.location.href = 'index.html';
}