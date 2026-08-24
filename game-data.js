// Game Data Management System
class GameDataManager {
    constructor() {
        this.STORAGE_KEYS = {
            HIGH_SCORES: 'snakeHighScores',
            TOTAL_GAMES: 'totalGamesPlayed',
            TOTAL_SCORE: 'totalScore',
            ACHIEVEMENTS: 'snakeAchievements',
            BEST_COMBO: 'bestCombo',
            CURRENT_DIFFICULTY: 'currentDifficulty',
            SOUND_ENABLED: 'soundEnabled',
            SHAKE_ENABLED: 'shakeEnabled',
            PARTICLES_ENABLED: 'particlesEnabled'
        };

        this.achievementDefs = [
            { id: 'first_game', name: '🎮 First Steps', description: 'Play your first game' },
            { id: 'score_100', name: '💯 Century', description: 'Score 100 points in one game' },
            { id: 'score_500', name: '⭐ Half Grand', description: 'Score 500 points in one game' },
            { id: 'score_1000', name: '🏆 Grand Master', description: 'Score 1000 points in one game' },
            { id: 'combo_3', name: '🔥 Combo Starter', description: 'Reach 3x combo' },
            { id: 'combo_5', name: '🔥🔥 Combo Master', description: 'Reach 5x combo' },
            { id: 'games_10', name: '🎯 Dedicated', description: 'Play 10 games' },
            { id: 'total_1000', name: '📊 Score Collector', description: 'Earn 1000 total points' }
        ];

        this.difficultySettings = {
            easy: { fps: 5, color: '#4CAF50', name: 'Easy' },
            medium: { fps: 8, color: '#ff9800', name: 'Medium' },
            hard: { fps: 12, color: '#f44336', name: 'Hard' }
        };

        this.initializeData();
    }

