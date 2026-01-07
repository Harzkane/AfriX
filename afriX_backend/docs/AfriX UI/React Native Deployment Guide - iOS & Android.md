# React Native Deployment Guide - iOS & Android

## 🎯 Deployment Overview

There are **two main approaches**:

1. **Expo (Recommended for AfriX)** - Easier, managed workflow
2. **React Native CLI** - More control, native code access

---

## 🚀 Option 1: Expo (Recommended)

### Why Expo for AfriX?

- ✅ No Mac needed for iOS builds (uses Expo cloud)
- ✅ Over-the-air (OTA) updates - fix bugs without app store approval
- ✅ Easier setup and deployment
- ✅ Built-in push notifications, updates, etc.
- ✅ EAS Build handles certificates automatically

### Prerequisites

```bash
npm install -g eas-cli
eas login
```

---

## 📋 Step-by-Step: Expo Deployment

### 1️⃣ Initial Setup

```bash
# Create new Expo app
npx create-expo-app afriX-mobile
cd afriX-mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure
```

This creates `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      }
    }
  }
}
```

---

### 2️⃣ Configure app.json

```json
{
  "expo": {
    "name": "AfriX",
    "slug": "afrix",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/[your-project-id]"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.afrix.mobile",
      "buildNumber": "1.0.0",
      "infoPlist": {
        "NSCameraUsageDescription": "AfriX needs camera access for KYC verification",
        "NSPhotoLibraryUsageDescription": "AfriX needs photo access for identity verification"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.afrix.mobile",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    },
    "plugins": ["expo-router"]
  }
}
```

---

### 3️⃣ Build for Android

#### **Internal Testing (APK)**

```bash
# Build APK for testing
eas build --profile preview --platform android

# Download and install on device
# Link will be provided after build completes
```

#### **Production (AAB for Google Play)**

```bash
# Build Android App Bundle
eas build --platform android --profile production

# This creates an AAB file ready for Play Store
```

**What happens:**

1. Code is uploaded to Expo servers
2. Build runs in cloud (takes 10-20 mins)
3. You get download link for APK/AAB
4. No Android Studio required!

---

### 4️⃣ Build for iOS

#### **Simulator Build (Development)**

```bash
# For testing on Mac simulator
eas build --profile development --platform ios
```

#### **TestFlight (Internal Testing)**

```bash
# Build for TestFlight
eas build --platform ios --profile production

# This creates IPA file
```

**What happens:**

1. Expo handles certificates automatically
2. Creates IPA file
3. No Mac or Xcode required!
4. Takes 15-30 mins

**First-time iOS Setup:**

```bash
# Expo will ask for:
# 1. Apple ID
# 2. App-specific password
# 3. Apple Developer Team ID

# They'll create certificates/profiles for you!
```

---

### 5️⃣ Submit to App Stores

#### **Android - Google Play Store**

**One-time Setup:**

1. Create Google Play Developer account ($25 one-time fee)
2. Create app in Play Console
3. Generate service account JSON:
   - Google Cloud Console → IAM & Admin → Service Accounts
   - Create key → Download JSON
   - Save as `google-service-account.json`

**Submit:**

```bash
# Upload to Play Store (internal testing track)
eas submit --platform android --profile production

# Or manually:
# 1. Download AAB from EAS
# 2. Upload to Play Console
# 3. Fill out store listing
# 4. Submit for review
```

**Play Store Listing Checklist:**

- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (at least 2, up to 8)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Pricing (free/paid)

---

#### **iOS - Apple App Store**

**One-time Setup:**

1. Apple Developer account ($99/year)
2. Create app in App Store Connect
3. Get credentials:
   ```bash
   # EAS will guide you through:
   # - Apple ID
   # - App-specific password
   # - Team ID
   ```

**Submit:**

```bash
# Upload to App Store Connect
eas submit --platform ios --profile production

# Or use Transporter app (Mac only)
```

**App Store Listing Checklist:**

- [ ] App icon (1024x1024, no transparency)
- [ ] Screenshots for each device size:
  - iPhone 6.7" (1290x2796)
  - iPhone 6.5" (1242x2688)
  - iPhone 5.5" (1242x2208)
- [ ] App preview video (optional but recommended)
- [ ] Description (4000 chars)
- [ ] Keywords (100 chars)
- [ ] Support URL
- [ ] Privacy policy URL
- [ ] Age rating

---

## 🔄 OTA Updates (Expo's Superpower)

### Setup Updates

```bash
# Configure in app.json
"updates": {
  "url": "https://u.expo.dev/[your-project-id]"
}

# Publish update
eas update --branch production --message "Fixed deposit verification"
```

### What can be updated OTA?

- ✅ JavaScript code changes
- ✅ Bug fixes
- ✅ UI updates
- ✅ API endpoint changes
- ❌ Native code changes (needs new build)
- ❌ Permissions changes (needs new build)

### Example Update Flow:

```bash
# Fix critical bug
git commit -m "fix: deposit amount validation"

# Push OTA update
eas update --branch production --message "Fixed deposit bug"

# Users get update on next app launch!
# No app store approval needed!
```

---

## 📱 Testing Before Production

### 1. **Internal Testing**

**Android:**

```bash
# Build APK
eas build --profile preview --platform android

# Share link with team
# They download and install APK directly
```

**iOS:**

```bash
# Add testers to Apple Developer account
# Build and upload to TestFlight
eas build --platform ios --profile production
eas submit --platform ios

# Testers get email to install via TestFlight app
```

