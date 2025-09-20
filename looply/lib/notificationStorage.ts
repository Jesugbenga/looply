import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredNotification {
  id: string;
  type: 'ride_matched' | 'ride_request' | 'ride_declined' | 'ride_accepted' | 'ride_started' | 'ride_arrived' | 'ride_completed' | 'ride_milestone' | 'system_alert';
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: string;
  read: boolean;
  rideId?: string;
  driverId?: string;
  riderId?: string;
  driverName?: string;
  riderName?: string;
}

const NOTIFICATIONS_KEY = 'user_notifications';
const UNREAD_COUNT_KEY = 'unread_notifications_count';

export const notificationStorage = {
  // Get all notifications for a user
  async getNotifications(userId: string): Promise<StoredNotification[]> {
    try {
      const key = `${NOTIFICATIONS_KEY}_${userId}`;
      const notifications = await AsyncStorage.getItem(key);
      const parsedNotifications = notifications ? JSON.parse(notifications) : [];
      return parsedNotifications;
    } catch (error) {
      return [];
    }
  },

  // Add a new notification
  async addNotification(userId: string, notification: Omit<StoredNotification, 'id' | 'timestamp' | 'read'>): Promise<void> {
    try {
      const key = `${NOTIFICATIONS_KEY}_${userId}`;
      const existingNotifications = await this.getNotifications(userId);
     
      
      const newNotification: StoredNotification = {
        ...notification,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        read: false,
      };

      const updatedNotifications = [newNotification, ...existingNotifications];
      
      // Keep only the last 100 notifications to prevent storage bloat
      const limitedNotifications = updatedNotifications.slice(0, 100);
      
      await AsyncStorage.setItem(key, JSON.stringify(limitedNotifications));
      
      // Update unread count
      await this.updateUnreadCount(userId);
      
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  },

  // Mark notification as read
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const key = `${NOTIFICATIONS_KEY}_${userId}`;
      const notifications = await this.getNotifications(userId);
      
      const updatedNotifications = notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );
      
      await AsyncStorage.setItem(key, JSON.stringify(updatedNotifications));
      await this.updateUnreadCount(userId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const key = `${NOTIFICATIONS_KEY}_${userId}`;
      const notifications = await this.getNotifications(userId);
      
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true
      }));
      
      await AsyncStorage.setItem(key, JSON.stringify(updatedNotifications));
      await this.updateUnreadCount(userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const notifications = await this.getNotifications(userId);
      return notifications.filter(notification => !notification.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  // Update unread count in storage
  async updateUnreadCount(userId: string): Promise<void> {
    try {
      const count = await this.getUnreadCount(userId);
      const key = `${UNREAD_COUNT_KEY}_${userId}`;
      await AsyncStorage.setItem(key, count.toString());
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  },

  // Clear all notifications
  async clearAllNotifications(userId: string): Promise<void> {
    try {
      const key = `${NOTIFICATIONS_KEY}_${userId}`;
      await AsyncStorage.removeItem(key);
      await this.updateUnreadCount(userId);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  },

  // Delete a specific notification
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    try {
      const key = `${NOTIFICATIONS_KEY}_${userId}`;
      const notifications = await this.getNotifications(userId);
      
      const updatedNotifications = notifications.filter(
        notification => notification.id !== notificationId
      );
      
      await AsyncStorage.setItem(key, JSON.stringify(updatedNotifications));
      await this.updateUnreadCount(userId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }
};
