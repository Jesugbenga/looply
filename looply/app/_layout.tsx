import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from '@/store';
import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { loadStoredAuth } from '@/store/authSlice';
import { AuthProvider } from '@/contexts/AuthContext';
import { RefreshProvider } from '@/contexts/RefreshContext';
import { OneSignalProvider } from '@/contexts/OneSignalContext';
import { AlertProvider } from '@/contexts/AlertContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });

  // Load stored auth on app startup so auth state persists across reloads.
  // Use the store directly here so we don't call React-Redux hooks before Provider is mounted.
  useEffect(() => {
    store.dispatch(loadStoredAuth());
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <OneSignalProvider>
        <RefreshProvider>
          <AlertProvider>
            <NotificationProvider>
              <Provider store={store}>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <Slot />
                  <StatusBar style="auto" />
                </ThemeProvider>
              </Provider>
            </NotificationProvider>
          </AlertProvider>
        </RefreshProvider>
      </OneSignalProvider>
    </AuthProvider>
  );
}