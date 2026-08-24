# 🐍 Snake Combo

A modern, feature-rich Snake game built with vanilla JavaScript, HTML5 Canvas, and CSS3. This classic arcade game comes with enhanced features including combos, power-ups, achievements, and responsive design.

![Snake Game](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)

## ✨ Features

- **Classic Gameplay**: Traditional snake mechanics with smooth controls
- **Combo System**: Chain food pickups for multiplied scores
- **Multiple Difficulty Levels**: Easy, Medium, and Hard modes
- **Achievement System**: Unlock 8 different achievements
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Touch Controls**: Swipe gestures for mobile gameplay
- **Visual Effects**: Particles, screen shake, and combo animations
- **Sound Effects**: Procedural audio feedback
- **Local Storage**: Persistent high scores and game data
- **Customizable Settings**: Toggle sound, shake effects, and particles

## 🎮 How to Play

### Controls
- **Arrow Keys / WASD**: Move the snake
- **Space**: Start game
- **P / Escape**: Pause game
- **Mouse Click**: Click to steer towards cursor
- **Touch**: Swipe to change direction

### Gameplay
1. Eat the red food to grow and score points
2. Chain food pickups quickly to build combos for multiplied scores
3. Avoid hitting walls or your own tail
4. Reach score milestones to unlock achievements
5. Compete for high scores across different difficulty levels

### Difficulty Levels
- **Easy**: Slower pace (5 FPS) - Great for beginners
- **Medium**: Balanced speed (8 FPS) - Standard gameplay
- **Hard**: Fast-paced (12 FPS) - For experienced players

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No build process or dependencies required

### Installation
1. Clone the repository:
```bash
git clone https://github.com/owilioduor-a11y/snake-game.git
cd snake-game
```

**Note**: Replace `owilioduor-a11y` with your actual GitHub username when cloning.

2. Open `index.html` in your web browser

Alternatively, use a local server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server
```

Then navigate to `http://localhost:8000` in your browser.

## 📁 Project Structure

```
snake-game/
├── index.html          # Main menu/start screen
├── game.html           # Game interface
├── gameover.html       # Game over screen
├── settings.html       # Settings menu
├── index.js            # Main menu logic
├── game.js             # Core game logic
├── gameover.js         # Game over screen logic
├── game-data.js        # Data management & persistence
├── settings.js         # Settings management
└── styles.css          # Global styles and animations
```

## 🏆 Achievements

- 🎮 **First Steps**: Play your first game
- 💯 **Century**: Score 100 points in one game
- ⭐ **Half Grand**: Score 500 points in one game
- 🏆 **Grand Master**: Score 1000 points in one game
- 🔥 **Combo Starter**: Reach 3x combo
- 🔥🔥 **Combo Master**: Reach 5x combo
- 🎯 **Dedicated**: Play 10 games
- 📊 **Score Collector**: Earn 1000 total points

## 🎨 Customization

### Game Settings
- Toggle sound effects on/off
- Enable/disable screen shake effects
- Enable/disable particle effects
- Change difficulty level

### Reset Data
You can reset all game data (high scores, achievements, etc.) from the settings menu.

## 🛠️ Development

### Technologies Used
- **HTML5**: Semantic markup and structure
- **CSS3**: Styling, animations, and responsive design
- **JavaScript (ES6+)**: Game logic and interactivity
- **Canvas API**: Graphics rendering
- **Web Audio API**: Sound effects
- **LocalStorage**: Data persistence

### Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support with touch controls

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📧 Contact

- GitHub Issues: [Report bugs or request features](https://github.com/owilioduor-a11y/snake-game/issues)

**Note**: Replace `owilioduor-a11y` with your actual GitHub username.

## 🙏 Acknowledgments

- Classic Snake game concept
- Font Awesome for icons
- Modern web APIs for enhanced functionality

## 🎯 Roadmap

Potential future enhancements:
- [ ] Multiplayer mode
- [ ] Additional power-ups
- [ ] More difficulty levels
- [ ] Leaderboard system
- [ ] Additional themes/skins
- [ ] Mobile app version

---

Made with ❤️ using vanilla JavaScript
