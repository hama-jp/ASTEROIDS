# Suggested Commands

## Development Workflow

### TypeScript Compilation
```bash
tsc game.ts
```
**Note**: Must be run after any changes to `game.ts` to generate `game.js`

### Running the Game
```bash
# Using Python's built-in server
python -m http.server 8000

# Using Node.js http-server (if available)
npx http-server
```
**Note**: Local server required for proper audio file loading

### System Commands (Linux)
- `ls` - List directory contents
- `cd` - Change directory  
- `find` - Search for files
- `grep` - Search text patterns
- `git` - Version control (if initialized)

## Project Constraints
- **No package.json**: No npm scripts or build system configured
- **No tsconfig.json**: TypeScript compiler uses default settings
- **Manual compilation**: TypeScript must be compiled manually after changes
- **Local server required**: File protocol doesn't work reliably with audio files