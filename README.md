# React Native In-App Purchases Demo

<div align="center">

[![iaptic](https://img.shields.io/badge/powered%20by-iaptic-blue)](https://www.iaptic.com)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey)]()
[![React Native](https://img.shields.io/badge/React%20Native-v0.76-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

</div>

A production-ready demonstration of implementing in-app purchases in React Native using [iaptic](https://www.iaptic.com) for receipt validation.

## Overview

This demo implements a complete in-app purchase flow with server-side receipt validation:

✨ **Secure**: Server-side validation with iaptic  
🔄 **Reliable**: Full purchase restoration support  
🎮 **Interactive**: Token-based consumable system  
📱 **Production-Ready**: Error handling and state management

## Requirements

- Node.js 16 or newer
- npm or yarn package manager
- React Native development environment
- [iaptic](https://www.iaptic.com) account credentials
- iOS Developer Account with IAP enabled
- Android Developer Account with IAP enabled (for Android)

## Quick Setup

```bash
# Install dependencies
npm install
# OR using yarn
yarn install

# Configure iaptic credentials
cp src/Config-example.ts src/Config.ts
```

### iOS Setup

1. Configure your products in App Store Connect
2. Run the app:
```bash
npm run ios
# OR using yarn
yarn ios
```

### Android Setup

1. Configure your products in Google Play Console
2. Make sure you have:
   - A Google Play Developer account
   - An app created in Google Play Console
   - In-app products configured
   - A test account added to the app's testers

3. Update your Android configuration:
   - Verify your `android/app/build.gradle` has the billing permission:
     ```gradle
     android {
         ...
         defaultConfig {
             ...
             manifestPlaceholders = [
                 ...
                 BILLING_KEY: "your_license_key_from_play_console"
             ]
         }
     }
     ```

4. Run the app:
```bash
# Method 1: Using Gradle directly (recommended)
cd android
./gradlew clean
./gradlew installPlayDebug
cd ..

cd android && ./gradlew clean && ./gradlew installPlayDebug && cd ..

# Method 2: Using React Native CLI
cd android
./gradlew clean
cd ..
yarn android --appVariant=playDebug
# OR using npm
npm run android -- --appVariant=playDebug
```

Note: The project uses multiple build variants. Always specify `playDebug` variant to ensure proper Google Play Store integration.

### Common Android Issues
1. **Build Variant Errors**: 
   - If you see "Task 'app:installDebug' not found" or similar
   - Use `installPlayDebug` instead of `installDebug`
   - Or specify `--appVariant=playDebug` with React Native CLI

2. **Package Manager Issues**:
   - If `yarn` command is not found, install it first:
     ```bash
     npm install -g yarn
     ```
   - Or use npm commands as alternatives

3. **Runtime Errors**:
   - Verify billing permission in manifest (already added)
   - Check Play Store is installed and up to date
   - Ensure test account is properly set up
   - Verify product IDs match exactly

4. **Testing**:
   - Use a real device (not emulator)
   - Sign in with a test account
   - Make sure the app is signed with the correct key
   - Verify you're using the correct product IDs

For detailed setup and troubleshooting, visit [iaptic.com](https://www.iaptic.com).

## Architecture

The demo is built with:

- [react-native-iaptic](https://github.com/iaptic/react-native-iaptic) - Iaptic SDK (subscription UI, entitlements, validation)
- [@iaptic/react-native-iap](https://github.com/iaptic/react-native-iap) - Store interactions (Iaptic fork, GPBL V9)
- [iaptic](https://www.iaptic.com) - Receipt validation
- TypeScript - Type-safe implementation

### Key Components

```
src/
├── IapService.ts     # Purchase and validation logic
├── Config.ts         # iaptic configuration
└── TokenManager.ts   # Consumable handling example
```

## Documentation

- [iaptic Integration Guide](https://www.iaptic.com/documentation)
- [@iaptic/react-native-iap (fork)](https://github.com/iaptic/react-native-iap)

## Support

### iOS Setup
- Configure products in App Store Connect
- Use sandbox account for testing

### Android Setup
- Configure products in Google Play Console
- Use a test account from your testers list
- Verify your app signing key matches Play Console
- Make sure billing permission is properly set
- Test with a real device (emulators may have issues)

### Common Android Issues
1. **Build Errors**: 
   - Clean the project: `cd android && ./gradlew clean`
   - Verify React Native version compatibility
   - Check Android SDK version in `build.gradle`

2. **Runtime Errors**:
   - Verify billing permission in manifest
   - Check Play Store is installed and up to date
   - Ensure test account is properly set up
   - Verify product IDs match exactly

3. **Testing**:
   - Use a real device (not emulator)
   - Sign in with a test account
   - Make sure the app is signed with the correct key
   - Verify you're using the correct product IDs

For detailed setup and troubleshooting, visit [iaptic.com](https://www.iaptic.com).
