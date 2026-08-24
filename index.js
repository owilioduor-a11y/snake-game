// Start Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    updateStartPageStats();
});

function updateStartPageStats() {
    document.getElementById('totalGames').textContent = gameData.getTotalGames();
    document.getElementById('totalScore').textContent = gameData.getTotalScore();
    document.getElementById('achievementCount').textContent = 
        `${gameData.getAchievements().length}/${gameData.getAllAchievementInfo().length}`;
}

function startGame() {
    // Navigate to game page
    window.location.href = 'game.html';
}

function goToSettings() {
    // Navigate to settings page
    window.location.href = 'settings.html';
}

const yearEl = document.getElementById('current-year');
   if (yearEl) {
   yearEl.textContent = new Date().getFullYear();
 };