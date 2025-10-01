import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork, doc, getDoc } from 'firebase/firestore';
import Constants from 'expo-constants';

// Your Firebase configuration
// Using Constants.expoConfig.extra to get values from app.config.js
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDqarQzaIGhTfysZusUdUswsUvg4j_9rhQ",
  authDomain: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "looply-3d198.firebaseapp.com",
  projectId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "looply-3d198",
  storageBucket: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "looply-3d198.firebasestorage.app",
  messagingSenderId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "328165437417",
  appId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_APP_ID || "1:328165437417:web:9879da84fe79e2209a6578",
};

// Check if Firebase is properly configured
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "your_api_key_here") {
  console.error("🚨 FIREBASE NOT CONFIGURED!");
  console.error("Please check your app.config.js Firebase configuration");
} else {
  console.log("✅ Firebase configured successfully");
  console.log("Project ID:", firebaseConfig.projectId);
}

// Initialize Firebase app safely (avoid re-initialization during hot reload)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
// Note: For Expo/React Native, auth persistence is handled automatically by Firebase
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Connection status utilities
export const connectionUtils = {
  async enableConnection() {
    try {
      await enableNetwork(db);
      console.log('Firebase connection enabled');
    } catch (error) {
      console.error('Error enabling Firebase connection:', error);
    }
  },

  async disableConnection() {
    try {
      await disableNetwork(db);
      console.log('Firebase connection disabled');
    } catch (error) {
      console.error('Error disabling Firebase connection:', error);
    }
  },

  async checkConnection() {
    try {
      // Try to read a simple document to check connection
      const testDoc = doc(db, 'test', 'connection');
      await getDoc(testDoc);
      return true;
    } catch (error) {
      console.warn('Firebase connection check failed:', error);
      return false;
    }
  }
};

export default app;
