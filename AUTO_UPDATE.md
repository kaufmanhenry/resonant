# PWA Auto-Update System

## How It Works

### 1. Version Bumping
Before each deployment, run:
```bash
npm run deploy
```

This:
- Bumps the service worker cache version (e.g., `v1.1` → `v1.2`)
- Builds the app with the new version
- Users will detect the update on next visit

### 2. Update Detection
- Service worker checks for updates every 60 seconds
- When new version found, `updateAvailable` state triggers
- `<UpdateNotification />` component shows toast in bottom-right

### 3. User Flow
1. User sees "Update Available" notification
2. Clicks "Update Now" → triggers `applyUpdate()`
3. New service worker activates
4. Page reloads automatically with fresh code

### 4. Manual Deployment (old way)
If you deploy without `npm run deploy`:
```bash
npm run bump    # Bump version only
npm run build   # Then build
```

## Files Changed

### Stretch Buddy
- `src/hooks/usePWA.ts` - Added update detection & apply logic
- `src/components/UpdateNotification.tsx` - New toast UI
- `public/sw.js` - Added message handler
- `scripts/bump-version.js` - Auto-increment script
- `package.json` - Added `bump` and `deploy` scripts

### Days
- Same files copied over
- `app/layout.tsx` - Added `<UpdateNotification />`

### Resonant  
- Same files copied over
- Already has `<UpdateNotification />` in layout

## Testing Updates

1. Deploy current version to Vercel
2. Make a code change (e.g., add a button)
3. Run `npm run deploy` and deploy again
4. Open the live PWA
5. Wait ~60 seconds (or refresh)
6. Should see "Update Available" toast
7. Click "Update Now" → page reloads with new code

## Next Steps

All three apps now have:
- ✅ Auto-update detection
- ✅ User-friendly update UI
- ✅ Version bump on deploy
- ✅ Automatic reload after update

Just use `npm run deploy` before pushing to Vercel!
