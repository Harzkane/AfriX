Viewed eas.json:1-29

Here are the exact steps you need to follow to build a new production release for your Expo app using Expo Application Services (EAS):

### 1. Open a terminal in your mobile app folder
Make sure you are in your React Native directory:
```bash
cd /Users/harz/Documents/backUps/izmir/AfriExchange/afriX-mobile
```

### 2. Verify EAS CLI is installed and logged in
If you don't have EAS CLI installed globally, install it:
```bash
npm install -g eas-cli
```
Then log in to your Expo account (`codewithharz`):
```bash
eas login
```

### 3. Run the Production Build Command
Because your `eas.json` is already perfectly configured with a `production` profile, you just need to run the build command for your target platform.

**For Android (Generates an `.aab` for the Google Play Store):**
```bash
eas build --platform android --profile production
```

**For iOS (Generates an `.ipa` for the Apple App Store):**
```bash
eas build --platform ios --profile production
```

**For Both Simultaneously:**
```bash
eas build --platform all --profile production
```

### 4. Monitor the Build
Once you run the command, EAS will upload your code and start the build on their servers. 
It will print a direct link in your terminal to your Expo Dashboard (e.g. `https://expo.dev/accounts/codewithharz/projects/afriX/builds/...`) where you can watch the progress live.

### 5. Download & Submit
When the build successfully completes, you'll be given a link to download the final binaries. 
If you want to automatically push them to the App Store / Play Store directly from your terminal, you can run:
```bash
eas submit -p android
# OR
eas submit -p ios
```

Let me know if you want me to kick off the build command for you directly from this terminal!