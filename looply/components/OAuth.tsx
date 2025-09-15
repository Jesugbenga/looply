import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Alert } from 'react-native';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function OAuth() {
  const { signIn } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      // For now, we'll show a message that Google OAuth needs to be configured
      // In a real implementation, you'd use @react-native-google-signin/google-signin
      Alert.alert(
        'Google Sign-In', 
        'Google OAuth setup required. Please use email/password for now.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  googleButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  googleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
});
