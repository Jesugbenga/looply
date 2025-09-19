import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OAuth from '../../components/OAuth';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Theme } from '@/constants/Theme';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSignInPress = async () => {
    if (!emailAddress || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(emailAddress, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.log('Sign in error:', JSON.stringify(err, null, 2));
      Alert.alert('Error', err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            {/* <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity> */} 
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#9CA3AF" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, loading && styles.buttonDisabled]}
              onPress={onSignInPress}
              disabled={loading || !emailAddress || !password}
            >
              <Text style={styles.signInButtonText}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Sign In Options */}
            <View style={styles.socialButtons}>
              <OAuth />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.dark.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Theme.spacing['2xl'],
    paddingTop: Theme.spacing['2xl'],
  },
  header: {
    paddingTop: Theme.spacing['5xl'],
    paddingBottom: Theme.spacing['2xl'],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.dark.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  titleSection: {
    marginBottom: Theme.spacing['3xl'],
  },
  title: {
    fontSize: Theme.typography.fontSize['4xl'],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  subtitle: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.secondary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: Theme.spacing.xl,
  },
  nameRow: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.xl,
  },
  label: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.dark.surfaceVariant,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.lg,
    ...Theme.shadows.sm,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  nameInput: {
    backgroundColor: Theme.colors.dark.surfaceVariant,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.lg,
    height: 50,
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.primary,
    ...Theme.shadows.sm,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  inputIcon: {
    marginLeft: Theme.spacing.xs,
  },
  eyeIcon: {
    padding: Theme.spacing.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Theme.spacing['2xl'],
  },
  forgotPasswordText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.primary[500],
    fontWeight: Theme.typography.fontWeight.medium,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  signInButton: {
    backgroundColor: Theme.colors.primary[500],
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: Theme.spacing['2xl'],
  },
  signUpButton: {
    backgroundColor: Theme.colors.primary[500],
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: Theme.spacing['2xl'],
  },
  signInButtonText: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.semiBold,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  signUpButtonText: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.semiBold,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  buttonDisabled: {
    backgroundColor: Theme.colors.text.tertiary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing['2xl'],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.dark.border,
  },
  dividerText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.tertiary,
    marginHorizontal: Theme.spacing.lg,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing['3xl'],
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.dark.surfaceVariant,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.sm,
  },
  socialButtonText: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
  },
  footerText: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.secondary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  footerLink: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.primary[500],
    fontWeight: Theme.typography.fontWeight.medium,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  termsContainer: {
    marginBottom: Theme.spacing['2xl'],
  },
  termsText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: Theme.typography.lineHeight.relaxed * Theme.typography.fontSize.sm,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  termsLink: {
    color: Theme.colors.primary[500],
    fontWeight: Theme.typography.fontWeight.medium,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  // Verification styles
  verificationContainer: {
    flex: 1,
    paddingHorizontal: Theme.spacing['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.colors.primary[500] + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing['3xl'],
  },
  verificationTitle: {
    fontSize: Theme.typography.fontSize['2xl'],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamily.bold,
  },
  verificationSubtitle: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: Theme.spacing['3xl'],
    fontFamily: Theme.typography.fontFamily.regular,
  },
  codeInput: {
    backgroundColor: Theme.colors.dark.surfaceVariant,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.lg,
    height: 60,
    fontSize: Theme.typography.fontSize['2xl'],
    fontWeight: Theme.typography.fontWeight.semiBold,
    color: Theme.colors.text.primary,
    letterSpacing: 8,
    ...Theme.shadows.sm,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  verifyButton: {
    backgroundColor: Theme.colors.primary[500],
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing['3xl'],
    borderRadius: Theme.borderRadius.lg,
    marginTop: Theme.spacing['2xl'],
    minWidth: 200,
  },
  verifyButtonText: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.semiBold,
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  resendButton: {
    marginTop: Theme.spacing.lg,
  },
  resendButtonText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.primary[500],
    fontWeight: Theme.typography.fontWeight.medium,
    fontFamily: Theme.typography.fontFamily.medium,
  },
});