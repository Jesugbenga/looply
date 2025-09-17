# 🔥 Firebase Debug Guide - Testing Persistence

## 🚨 **The Issue You're Experiencing**

Your addresses disappear when you log out and log back in because:
1. **Firebase Auth persistence** was not properly configured
2. **AsyncStorage** was missing for React Native
3. **Data wasn't actually being saved** to Firestore

## ✅ **What I Fixed**

1. **Added AsyncStorage persistence** to Firebase Auth
2. **Added debugging logs** to track data saving/loading
3. **Improved error handling** for better troubleshooting

## 🧪 **How to Test if It's Working**

### **Step 1: Check Console Logs**

When you start your app, you should see:
```
✅ Firebase configured successfully
Project ID: your_project_id_here
```

If you see this instead:
```
🚨 FIREBASE NOT CONFIGURED!
Please follow the setup guide in FIREBASE_SETUP_GUIDE.md
```

Then your `.env` file is not set up correctly.

### **Step 2: Test Address Saving**

1. **Add an address** in the profile screen
2. **Check the console** - you should see:
   ```
   💾 Saving address for user: [user_id]
   Address data: {label: "Home", address: "123 Main St", isDefault: true}
   📝 Updating user document with addresses: [...]
   ✅ Address saved successfully to Firestore
   ```

3. **If you see errors**, they will help identify the issue

### **Step 3: Test Address Loading**

1. **Log out and log back in**
2. **Check the console** - you should see:
   ```
   🔍 Loading user profile for UID: [user_id]
   ✅ User profile loaded: {...}
   📍 Saved addresses: [...]
   ```

3. **Addresses should persist** between sessions

### **Step 4: Check Firebase Console**

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Select your project**
3. **Go to Firestore Database**
4. **Look for a `users` collection**
5. **Check if your user document has `savedAddresses` field**

## 🔍 **Common Issues & Solutions**

### **Issue 1: "Firebase not configured"**
**Solution**: Check your `.env` file has the correct Firebase configuration

### **Issue 2: "User document not found"**
**Solution**: The user profile wasn't created during sign-up. Try signing up again.

### **Issue 3: "Permission denied"**
**Solution**: Check your Firestore security rules

### **Issue 4: "Network error"**
**Solution**: Check your internet connection and Firebase project status

## 📱 **Expected Behavior After Fix**

1. **Add address** → Console shows successful save
2. **Log out** → User session ends
3. **Log back in** → Console shows address loading
4. **Addresses persist** → They appear in profile and ride booking

## 🚀 **Next Steps**

1. **Restart your app** to apply the changes
2. **Check the console logs** for the debugging messages
3. **Test adding an address** and verify it saves
4. **Test logging out/in** to verify persistence
5. **Check Firebase Console** to see the data

The debugging logs will help us identify exactly where the issue is if addresses still don't persist!
