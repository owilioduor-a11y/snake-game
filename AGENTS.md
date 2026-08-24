# Project Rules and Guidelines

## Project Overview
Snake Combo is a vanilla JavaScript web game built with HTML5 Canvas, CSS3, and ES6+ JavaScript. No build process or external dependencies are required.

## Development Guidelines

### File Structure
- `index.html` - Main menu/start screen
- `game.html` - Game interface
- `gameover.html` - Game over screen  
- `settings.html` - Settings menu
- `index.js` - Main menu logic
- `game.js` - Core game logic (775 lines)
- `gameover.js` - Game over screen logic
- `game-data.js` - Data management & persistence (211 lines)
- `settings.js` - Settings management
- `styles.css` - Global styles and animations

### Verification Steps
Since this is a vanilla JavaScript project with no build process:
1. Open `index.html` in a modern web browser to test
2. Test all game features: controls, achievements, settings, responsive design
3. Test on different browsers (Chrome, Firefox, Safari, Edge) if possible
4. Test on mobile devices for touch controls
5. Verify no console errors in browser developer tools

### Running the Project
- Direct file opening: Simply open `index.html` in a browser
- Local server: `python -m http.server 8000` or `npx http-server`
- Package scripts: `npm start` or `npm run dev` (both use Python server)

### Code Conventions
- ES6+ JavaScript syntax
- Canvas API for graphics rendering
- Web Audio API for procedural sound effects
- LocalStorage for data persistence
- CSS3 animations and responsive design
- Touch controls with swipe gestures
- Keyboard controls (Arrow keys, WASD)
- Mouse click controls

### Key Features
- Combo system for multiplied scores
- Three difficulty levels (Easy: 5 FPS, Medium: 8 FPS, Hard: 12 FPS)
- Achievement system with 8 unlockable achievements
- Responsive design with dynamic grid sizing
- Particle effects and screen shake
- Sound toggle, shake toggle, particles toggle
- High score tracking per difficulty
- Total games and total score tracking

### Important Notes
- Game auto-starts after 500ms delay in game.js
- Canvas dimensions: Dynamic based on container size with devicePixelRatio for retina displays
- Grid size adapts based on screen width (22-28px) as fixed cell size
- Grid dimensions (GRID_WIDTH, GRID_HEIGHT) derived dynamically from container dimensions
- External dependency: Font Awesome CDN for icons
- No backend required - runs entirely client-side
- Mobile optimized with 95% screen coverage, touch-action: none, and dynamic viewport height (100dvh)

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support
- Mobile browsers: Full support with touch controls

### File Endings
- Configure `.gitattributes` to use LF line endings for all source files
- Windows Git may convert to CRLF, but source files should be LF
