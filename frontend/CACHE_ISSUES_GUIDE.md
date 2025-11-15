# Metro Cache Issues - Troubleshooting Guide

## The Problem

This project uses a **persistent Metro cache** configuration in `metro.config.js` that stores bundler cache on disk. While this improves build performance, it can cause issues where old versions of the app persist even after code changes.

### Symptoms
- App displays old/mixed versions of code
- Changes not reflected after restart
- "Combining few old versions" behavior

## Root Cause

The `metro.config.js` file (lines 8-12) explicitly configures a FileStore cache:

```javascript
const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, '.metro-cache');
config.cacheStores = [
  new FileStore({ root: path.join(root, 'cache') }),
];
```

This cache persists between Metro restarts and can hold stale bundles.

## Solutions

### Quick Fix (Recommended for regular use)
```bash
npm run start:fresh
```

This starts Expo with the `--clear` flag, clearing Metro cache before starting.

### Medium Fix (When quick fix doesn't work)
```bash
npm run clear-cache
```

This removes `.metro-cache` and `.expo` directories, then starts fresh.

### Nuclear Option (When nothing else works)
```bash
npm run nuclear-reset
```

OR run manually:
```bash
./clear-all-caches.sh
```

This script:
1. Kills all running Metro/Expo processes
2. Removes all caches (Metro, npm, yarn, Expo, node_modules)
3. Deletes lock files
4. Reinstalls all dependencies cleanly
5. Provides fresh start command

### Manual Nuclear Reset
```bash
# Kill processes
pkill -f "expo start"
pkill -f "metro"

# Remove everything
rm -rf .metro-cache node_modules .expo .babel-cache package-lock.json

# Clear global caches
npm cache clean --force
yarn cache clean

# Reinstall
npm install

# Start fresh
npm start -- --clear
```

## Prevention

### Always start with cache clear during active development:
```bash
npm run start:fresh
# OR
expo start --clear
```

### Check for zombie processes:
```bash
ps aux | grep -E "(expo|metro)" | grep -v grep
```

If you see processes, kill them:
```bash
pkill -f "expo"
pkill -f "metro"
```

## Understanding the Cache Layers

This app has MULTIPLE cache layers:

1. **Metro Bundler Cache** (`.metro-cache/`) - JavaScript bundle cache
2. **Node Modules** (`node_modules/`) - Installed packages
3. **Expo Cache** (`.expo/`) - Expo-specific cache
4. **NPM Cache** (`~/.npm/`) - Global package cache
5. **Yarn Cache** (`~/.cache/yarn/`) - Yarn package cache
6. **Global Expo** (`~/.expo/`) - Global Expo settings/cache

All must be cleared for a truly fresh start.

## Modified Files

- `package.json` - Added cache clearing scripts
- `clear-all-caches.sh` - Nuclear reset script

## Future Considerations

If you want to disable persistent caching during development, you can:

1. Comment out the `config.cacheStores` in `metro.config.js`
2. Set environment variable: `export METRO_CACHE_ROOT=/tmp/metro-cache`
3. Always use `--clear` flag when starting

## Quick Reference

| Issue | Command |
|-------|---------|
| Changes not showing | `npm run start:fresh` |
| Weird mixed versions | `npm run clear-cache` |
| Nothing works | `npm run nuclear-reset` |
| Kill zombie processes | `pkill -f "metro"` |
