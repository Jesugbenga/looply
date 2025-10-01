import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Alert } from 'react-native';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Constants from 'expo-constants';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { notificationService } from '../lib/notificationService';

export default function OAuth() {
  const { signIn } = useAuth();

  useEffect(() => {
    // Configure Google Sign-In
    const webClientId = Constants.expoConfig?.extra?.googleWebClientId;
    
    console.log('🔍 Debug - Web Client ID:', webClientId);
    console.log('🔍 Debug - Constants.expoConfig.extra:', Constants.expoConfig?.extra);
    
    if (!webClientId || webClientId.includes('your_web_client_id')) {
      console.warn('⚠️ Google Web Client ID not configured. Please set up Google OAuth in Google Cloud Console.');
      return;
    }
    
    GoogleSignin.configure({
      webClientId: webClientId,
      offlineAccess: true,
    });
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      console.log('🔐 Starting Google Sign-In...');
      
      const webClientId = Constants.expoConfig?.extra?.googleWebClientId;
      console.log('🔍 Google Sign-In - Web Client ID:', webClientId);
      
      if (!webClientId || webClientId.includes('your_web_client_id')) {
        Alert.alert(
          'Google Sign-In Not Configured',
          'Please complete the Google OAuth setup in Google Cloud Console. See GOOGLE_OAUTH_SETUP.md for instructions.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Ensure Google Sign-In is properly configured
      console.log('🔍 Re-configuring Google Sign-In with Web Client ID:', webClientId);
      GoogleSignin.configure({
        webClientId: webClientId,
        offlineAccess: true,
      });
      
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }
      
      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);
      
      // Sign-in the user with the credential
      const result = await signInWithCredential(auth, googleCredential);
      const user = result.user;
      
      console.log('✅ Google Sign-In successful:', user.uid);
      
      // Create or update user profile in Firestore
      const userProfile = await createOrUpdateUserProfile(user, {
        firstName: user.displayName?.split(' ')[0] || 'User',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || 'Name',
        email: user.email || '',
        userType: 'rider' // Default to rider, can be changed later
      });
      
      console.log('✅ User profile created/updated:', userProfile);
      
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      
      let errorMessage = 'Failed to sign in with Google';
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email using a different sign-in method.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid Google credentials. Please try again.';
      }
      
      Alert.alert('Google Sign-In Error', errorMessage);
    }
  };


  // Helper function to create or update user profile
  const createOrUpdateUserProfile = async (user: any, profileData: any) => {
    try {
      // Check if user profile already exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        console.log('✅ User profile already exists, updating...');
        // Update existing profile
        const existingProfile = userDoc.data();
        const updatedProfile = {
          ...existingProfile,
          firstName: profileData.firstName || existingProfile.firstName,
          lastName: profileData.lastName || existingProfile.lastName,
          email: profileData.email || existingProfile.email,
          updatedAt: new Date().toISOString(),
        };
        
        await setDoc(doc(db, 'users', user.uid), updatedProfile);
        return updatedProfile;
      } else {
        console.log('📝 Creating new user profile...');
        // Create new profile
        const newProfile = {
          uid: user.uid,
          email: profileData.email || user.email || '',
          firstName: profileData.firstName || 'User',
          lastName: profileData.lastName || 'Name',
          userType: 'rider' as const,
          savedAddresses: [],
          isDriverAvailable: false,
          lastActiveAs: 'rider' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await setDoc(doc(db, 'users', user.uid), newProfile);
        
        // Initialize OneSignal user ID for notifications
        try {
          await notificationService.initializeUserOneSignalId(user.uid);
        } catch (error) {
          console.warn('Failed to initialize OneSignal user ID:', error);
        }
        
        return newProfile;
      }
    } catch (error) {
      console.error('❌ Error creating/updating user profile:', error);
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
        <MaterialCommunityIcons name="google" size={20} color="#EA4335" style={styles.googleIcon} />
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    width: '100%',
    gap: 12,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  googleIcon: {
    marginRight: 8,
  },
  googleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
});
