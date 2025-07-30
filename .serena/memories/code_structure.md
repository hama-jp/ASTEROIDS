# Code Structure

## File Organization
```
/
├── index.html          # Main HTML file
├── game.ts            # TypeScript source (main game logic)
├── game.js            # Compiled JavaScript
├── style.css          # Game styling
├── CLAUDE.md          # Development documentation
└── sounds/
    ├── laser.wav      # Laser sound effect
    ├── explosion.wav  # Explosion sound effect
    ├── thruster.wav   # Thruster sound effect
    └── license.txt    # Sound license info
```

## Key Classes & Components

### Core Classes
- `SoundManager` - Manages all sound effects (laser, explosion, thruster)
- Type definitions: `Vector`, `Ship`, `Bullet`, `Asteroid`

### Game State
- Global variables: `ship`, `bullets`, `asteroids`, `score`, `lives`
- Game loop: `gameLoop()` using `requestAnimationFrame`

### Main Functions
- `initGame()` - Game initialization
- `updateShip()`, `updateBullets()`, `updateAsteroids()` - Physics updates
- `drawShip()`, `drawBullets()`, `drawAsteroids()` - Rendering
- `checkCollisions()` - Collision detection
- `shootBullet()` - Bullet creation
- `createAsteroid()` - Asteroid generation