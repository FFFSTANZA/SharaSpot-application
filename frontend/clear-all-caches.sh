#!/bin/bash

echo "🧹 Nuclear Cache Clear for React Native/Expo"
echo "=============================================="

# Kill running processes
echo "1. Killing running Metro/Expo processes..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 1

# Remove local caches
echo "2. Removing local caches..."
rm -rf .metro-cache
rm -rf node_modules
rm -rf .expo
rm -rf .babel-cache
rm -f package-lock.json

# Clear global caches
echo "3. Clearing global caches..."
npm cache clean --force
yarn cache clean 2>/dev/null || true

# Clear Expo global cache
rm -rf ~/.expo 2>/dev/null || true

echo "4. Reinstalling dependencies..."
npm install

echo ""
echo "✅ All caches cleared! You can now start your app with:"
echo "   npm start -- --clear"
echo ""
echo "💡 This will start Expo with Metro cache cleared."
