import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useNotifications } from '@/contexts/NotificationContext';
import { Theme } from '@/constants/Theme';

interface NotificationButtonProps {
  size?: number;
  color?: string;
}

export default function NotificationButton({ 
  size = 24, 
  color = Theme.colors.text.tertiary 
}: NotificationButtonProps) {
  const { unreadCount } = useNotifications();

  const handlePress = () => {
    router.push('/notifications');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
    >
      <Ionicons name="notifications-outline" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius['2xl'],
    backgroundColor: Theme.colors.dark.surfaceVariant,
    ...Theme.shadows.sm,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Theme.colors.status.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.dark.background,
  },
  badgeText: {
    color: Theme.colors.text.primary,
    fontSize: 10,
    fontWeight: Theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
});
