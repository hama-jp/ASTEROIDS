# ASTEROIDS-Style Game

A classic ASTEROIDS-style browser game developed with HTML5 Canvas and TypeScript.

## 🎮 Game Overview

Control a spaceship and destroy incoming asteroids in this shooting game. As you destroy asteroids, the level increases and more fast-moving asteroids appear.

## ✨ Features

- 🚀 **Spaceship Control**: Rotate and thrust with arrow keys
- 🔫 **Shooting System**: Fire bullets with spacebar
- 💥 **Asteroid Splitting**: Large asteroids split into smaller ones when destroyed
- 📈 **Level System**: Level up by destroying asteroids
- 🏆 **High Score**: Save your best score in local storage
- 🎵 **Sound Effects**: Laser, explosion, and thruster sounds
- 📱 **Responsive**: Automatically adapts to browser window size

## 🎯 Controls

- **←→ Arrow Keys**: Rotate spaceship
- **↑ Arrow Key**: Thrust
- **Spacebar**: Fire bullets
- **Click**: Restart game (when game over)

## 🚀 How to Play

Simply download the files and open `index.html` directly in your web browser. This works for most modern browsers!

### Development

If you edit the TypeScript file, compile it with:

```bash
tsc game.ts
```

## 📁 File Structure

```
.
├── index.html          # Main HTML file
├── game.ts            # TypeScript source code
├── game.js            # Compiled JavaScript
├── style.css          # Stylesheet
├── sounds/            # Sound effect files
│   ├── laser.wav      # Laser sound
│   ├── explosion.wav  # Explosion sound
│   └── thruster.wav   # Thruster sound
├── README.md          # This file (English)
└── README_ja.md       # Japanese version
```

## 🎮 Game Systems

### Level System
- When asteroids drop to 2 or fewer, new asteroids spawn and level increases
- Each level increases asteroid count and speed
- Spawned asteroids: Level + 2 asteroids

### Difficulty Scaling
- **Speed**: Increases by 20% per level
- **Size**: Asteroids become slightly smaller at higher levels
- **Quantity**: More asteroids spawn based on level

### Scoring System
- Asteroid destruction: 100 points
- High score is permanently saved in browser's local storage

## 🛠️ Technical Specifications

- **Language**: TypeScript / JavaScript
- **Graphics**: HTML5 Canvas
- **Audio**: Web Audio API
- **Storage**: localStorage
- **Responsive**: CSS Grid / Flexbox

## 🤖 Development

This game was initially created using **Qwen3-Coder** and then enhanced and polished with **Claude Code**. The combination of AI-assisted development helped create a feature-rich, well-structured game with modern web technologies.

## 📝 License

This project is released under the MIT License.

## 🤝 Contributing

Pull requests and issues are welcome!

---

Enjoy the game! 🚀✨