    initializeData() {
        // Initialize high scores for each difficulty
        if (!localStorage.getItem(this.STORAGE_KEYS.HIGH_SCORES)) {
            localStorage.setItem(this.STORAGE_KEYS.HIGH_SCORES, JSON.stringify({
                easy: 0,
                medium: 0,
                hard: 0
            }));
        }

        // Initialize other data if not present
        if (!localStorage.getItem(this.STORAGE_KEYS.TOTAL_GAMES)) {
            localStorage.setItem(this.STORAGE_KEYS.TOTAL_GAMES, '0');
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.TOTAL_SCORE)) {
            localStorage.setItem(this.STORAGE_KEYS.TOTAL_SCORE, '0');
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.ACHIEVEMENTS)) {
            localStorage.setItem(this.STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.BEST_COMBO)) {
            localStorage.setItem(this.STORAGE_KEYS.BEST_COMBO, '0');
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.CURRENT_DIFFICULTY)) {
            localStorage.setItem(this.STORAGE_KEYS.CURRENT_DIFFICULTY, 'easy');
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.SOUND_ENABLED)) {
            localStorage.setItem(this.STORAGE_KEYS.SOUND_ENABLED, 'true');
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.SHAKE_ENABLED)) {
            localStorage.setItem(this.STORAGE_KEYS.SHAKE_ENABLED, 'true');
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.PARTICLES_ENABLED)) {
            localStorage.setItem(this.STORAGE_KEYS.PARTICLES_ENABLED, 'true');
        }
    }

    getHighScores() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.HIGH_SCORES));
    }

    getHighScore(difficulty) {
        const scores = this.getHighScores();
        return scores[difficulty] || 0;
    }

    setHighScore(difficulty, score) {
        const scores = this.getHighScores();
        if (score > scores[difficulty]) {
            scores[difficulty] = score;
            localStorage.setItem(this.STORAGE_KEYS.HIGH_SCORES, JSON.stringify(scores));
            return true;
        }
        return false;
    }

    getTotalGames() {
        return parseInt(localStorage.getItem(this.STORAGE_KEYS.TOTAL_GAMES)) || 0;
    }

    incrementTotalGames() {
        const current = this.getTotalGames();
        localStorage.setItem(this.STORAGE_KEYS.TOTAL_GAMES, (current + 1).toString());
    }

    getTotalScore() {
        return parseInt(localStorage.getItem(this.STORAGE_KEYS.TOTAL_SCORE)) || 0;
    }

    addTotalScore(score) {
        const current = this.getTotalScore();
        localStorage.setItem(this.STORAGE_KEYS.TOTAL_SCORE, (current + score).toString());
    }

    getAchievements() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ACHIEVEMENTS)) || [];
    }

    addAchievement(achievementId) {
        const achievements = this.getAchievements();
        if (!achievements.includes(achievementId)) {
            achievements.push(achievementId);
            localStorage.setItem(this.STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
            return true;
        }
        return false;
    }

    getBestCombo() {
        return parseInt(localStorage.getItem(this.STORAGE_KEYS.BEST_COMBO)) || 0;
    }

    setBestCombo(combo) {
        const current = this.getBestCombo();
        if (combo > current) {
            localStorage.setItem(this.STORAGE_KEYS.BEST_COMBO, combo.toString());
        }
    }

    getCurrentDifficulty() {
        return localStorage.getItem(this.STORAGE_KEYS.CURRENT_DIFFICULTY) || 'easy';
    }

    setCurrentDifficulty(difficulty) {
        localStorage.setItem(this.STORAGE_KEYS.CURRENT_DIFFICULTY, difficulty);
    }

    isSoundEnabled() {
        return localStorage.getItem(this.STORAGE_KEYS.SOUND_ENABLED) === 'true';
    }

    setSoundEnabled(enabled) {
        localStorage.setItem(this.STORAGE_KEYS.SOUND_ENABLED, enabled.toString());
    }

    isShakeEnabled() {
        return localStorage.getItem(this.STORAGE_KEYS.SHAKE_ENABLED) === 'true';
    }

    setShakeEnabled(enabled) {
        localStorage.setItem(this.STORAGE_KEYS.SHAKE_ENABLED, enabled.toString());
    }

    areParticlesEnabled() {
        return localStorage.getItem(this.STORAGE_KEYS.PARTICLES_ENABLED) === 'true';
    }

    setParticlesEnabled(enabled) {
        localStorage.setItem(this.STORAGE_KEYS.PARTICLES_ENABLED, enabled.toString());
    }

    resetAllData() {
        localStorage.removeItem(this.STORAGE_KEYS.HIGH_SCORES);
        localStorage.removeItem(this.STORAGE_KEYS.TOTAL_GAMES);
        localStorage.removeItem(this.STORAGE_KEYS.TOTAL_SCORE);
        localStorage.removeItem(this.STORAGE_KEYS.ACHIEVEMENTS);
        localStorage.removeItem(this.STORAGE_KEYS.BEST_COMBO);
        localStorage.removeItem(this.STORAGE_KEYS.CURRENT_DIFFICULTY);
        this.initializeData();
    }

    checkAchievements(gameStats) {
        const newAchievements = [];
        
        const achievementConditions = {
            'first_game': () => this.getTotalGames() >= 1,
            'score_100': () => gameStats.score >= 100,
            'score_500': () => gameStats.score >= 500,
            'score_1000': () => gameStats.score >= 1000,
            'combo_3': () => gameStats.maxCombo >= 3,
            'combo_5': () => gameStats.maxCombo >= 5,
            'games_10': () => this.getTotalGames() >= 10,
            'total_1000': () => this.getTotalScore() >= 1000
        };

        Object.keys(achievementConditions).forEach(id => {
            if (!this.getAchievements().includes(id) && achievementConditions[id]()) {
                this.addAchievement(id);
                newAchievements.push(id);
            }
        });

        return newAchievements;
    }

    getAchievementInfo(id) {
        return this.achievementDefs.find(a => a.id === id);
    }

    getAllAchievementInfo() {
        return this.achievementDefs;
    }
}

// Create global instance
const gameData = new GameDataManager();