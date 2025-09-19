// Load environment variables from .env and inject into Expo runtime config
// This lets `expo-constants` expose the values at `Constants.expoConfig.extra` or `Constants.manifest.extra`.
// Usage: install `dotenv` (already present in package.json) and run `expo start`.

require('dotenv').config();

const appJson = require('./app.json');

module.exports = () => {
  return {
    ...appJson,
    expo: {
      ...(appJson.expo || {}),
      extra: {
        // List the public env vars you need at runtime here
        EXPO_PUBLIC_GEOAPIFY_API_KEY: process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY,
        EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      },
    },
  };
};