### 2. **Beta Testing**

**Android (Google Play):**

- Use internal testing track (up to 100 testers)
- Then closed testing (unlimited testers)
- Then open testing (public beta)

**iOS (TestFlight):**

- Internal testing (up to 100 testers)
- External testing (up to 10,000 testers)
- Requires Apple review for external

---

## 🛠️ Build Profiles Explained

```json
{
  "build": {
    // For development/debugging
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },

    // For team testing (APK)
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },

    // For app stores
    "production": {
      "distribution": "store",
      "env": {
        "API_URL": "https://api.afrix.com"
      }
    }
  }
}
```

---

## 🔐 Environment Variables

### Setup .env files:

```bash
# .env.development
API_URL=http://localhost:5001
POLYGON_RPC=https://rpc-amoy.polygon.technology

# .env.production
API_URL=https://api.afrix.com
POLYGON_RPC=https://polygon-rpc.com
```

### Use in app:

```javascript
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.apiUrl;
```

### Configure in app.json:

```json
{
  "extra": {
    "apiUrl": process.env.API_URL,
    "polygonRpc": process.env.POLYGON_RPC
  }
}
```

---

## 📊 Deployment Timeline

### First Deployment:

| Task               | Time       |
| ------------------ | ---------- |
| Setup Expo account | 10 mins    |
| Configure app.json | 30 mins    |
| Android build      | 15-20 mins |
| iOS build          | 20-30 mins |
| Play Store setup   | 2-3 hours  |
| App Store setup    | 2-3 hours  |
| Store review wait  | 1-7 days   |

### Subsequent Updates:

| Task                | Time       |
| ------------------- | ---------- |
| OTA update          | 5 mins     |
| New build           | 15-30 mins |
| Store update review | 1-3 days   |

---

## 💡 Pro Tips

### 1. **Version Management**

```bash
# Automate version bumps
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0

# Update app.json automatically
```

### 2. **CI/CD with EAS**

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npx eas-cli build --platform all --non-interactive
```

### 3. **Beta Channels**

```bash
# Create separate channels
eas update --branch production
eas update --branch staging
eas update --branch beta

# Users can switch channels
```

### 4. **Monitoring**

- Use Sentry for error tracking
- Firebase Analytics for usage
- EAS insights for performance

---

## 🚨 Common Issues & Solutions

### Issue: Build fails on iOS

```bash
# Solution: Clear cache
eas build --clear-cache --platform ios
```

### Issue: Android signing errors

```bash
# Solution: Reset credentials
eas credentials
# Select Android → Remove credentials → Rebuild
```

### Issue: OTA update not working

```javascript
// Check update manually
import * as Updates from "expo-updates";

async function checkForUpdates() {
  const update = await Updates.checkForUpdateAsync();
  if (update.isAvailable) {
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  }
}
```

---

## 📋 Complete Deployment Checklist

### Pre-Launch:

- [ ] Test on real Android device
- [ ] Test on real iPhone
- [ ] Test in low network conditions
- [ ] Test all payment flows
- [ ] Test blockchain interactions
- [ ] Security audit
- [ ] Privacy policy created
- [ ] Terms of service created

### Android Launch:

- [ ] Google Play Developer account created
- [ ] App icon and graphics ready
- [ ] Store listing filled out
- [ ] Content rating completed
- [ ] Privacy policy linked
- [ ] First build submitted
- [ ] Internal testing completed
- [ ] Production release

### iOS Launch:

- [ ] Apple Developer account active
- [ ] App Store Connect app created
- [ ] Screenshots for all sizes
- [ ] App icon ready (no transparency)
- [ ] Privacy policy linked
- [ ] Support URL active
- [ ] TestFlight testing completed
- [ ] Submit for review

### Post-Launch:

- [ ] Monitor crash reports
- [ ] Track user feedback
- [ ] Monitor API performance
- [ ] Set up alerts for errors
- [ ] Plan first OTA update

---

## 🎯 Recommended Release Strategy

### Phase 1: Internal (Week 1)

- Build with `preview` profile
- Test with 5-10 team members
- Fix critical bugs

### Phase 2: Beta (Week 2-3)

- Release to 50-100 beta testers
- Use internal testing tracks
- Gather feedback

### Phase 3: Soft Launch (Week 4)

- Release in one city (Lagos)
- Monitor closely
- Quick OTA fixes

### Phase 4: Full Launch (Week 5+)

- National release
- Marketing campaign
- Monitor scaling

---

## 🔗 Useful Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Guide](https://docs.expo.dev/submit/introduction/)
- [EAS Update Guide](https://docs.expo.dev/eas-update/introduction/)
- [Play Store Guide](https://play.google.com/console/about/)
- [App Store Connect Guide](https://developer.apple.com/app-store-connect/)

---

## 💰 Cost Breakdown

| Service               | Cost                               |
| --------------------- | ---------------------------------- |
| Expo Account          | Free (hobby) / $29/mo (production) |
| Google Play Developer | $25 one-time                       |
| Apple Developer       | $99/year                           |
| EAS Builds            | Free tier: 30 builds/mo            |
| **Total Year 1**      | ~$150-400                          |

---

## ⚡ Quick Deploy Commands

```bash
# Full deployment flow
eas build --platform all --profile production
eas submit --platform all --profile production

# Quick OTA fix
eas update --branch production --message "Bug fix"

# Build for testing
eas build --profile preview --platform all
```
