# Developer Guide & Local Build Commands

## 1. Environment Setup (Android SDK & ADB)
Ensure `ANDROID_HOME` and platform tools are in your path:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
```

Verify setup:
```bash
adb devices
```

---

## 2. Local Development & Verification

From project root (`sanatan.cc.react.native`):
```bash
# Start development server
npm start

# Run directly on Android device/emulator
npx expo run:android

# Run verification checks
npm run typecheck    # npx tsc --noEmit
npm test             # Run all 27 Jest test suites
npx expo-doctor      # Verify dependencies and SDK compatibility
```

---

## 3. Local Release APK Build

To build an unsigned/signed standalone APK locally without cloud:
```bash
cd android
./gradlew :app:assembleRelease
```
Output APK: `android/app/build/outputs/apk/release/app-release.apk`

Install and launch on connected device:
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb shell monkey -p cc.sanatan.app -c android.intent.category.LAUNCHER 1
```

---

## 4. Google Play Android App Bundle (.AAB)

Before building, increment `versionCode` in:
1. `app.json` -> `expo.android.versionCode`
2. `android/app/build.gradle` -> `defaultConfig.versionCode`

Then run:
```bash
cd android
./gradlew :app:bundleRelease
```
Output Bundle: `android/app/build/outputs/bundle/release/app-release.aab`
