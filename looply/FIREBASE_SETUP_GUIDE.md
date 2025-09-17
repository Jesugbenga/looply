# 🔥 Firebase Setup Guide - Complete Instructions

## 🚨 **Current Issue**
Your Firebase is offline because the configuration environment variables are missing or undefined.

## 🛠️ **Step-by-Step Setup**

### **Step 1: Create Firebase Project**

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Click "Create a project"**
3. **Enter project name**: `looply-ride-sharing`
4. **Enable Google Analytics**: Yes (recommended)
5. **Click "Create project"**

### **Step 2: Enable Firestore Database**

1. **In your Firebase project**, go to **"Firestore Database"**
2. **Click "Create database"**
3. **Choose "Start in test mode"** (for development)
4. **Select a location** (choose closest to your users)
5. **Click "Done"**

### **Step 3: Enable Authentication**

1. **Go to "Authentication"** in your Firebase project
2. **Click "Get started"**
3. **Go to "Sign-in method" tab**
4. **Enable "Email/Password"** provider
5. **Click "Save"**

### **Step 4: Get Your Firebase Configuration**

1. **Go to Project Settings** (gear icon in left sidebar)
2. **Scroll down to "Your apps" section**
3. **Click the Web app icon** (</>)
4. **Register your app** with name: "Looply Web App"
5. **Copy the configuration object** that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "looply-ride-sharing.firebaseapp.com",
  projectId: "looply-ride-sharing",
  storageBucket: "looply-ride-sharing.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};
```

### **Step 5: Create Environment File**

**Create a file called `.env` in your `looply` folder** with this content:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

**Replace the values** with your actual Firebase configuration from Step 4.

### **Step 6: Alternative - Hardcode Configuration (For Testing)**

If you want to test immediately, you can temporarily hardcode the values in `lib/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your_actual_api_key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id"
};
```

## 🔧 **Firestore Security Rules**

After setting up Firestore, update your security rules:

1. **Go to Firestore Database > Rules**
2. **Replace the rules** with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Rides can be read by riders and drivers involved
    match /rides/{rideId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.riderId || 
         request.auth.uid == resource.data.driverId);
    }
    
    // Allow creating new rides
    match /rides/{rideId} {
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.riderId;
    }
  }
}
```

## 🧪 **Test Your Setup**

1. **Restart your Expo development server**
2. **Try to sign up** with a new account
3. **Check the console** for any Firebase errors
4. **Try to book a ride** to test Firestore

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Firebase App named '[DEFAULT]' already exists"**
**Solution**: Restart your development server

### **Issue 2: "Permission denied"**
**Solution**: Check your Firestore security rules

### **Issue 3: "Invalid API key"**
**Solution**: Double-check your environment variables

### **Issue 4: "Project not found"**
**Solution**: Verify your project ID is correct

## 📱 **Verification Steps**

1. **Check Firebase Console** - You should see your project
2. **Check Firestore** - Should show empty collections
3. **Check Authentication** - Should show enabled providers
4. **Test in app** - Sign up should work without errors

## 🎯 **Expected Result**

After completing these steps:
- ✅ Firebase connection should work
- ✅ No more offline errors
- ✅ User authentication should work
- ✅ Firestore operations should work
- ✅ App should function normally

## 📞 **Need Help?**

If you're still having issues:
1. **Check the Firebase Console** for any error messages
2. **Verify your environment variables** are correct
3. **Check the Expo logs** for specific error messages
4. **Make sure your Firebase project** is properly configured

The key is getting those environment variables set up correctly!

