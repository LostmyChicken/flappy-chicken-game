#!/bin/bash

# 🐔 Flappy Chicken Game - GitHub Push Script
# Run this script after creating your GitHub repository

echo "🐔 Flappy Chicken Game - GitHub Setup"
echo "======================================"

# Check if repository URL is provided
if [ -z "$1" ]; then
    echo "❌ Please provide your GitHub repository URL"
    echo ""
    echo "Usage: ./push-to-github.sh <repository-url>"
    echo ""
    echo "Example:"
    echo "  ./push-to-github.sh https://github.com/LostmyChicken/flappy-chicken-game.git"
    echo ""
    echo "Steps to get your repository URL:"
    echo "1. Go to https://github.com"
    echo "2. Click '+' → 'New repository'"
    echo "3. Name: flappy-chicken-game"
    echo "4. Description: 🐔 A fun HTML5 Canvas-based Flappy Bird game featuring a cute chicken character!"
    echo "5. Make it Public"
    echo "6. Don't initialize with README"
    echo "7. Copy the repository URL from the setup page"
    exit 1
fi

REPO_URL=$1

echo "📁 Repository URL: $REPO_URL"
echo ""

# Add remote origin
echo "🔗 Adding remote origin..."
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

# Rename branch to main
echo "🌿 Setting up main branch..."
git branch -M main

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Your Flappy Chicken game is now on GitHub!"
    echo ""
    echo "🎮 Next steps:"
    echo "1. Visit your repository: ${REPO_URL%.git}"
    echo "2. Enable GitHub Pages in Settings → Pages"
    echo "3. Your game will be live at: https://lostmychicken.github.io/flappy-chicken-game/final.html"
    echo ""
    echo "🐔 Happy gaming!"
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "1. Repository URL is correct"
    echo "2. Repository exists on GitHub"
    echo "3. You have push permissions"
    echo ""
    echo "💡 Try running: git push -u origin main"
fi