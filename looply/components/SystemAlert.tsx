import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

interface SystemAlertProps {
  visible: boolean;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  onDismiss: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  actionText?: string;
  onAction?: () => void;
}

// Helper function to convert technical error messages to user-friendly ones
const getUserFriendlyMessage = (message: string): string => {
  const errorMap: { [key: string]: string } = {
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password. Please try again',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    'auth/network-request-failed': 'Network error. Please check your connection',
    'auth/user-disabled': 'This account has been disabled',
    'auth/operation-not-allowed': 'This operation is not allowed',
    'auth/requires-recent-login': 'Please sign in again to continue',
  };

  // Check for exact matches first
  if (errorMap[message]) {
    return errorMap[message];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key)) {
      return value;
    }
  }

  // Return original message if no mapping found
  return message;
};

export default function SystemAlert({
  visible,
  type,
  title,
  message,
  onDismiss,
  autoHide = true,
  autoHideDelay = 4000,
  actionText,
  onAction,
}: SystemAlertProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));
  const [errorSlideAnim] = useState(new Animated.Value(100));

  useEffect(() => {
    if (visible) {
      // Show animation
      const isBottomPopup = type === 'error' || (type === 'success' && (title === 'Success' && message.includes('Switched to')));
      const slideAnimation = isBottomPopup
        ? Animated.timing(errorSlideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        : Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          });

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        slideAnimation,
      ]).start();

      // Auto hide if enabled
      if (autoHide) {
        const timer = setTimeout(() => {
          hideAlert();
        }, autoHideDelay);

        return () => clearTimeout(timer);
      }
    } else {
      hideAlert();
    }
  }, [visible]);

  const hideAlert = () => {
    const isBottomPopup = type === 'error' || (type === 'success' && (title === 'Success' && message.includes('Switched to')));
    const slideAnimation = isBottomPopup
      ? Animated.timing(errorSlideAnim, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        })
      : Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        });

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      slideAnimation,
    ]).start(() => {
      onDismiss();
    });
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
      // Auto-close after action
      setTimeout(() => {
        hideAlert();
      }, 100);
    }
  };

  const getAlertStyles = () => {
    switch (type) {
      case 'error':
        return {
          backgroundColor: Theme.colors.dark.surface,
          borderColor: Theme.colors.status.error,
          iconColor: Theme.colors.status.error,
          iconName: 'alert-circle' as const,
        };
      case 'warning':
        return {
          backgroundColor: Theme.colors.dark.surface,
          borderColor: Theme.colors.status.warning,
          iconColor: Theme.colors.status.warning,
          iconName: 'warning' as const,
        };
      case 'success':
        return {
          backgroundColor: Theme.colors.dark.surface,
          borderColor: Theme.colors.status.success,
          iconColor: Theme.colors.status.success,
          iconName: 'checkmark-circle' as const,
        };
      case 'info':
      default:
        return {
          backgroundColor: Theme.colors.dark.surface,
          borderColor: Theme.colors.accent.blue,
          iconColor: Theme.colors.accent.blue,
          iconName: 'information-circle' as const,
        };
    }
  };

  const alertStyles = getAlertStyles();
  
  // Convert error messages to user-friendly format
  const displayMessage = type === 'error' ? getUserFriendlyMessage(message) : message;

  if (!visible) return null;

  // For error alerts and success alerts (like profile switching), use bottom popup style
  if (type === 'error' || (type === 'success' && (title === 'Success' && message.includes('Switched to')))) {
    return (
      <Animated.View
        style={[
          styles.errorContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: errorSlideAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.errorAlert,
            {
              backgroundColor: alertStyles.backgroundColor,
              borderColor: alertStyles.borderColor,
            },
          ]}
        >
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={alertStyles.iconName}
                size={24}
                color={alertStyles.iconColor}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: alertStyles.iconColor }]}>
                {title}
              </Text>
              <Text style={styles.message}>{displayMessage}</Text>
            </View>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={hideAlert}
            >
              <Ionicons
                name="close"
                size={20}
                color={Theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>
          
          {actionText && onAction && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: alertStyles.borderColor }]}
              onPress={handleAction}
            >
              <Text style={[styles.actionText, { color: alertStyles.iconColor }]}>
                {actionText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        </View>
      </Animated.View>
    );
  }

  // For other alert types, use full-screen overlay
  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.alert,
            {
              backgroundColor: alertStyles.backgroundColor,
              borderColor: alertStyles.borderColor,
            },
          ]}
        >
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={alertStyles.iconName}
                size={24}
                color={alertStyles.iconColor}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: alertStyles.iconColor }]}>
                {title}
              </Text>
              <Text style={styles.message}>{displayMessage}</Text>
            </View>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={hideAlert}
            >
              <Ionicons
                name="close"
                size={20}
                color={Theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>
          
          {actionText && onAction && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: alertStyles.borderColor }]}
              onPress={handleAction}
            >
              <Text style={[styles.actionText, { color: alertStyles.iconColor }]}>
                {actionText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  errorContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: Theme.spacing.lg,
  },
  errorAlert: {
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    backgroundColor: Theme.colors.dark.surface,
    ...Theme.shadows.lg,
  },
  alert: {
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    backgroundColor: Theme.colors.dark.surface,
    ...Theme.shadows.lg,
  },
  alertContent: {
    padding: Theme.spacing.lg,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: Theme.spacing.md,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.semiBold,
    marginBottom: Theme.spacing.xs,
  },
  message: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    lineHeight: Theme.typography.lineHeight.normal * Theme.typography.fontSize.sm,
  },
  dismissButton: {
    padding: Theme.spacing.xs,
    marginLeft: Theme.spacing.sm,
  },
  actionButton: {
    marginTop: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionText: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
  },
});
