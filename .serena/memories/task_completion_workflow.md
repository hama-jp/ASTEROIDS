# Task Completion Workflow

## After Making Code Changes

### 1. Compile TypeScript
```bash
tsc game.ts
```
**Critical**: Always compile after editing `game.ts` - the browser loads `game.js`, not `game.ts`

### 2. Test the Game
```bash
# Start local server
python -m http.server 8000
# Then open http://localhost:8000 in browser
```

### 3. Verify Functionality
- Test game controls (arrow keys, spacebar)
- Check sound effects are working
- Verify game mechanics (collision, scoring, lives)
- Test game over and restart functionality

## Important Notes
- **No automated testing**: Manual testing required
- **No linting/formatting tools**: Visual inspection of code quality
- **No build system**: Simple manual compilation workflow
- **Direct file editing**: Edit `game.ts`, never edit `game.js` directly

## Common Issues
- If sounds don't work: Ensure using local server, not file:// protocol
- If changes don't appear: Check that TypeScript was compiled successfully
- Browser caching: Hard refresh (Ctrl+F5) if changes don't appear