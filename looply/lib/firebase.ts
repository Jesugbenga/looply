import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork, doc, getDoc } from 'firebase/firestore';

// Your Firebase configuration
// You'll need to get this from your Firebase Console
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your_api_key_here",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your_project_id.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your_project_id_here",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your_project_id.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your_sender_id_here",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "your_app_id_here",
};

// Check if Firebase is properly configured
if (firebaseConfig.apiKey === "your_api_key_here") {
  console.error("🚨 FIREBASE NOT CONFIGURED!");
  console.error("Please follow the setup guide in FIREBASE_SETUP_GUIDE.md");
  console.error("Create a .env file with your Firebase configuration");
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
