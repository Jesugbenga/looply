<div align="center">

# Muuv

Privacy-first ride sharing app built with Expo + React Native.

</div>

## Quick Start

1) Install dependencies

```bash
npm install
```

2) Run the app (clears bundler cache)

```bash
npx expo start --clear
```

## Configuration (High-level)

- App configuration lives in `app.config.js`.
- Firebase config is read in `lib/firebase.ts` from `Constants.expoConfig.extra`.
- Do not commit secrets in this repo. Use environment variables or your CI secrets store.

### Firebase

Required steps in your own Firebase project:
- Enable Authentication providers you intend to use (e.g., Google, Email/Password).
- Add your iOS and Android apps in Firebase settings and download platform files as needed.

### Google Sign-In

In Google Cloud Console (for your project):
- Create an OAuth 2.0 Web client and use its Client ID in `app.config.js` (as `extra.googleWebClientId`).
- Create an Android client for your package name. Add your own signing certificate fingerprints in your Google/Play console (do not store them in README).

### iOS

- Bundle identifier configured in `app.config.js`.
- Apple Sign-In is currently disabled in this project template.

## Build & Submit (EAS)

Install EAS CLI and login:

```bash
npm i -g @expo/eas-cli
eas login
eas build:configure
```

Builds:

```bash
# Android
eas build --platform android --profile development
eas build --platform android --profile production

# iOS
eas build --platform ios --profile development
eas build --platform ios --profile production
```

Submit:

```bash
eas submit --platform android
eas submit --platform ios
```

## Troubleshooting

- Google sign-in configuration errors typically indicate a mismatch between your app identifiers and console configuration. Re-check client IDs and signing configs.
- If Firebase reports invalid API key, ensure values are correctly supplied via `app.config.js` and are from your Firebase project.
- Clear caches when configs change:

```bash
npx expo start --clear
npx expo run:android --clear-cache
```

## Slides (Suggested Outline)

- Problem & Opportunity
- Solution Overview (Muuv)
- Key Features
- Demo Flow (Auth → Request → Match → Trip)
- Architecture (Expo RN, Firebase, Notifications)
- Security & Privacy
- Roadmap + Call to Action


