# Fix Mobile App Connection Errors

## Issues Fixed:
1. ✅ Fixed typo in `apiClient.ts` (192.169 → 192.168)
2. ✅ Updated API URLs to match current IP: `192.168.1.144:5001`

## Next Steps:

### 1. Clear Metro Cache and Restart
The Metro bundler cache error needs to be cleared:

```bash
cd afriX-mobile

# Clear Metro cache
npx expo start --clear

# Or manually delete cache
rm -rf node_modules/.cache
rm -rf .expo
```

### 2. Verify Backend is Running
Make sure your backend is running on port 5001:
```bash
cd afriX_backend
npm start
```

You should see:
```
✅ Server running on port 5001
📍 API Base URL: http://localhost:5001/api/v1
```

### 3. Update IP Address if it Changes
If your local network IP changes, update it in:
- `app.json` → `extra.apiUrl`
- `src/constants/api.ts` → fallback URL
- `src/services/apiClient.ts` → fallback URL

**Find your current IP:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### 4. For iOS Simulator
If using iOS simulator, you can use `localhost`:
```json
"apiUrl": "http://localhost:5001/api/v1"
```

### 5. For Physical Device
Use your computer's local IP (must be on same WiFi):
```json
"apiUrl": "http://192.168.1.144:5001/api/v1"
```

### 6. Test Connection
After restarting Expo with `--clear`, the app should connect to the backend.

## Note About Package Versions
The warnings about package versions are just recommendations. The app should still work, but consider running:
```bash
npx expo install --fix
```

