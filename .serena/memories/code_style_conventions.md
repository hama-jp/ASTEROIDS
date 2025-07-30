# Code Style & Conventions

## TypeScript Style
- **Type definitions**: Uses `type` keyword for object shapes (e.g., `Vector`, `Ship`)
- **Classes**: PascalCase naming (e.g., `SoundManager`)
- **Methods**: camelCase with explicit access modifiers (`public`, `private`)
- **Properties**: Private properties prefixed appropriately with access modifiers
- **Comments**: Japanese comments are present in the codebase
- **Error handling**: Uses `.catch()` for promise-based operations

## Code Patterns
- **Object-oriented**: Classes for complex entities like `SoundManager`
- **Functional**: Standalone functions for game logic
- **Type safety**: Strong TypeScript typing throughout
- **Canvas API**: Direct canvas context manipulation for rendering
- **Event-driven**: Keyboard event listeners for input handling

## Constants
- All caps with underscores: `ASTEROID_COUNT`, `SHIP_SIZE`, `BULLET_SPEED`
- Defined at module level for global access

## Naming Conventions
- Variables: camelCase
- Functions: camelCase 
- Classes: PascalCase
- Constants: UPPER_SNAKE_CASE
- Types: PascalCase