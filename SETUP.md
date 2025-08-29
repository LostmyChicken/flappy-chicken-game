# 🐔 Flappy Chicken Game - GitHub Setup Guide

## Quick Start

Your Flappy Chicken game is ready to be pushed to GitHub! Here's how to set it up:

### Option 1: Create Repository on GitHub (Recommended)

1. **Go to GitHub**: Visit [github.com](https://github.com) and log in
2. **Create New Repository**: 
   - Click the "+" icon → "New repository"
   - Repository name: `flappy-chicken-game`
   - Description: `🐔 A fun HTML5 Canvas-based Flappy Bird game featuring a cute chicken character!`
   - Make it **Public** (so others can play!)
   - **Don't** initialize with README (we already have one)
3. **Copy the repository URL** (it will be something like: `https://github.com/LostmyChicken/flappy-chicken-game.git`)

### Option 2: Use GitHub CLI (if you have it installed)

```bash
gh repo create flappy-chicken-game --public --description "🐔 A fun HTML5 Canvas-based Flappy Bird game featuring a cute chicken character!"
```

## Push Your Code

Once you have the repository URL, run these commands:

```bash
# Add the remote repository
git remote add origin https://github.com/LostmyChicken/flappy-chicken-game.git

# Push your code
git branch -M main
git push -u origin main
```

## Enable GitHub Pages (Optional)

To make your game playable online:

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under "Source", select **Deploy from a branch**
5. Choose **main** branch and **/ (root)** folder
6. Click **Save**

Your game will be available at: `https://lostmychicken.github.io/flappy-chicken-game/final.html`

## Game Files Overview

- **`final.html`** - ⭐ **PLAY THIS ONE** - Best version with polished UI
- **`working-demo.html`** - Demo version that shows how the game works
- **`index.html`** - Original version with debug features
- **`server.py`** - Python server for local development
- **`README.md`** - Complete documentation

## Local Development

```bash
# Start the server
python3 server.py

# Open in browser
# http://localhost:54465/final.html
```

## Features Included

✅ **Physics-based gameplay** - Realistic gravity and flight mechanics  
✅ **Beautiful graphics** - SVG chicken sprites with animations  
✅ **Sound effects** - Web Audio API for jump, score, and game over sounds  
✅ **Multiple difficulty levels** - Easy, Normal, Hard modes  
✅ **Score persistence** - Local storage for high scores  
✅ **Mobile support** - Touch controls for mobile devices  
✅ **Auto-demo mode** - Shows how to play the game correctly  
✅ **Particle effects** - Visual feedback for actions  
✅ **Responsive design** - Works on different screen sizes  

## How to Play

1. **Click or press SPACE** to make the chicken flap
2. **Keep clicking regularly** - the chicken falls due to gravity!
3. **Navigate through pipe gaps** to score points
4. **Don't hit pipes or ground** - game over!
5. **Find your rhythm** - click every 0.5-1 seconds

## Repository Structure

```
flappy-chicken-game/
├── final.html              # 🌟 Main game (recommended)
├── final-game.js           # Main game logic
├── working-demo.html       # Demo with auto-play
├── index.html              # Original version
├── game.js                 # Original game logic
├── chicken-api.js          # Chicken image loading
├── server.py               # Development server
├── README.md               # Documentation
├── SETUP.md                # This setup guide
└── .gitignore              # Git ignore rules
```

## Next Steps

1. Create the GitHub repository
2. Push your code
3. Enable GitHub Pages
4. Share your game with friends!
5. Consider adding more features like:
   - Leaderboards
   - More chicken varieties
   - Power-ups
   - Background music
   - Achievements

Happy coding! 🐔✨