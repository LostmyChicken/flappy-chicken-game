# 🐔 Flappy Chicken Game

A fun HTML5 Canvas-based game inspired by Flappy Bird, featuring a cute chicken character!

## 🎮 How to Play (IMPORTANT!)

**This is a physics-based game - you must keep clicking to stay airborne!**

1. **Start**: Click anywhere on the canvas or press SPACE to begin
2. **Keep Flying**: **CONTINUOUSLY** click or press SPACE to make the chicken flap
3. **Don't Stop**: The chicken will fall due to gravity if you stop clicking
4. **Navigate**: Guide the chicken through gaps between green pipes
5. **Score**: Each pipe you pass through increases your score
6. **Avoid**: Don't hit the pipes, ground, or ceiling!

## 🕹️ Game Physics

- **Gravity**: The chicken constantly falls downward
- **Flapping**: Each click gives an upward boost
- **Continuous Input Required**: You must click regularly to stay flying
- **Realistic Movement**: Just like the original Flappy Bird mechanics

## Controls

- **SPACE** or **Mouse Click**: Make the chicken fly upward
- **Restart**: Click "Play Again" button when game is over

## Technical Details

- Built with HTML5 Canvas and JavaScript
- Responsive design that works on desktop and mobile
- Attempts to load random chicken images from online APIs
- Falls back to a beautiful hand-drawn SVG chicken if online images fail
- Smooth 60fps gameplay with requestAnimationFrame
- Physics simulation with gravity and momentum

## 🎯 Playing Tips

- **Keep Clicking**: Click every 0.5-1 seconds to maintain altitude
- **Find Your Rhythm**: Develop a steady clicking pattern
- **Don't Panic**: Smooth, regular clicks work better than frantic tapping
- **Look Ahead**: Watch upcoming pipes to time your movements
- **Practice**: The game gets easier once you understand the physics

## 📁 Game Versions

- **`final.html`** - ⭐ **RECOMMENDED** - Polished version with best UI
- **`index.html`** - Original version with debug features
- **`simple.html`** - Minimal test version
- **`test.html`** - Debug version with console output

## 🚀 Running the Game

The game is currently running at: **http://localhost:54465**

**Best Experience**: `http://localhost:54465/final.html`

You can also run it locally by:
1. Starting the Python server: `python3 server.py`
2. Opening your browser to the URLs above

## Game Mechanics

- **Gravity**: The chicken naturally falls due to gravity
- **Jump Power**: Each flap gives the chicken upward momentum
- **Pipe Generation**: New pipes are automatically generated as you progress
- **Collision Detection**: Precise collision detection with pipes and ground
- **Rotation**: The chicken rotates slightly based on its velocity for realistic movement

Enjoy playing Flappy Chicken! 🐔✨