import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Provider } from 'react-redux';
import { store } from '@/store';
import HomeScreen from '@/screens/HomeScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

export default function Home() {
  const { user, userProfile, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };


  if (!user) {
    return (
      <Provider store={store}>
        <SafeAreaView style={styles.container}>
          <View style={styles.authContainer}>
            <Text style={styles.authTitle}>Welcome to Muuv</Text>
            <Text style={styles.authSubtitle}>Your ride-sharing companion</Text>
            <View style={styles.authButtons}>
              <Link href="/(auth)/sign-in" asChild>
                <TouchableOpacity style={styles.authButton}>
                  <Text style={styles.authButtonText}>Sign In</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/(auth)/sign-up" asChild>
                <TouchableOpacity style={[styles.authButton, styles.authButtonSecondary]}>
                  <Text style={[styles.authButtonText, styles.authButtonTextSecondary]}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </SafeAreaView>
      </Provider>
    );
  }

  return (
    <Provider store={store}>
      <SafeAreaView style={styles.container}>
        <View style={styles.topSpacing} />
        <HomeScreen />
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.dark.background,
  },
  topSpacing: {
    height: Theme.spacing['2xl'],
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing['2xl'],
  },
  authTitle: {
    fontSize: Theme.typography.fontSize['4xl'],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing['4xl'],
    textAlign: 'center',
  },
  authButtons: {
    width: '100%',
    gap: Theme.spacing.md,
  },
  authButton: {
    backgroundColor: Theme.colors.primary[500],
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
  },
  authButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Theme.colors.dark.border,
  },
  authButtonText: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
  },
  authButtonTextSecondary: {
    color: Theme.colors.text.secondary,
  },
});