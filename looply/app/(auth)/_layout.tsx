import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return null; // or a loading spinner
  }

  // If user is already signed in, redirect to the main app
  if (user) {
    return <Redirect href={'/'} />;
  }

  // If not signed in, show the auth screens
  return <Stack />;
}