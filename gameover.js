// Game Over Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    loadGameData();
    displayAchievements();
});

function loadGameData() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameData_str = urlParams.get('data');
    
    if (gameData_str) {
        try {
            const data = JSON.parse(decodeURIComponent(gameData_str));
            document.getElementById('finalScore').textContent = data.score;
            document.getElementById('highScore').textContent = data.highScore;
            document.getElementById('maxCombo').textContent = data.maxCombo + 'x';
            document.getElementById('difficulty').textContent = 
                gameData.difficultySettings[data.difficulty].name;
            
            // Show achievement notifications for new achievements
            if (data.newAchievements && data.newAchievements.length > 0) {
                data.newAchievements.forEach(achievementId => {
                    const achievementInfo = gameData.getAchievementInfo(achievementId);
                    if (achievementInfo) {
                        showAchievementNotification(achievementInfo.name);
                    }
                });
            }
        } catch (e) {
            console.error('Error loading game data:', e);
        }
    }
}

function displayAchievements() {
    const achievementsList = document.getElementById('achievementsList');
    const recentAchievements = gameData.getAchievements().slice(-3);
    
    if (recentAchievements.length === 0) {
        achievementsList.innerHTML = '<p class="no-achievements">No achievements yet</p>';
        return;
    }

    achievementsList.innerHTML = recentAchievements.map(id => {
        const achievementInfo = gameData.getAchievementInfo(id);
        return `<div class="achievement-badge">${achievementInfo ? achievementInfo.name : id}</div>`;
    }).join('');
}

function showAchievementNotification(name) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `🏆 Achievement Unlocked: ${name}`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function playAgain() {
    window.location.href = 'game.html';
}

function goToStart() {
    window.location.href = 'index.html';
}

function goToSettings() {
    window.location.href = 'settings.html';
}