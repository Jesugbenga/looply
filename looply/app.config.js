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
  version: '1.0.0',
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
    router: {},
    eas: {
      projectId: '4201e2d2-43a8-4e4e-b9e5-79568546bad3'
    }
  },
  
  // ----- IOS CONFIG -----
  ios: {
    bundleIdentifier: 'com.muuv.app',
    buildNumber: '1',
    deploymentTarget: '18.0',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  
  // ----- ANDROID CONFIG -----
  android: {
    package: 'com.muuv.app',
    versionCode: 1
  },
  
  // ----- WEB CONFIG -----
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png'
  }
});
