// Load environment variables from .env and inject into Expo runtime config
// This lets `expo-constants` expose the values at `Constants.expoConfig.extra` or `Constants.manifest.extra`.
// Usage: install `dotenv` (already present in package.json) and run `expo start`.

require('dotenv').config();

module.exports = () => ({
  // ----- REQUIRED FIELDS -----
  owner: 'jesugbenga',
  slug: 'muuv',
  scheme: 'com.muuv.app',
  name: 'Muuv',
  version: '1.0.2',
  description: 'Smart ride sharing platform connecting riders and drivers for events, campus transportation, and everyday journeys.',
  
  // ----- PLUGINS -----
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/Poppins-Regular.ttf',
          './assets/fonts/Poppins-Medium.ttf',
          './assets/fonts/Poppins-SemiBold.ttf',
          './assets/fonts/Poppins-Bold.ttf'
        ]
      }
    ],
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          forceStaticLinking: ["RNFBApp", "RNFBAuth", "RNFBFirestore"],
          buildReactNativeFromSource: true,
          otherCFlags: [
            '-D_LIBCPP_ENABLE_CXX20_REMOVED_FEATURES',
            '-Wno-error=unused-command-line-argument',
            '-DGRPC_BAZEL_BUILD',
            '-Wno-unused-command-line-argument'
          ],
          otherCxxFlags: [
            '-D_LIBCPP_ENABLE_CXX20_REMOVED_FEATURES',
            '-Wno-error=unused-command-line-argument',
            '-DGRPC_BAZEL_BUILD',
            '-Wno-unused-command-line-argument'
          ],
        },
      },
    ],
  ],
  
  // ----- EXPERIMENTS -----
  experiments: {
    typedRoutes: true
  },
  
  // ----- NEW ARCHITECTURE -----
  newArchEnabled: true,
  
  // ----- EXTRA CONFIG -----
  extra: {
    projectId: '4201e2d2-43a8-4e4e-b9e5-79568546bad3',
    EXPO_PUBLIC_GEOAPIFY_API_KEY: process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY || 'a062552d381947d696ad9f10bf269368',
    EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDqarQzaIGhTfysZusUdUswsUvg4j_9rhQ',
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'looply-3d198.firebaseapp.com',
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'looply-3d198',
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'looply-3d198.firebasestorage.app',
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '328165437417',
    EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:328165437417:web:9879da84fe79e2209a6578',
    oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || '3367ba20-d39e-41e8-b2af-7bfe367e6942',
    oneSignalRestApiKey: process.env.EXPO_PUBLIC_ONESIGNAL_REST_API_KEY || 'os_v2_app_gnt3uigttza6rmvppp7dm7tjilr6stow2spuaunyndaxjf2of6ye2rdm3wahnxeic5oobnoxbbrkyg3xfghkuufubvtpzvi5owxokoi',
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '328165437417-cii1nbtgf5sd8qpt4346lleib0fi9jbr.apps.googleusercontent.com',
    router: {},
    eas: {
      projectId: '4201e2d2-43a8-4e4e-b9e5-79568546bad3'
    }
  },
  
  // ----- ICON CONFIG -----
  icon: './assets/images/icon.png',
  adaptiveIcon: {
    foregroundImage: './assets/images/adaptive-icon.png',
    backgroundColor: '#222222'
  },
  
  // ----- SPLASH SCREEN CONFIG -----
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#222222'
  },
  
  // ----- IOS CONFIG -----
  ios: {
    bundleIdentifier: 'com.muuv.app',
    buildNumber: '3',
    deploymentTarget: '18.0',
    icon: './assets/images/icon.png',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription: 'Muuv uses your location to find nearby rides, match you with drivers, and provide accurate pickup and drop-off locations for a seamless ride-sharing experience.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'Muuv uses your location to find nearby rides, match you with drivers, and provide accurate pickup and drop-off locations for a seamless ride-sharing experience.',
      NSLocationAlwaysUsageDescription: 'Muuv uses your location to find nearby rides, match you with drivers, and provide accurate pickup and drop-off locations for a seamless ride-sharing experience.',
      NSUserNotificationsUsageDescription: 'Muuv sends you notifications about ride requests, driver updates, and important ride information to keep you informed throughout your journey.'
    }
  },
  
  // ----- ANDROID CONFIG -----
  android: {
    package: 'com.muuv.app',
    versionCode: 1,
    icon: './assets/images/icon.png',
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#222222'
    }
  },
  
  // ----- WEB CONFIG -----
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png'
  }
});
