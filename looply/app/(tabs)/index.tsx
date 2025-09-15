import React from 'react';
import { StyleSheet, View, Text } from "react-native";
import { Provider } from 'react-redux';
import { store } from '@/store';
import HomeScreen from '@/screens/HomeScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'expo-router';

export default function Home() {
  const { user, userProfile, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <Provider store={store}>
      <SafeAreaView style={styles.container}>
        {user ? (
          <>
            <Text>Hello {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : user.email}</Text>
            <Text>You are a {userProfile?.userType || 'user'}</Text>
            {/* <Text onPress={handleSignOut} style={{ color: 'blue', marginTop: 10 }}>
              Sign Out
            </Text> */}
            <HomeScreen />
          </>
        ) : (
          <>
            <Link href="/(auth)/sign-in">
              <Text>Sign in</Text>
            </Link>
            <Link href="/(auth)/sign-up">
              <Text>Sign up</Text>
            </Link>
          </>
        )}
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});