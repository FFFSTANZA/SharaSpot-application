# Metro Cache Issues - Troubleshooting Guide

## The Problem (NOW FIXED)

This project **previously** used a **persistent Metro cache** configuration in `metro.config.js` that stored bundler cache on disk. This was causing serious issues where old versions of the app persisted even after code changes.

### Symptoms (that occurred before the fix)
- App displays old/mixed versions of code
- Changes not reflected after restart
- "Combining few old versions" behavior
- App works for few minutes, then reverts to old version

## Root Cause (FIXED)

The `metro.config.js` file was explicitly configuring a persistent FileStore cache:

```javascript
const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, '.metro-cache');
config.cacheStores = [
  new FileStore({ root: path.join(root, 'cache') }),
];
```

This cache persisted between Metro restarts and held stale bundles that would be served even after clearing caches manually.

## Permanent Fix Applied

**The persistent cache has been DISABLED in `metro.config.js`**. Metro now uses default in-memory caching only. This prevents stale bundles from persisting between sessions.

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

## Going Forward

With the persistent cache disabled, you should:

1. **Start normally**: Just use `npm start` or `npm run start:fresh`
2. **No more mixed versions**: The issue of old/new code mixing is resolved
3. **Slightly slower first builds**: Metro will rebuild more often, but this ensures fresh code
4. **Use `--clear` if needed**: If you ever see stale code, run `npm run start:fresh`

## Re-enabling Persistent Cache (Not Recommended)

If you need persistent caching for performance and are willing to manually manage cache issues:

1. Uncomment the FileStore configuration in `metro.config.js` (lines 12-15)
2. Always use `npm run start:fresh` when starting development
3. Run `npm run nuclear-reset` if you see any cache issues
4. Be prepared for the old/mixed version issues to potentially return

## Quick Reference

| Issue | Command |
|-------|---------|
| Changes not showing | `npm run start:fresh` |
| Weird mixed versions | `npm run clear-cache` |
| Nothing works | `npm run nuclear-reset` |
| Kill zombie processes | `pkill -f "metro"` |
