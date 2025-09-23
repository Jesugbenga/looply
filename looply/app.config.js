// Load environment variables from .env and inject into Expo runtime config
// This lets `expo-constants` expose the values at `Constants.expoConfig.extra` or `Constants.manifest.extra`.
// Usage: install `dotenv` (already present in package.json) and run `expo start`.

require('dotenv').config();
const appJson = require('./app.json');

module.exports = () => ({
  // ----- REQUIRED FIELDS -----
  owner: 'jesugbenga',                          // 👈 Your Expo account or org name
  slug: 'muuv',                                  // 👈 Your project slug
  // 👇 Optional: EAS project ID (this is the UUID shown in the EAS error)
  extra: {
    projectId: '4201e2d2-43a8-4e4e-b9e5-79568546bad3',   // 👈 Optional

    // ----- YOUR PUBLIC ENV VARS -----
    EXPO_PUBLIC_GEOAPIFY_API_KEY: process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY,
    EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
    oneSignalRestApiKey: process.env.EXPO_PUBLIC_ONESIGNAL_REST_API_KEY,
  },

  // ----- SPREAD ANY OTHER SETTINGS FROM app.json -----
  ...appJson.expo,
  
  // ----- APP STORE REQUIREMENTS -----
  ios: {
    ...appJson.expo.ios,
    usesGoogleMaps: true,
    infoPlist: {
      ...appJson.expo.ios?.infoPlist,
      ITSAppUsesNonExemptEncryption: false
    }
  },
});
