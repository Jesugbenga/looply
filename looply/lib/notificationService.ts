import { sendNotification, getOneSignalUserId } from './oneSignal';
import { userUtils } from './userUtils';
import { Ride } from './types';
import { notificationStorage, StoredNotification } from './notificationStorage';

export interface NotificationData {
  type: 'ride_matched' | 'ride_request' | 'ride_declined' | 'ride_accepted' | 'ride_started' | 'ride_arrived' | 'ride_completed' | 'ride_milestone' | 'system_alert';
  rideId?: string;
  driverId?: string;
  riderId?: string;
  driverName?: string;
  riderName?: string;
  action?: string;
  [key: string]: any;
}

export const notificationService = {
  // Send notification to user by their Firebase UID
  async sendNotificationToUser(
    firebaseUid: string,
    title: string,
    message: string,
    data: NotificationData
  ): Promise<void> {
    try {
      // Store notification locally first
      await this.storeNotificationLocally(firebaseUid, {
        type: data.type,
        title,
        message,
        data,
        rideId: data.rideId,
        driverId: data.driverId,
        riderId: data.riderId,
        driverName: data.driverName,
        riderName: data.riderName,
      });

      // Get user's OneSignal ID from their profile
      const userProfile = await userUtils.getUserProfile(firebaseUid);
      if (!userProfile?.oneSignalUserId) {
        console.warn(`No OneSignal ID found for user ${firebaseUid}`);
        return;
      }

      await sendNotification(userProfile.oneSignalUserId, title, message, data);

    } catch (error) {
      console.error(`Error in sendNotificationToUser:`, error);
      throw error;
    }
  },

  // Store notification locally
  async storeNotificationLocally(
    userId: string,
    notification: Omit<StoredNotification, 'id' | 'timestamp' | 'read'>
  ): Promise<void> {
    try {
      await notificationStorage.addNotification(userId, notification);
      // Update unread count after storing
      await notificationStorage.updateUnreadCount(userId);
    } catch (error) {
      console.error('Error storing notification locally:', error);
    }
  },

  // Send notification to user by their OneSignal ID
  async sendNotificationToOneSignalUser(
    oneSignalUserId: string,
    title: string,
    message: string,
    data: NotificationData
  ): Promise<void> {
    try {
      await sendNotification(oneSignalUserId, title, message, data);
      console.log(`✅ Notification sent to OneSignal user ${oneSignalUserId}: ${title}`);
    } catch (error) {
      console.error('Error sending notification to OneSignal user:', error);
      throw error;
    }
  },

  // Ride matched - notify rider
  async notifyRiderMatched(ride: Ride): Promise<void> {
    if (!ride.riderId) return;

    const title = 'Ride Matched! 🎉';
    const message = `Your ride has been matched with a driver. They will contact you soon.`;
    
    await this.sendNotificationToUser(ride.riderId, title, message, {
      type: 'ride_matched',
      rideId: ride.id,
      driverId: ride.driverId,
      driverName: ride.driverName,
      action: 'view_ride'
    });
  },

  // Ride request - notify driver
  async notifyDriverRideRequest(ride: Ride, driverId: string): Promise<void> {
    const title = 'New Ride Request! 🚗';
    const message = `${ride.riderName} needs a ride to ${ride.event}. Tap to accept or decline.`;
    
    await this.sendNotificationToUser(driverId, title, message, {
      type: 'ride_request',
      rideId: ride.id,
      riderId: ride.riderId,
      riderName: ride.riderName,
      action: 'view_request'
    });
  },

  // Ride declined - notify rider
  async notifyRiderDeclined(ride: Ride): Promise<void> {
    if (!ride.riderId) return;

    const title = 'Ride Declined';
    const message = 'Unfortunately, your ride request was declined. We\'re looking for another driver.';
    
    await this.sendNotificationToUser(ride.riderId, title, message, {
      type: 'ride_declined',
      rideId: ride.id,
      action: 'book_again'
    });
  },

  // Ride accepted - notify rider
  async notifyRiderAccepted(ride: Ride): Promise<void> {
    if (!ride.riderId) return;

    const title = 'Ride Accepted! ✅';
    const message = `${ride.driverName} has accepted your ride. They will contact you soon.`;
    
    await this.sendNotificationToUser(ride.riderId, title, message, {
      type: 'ride_accepted',
      rideId: ride.id,
      driverId: ride.driverId,
      driverName: ride.driverName,
      action: 'view_ride'
    });
  },

  // Ride started - notify rider
  async notifyRiderStarted(ride: Ride): Promise<void> {
    if (!ride.riderId) return;

    const title = 'Ride Started! 🚗';
    const message = `${ride.driverName} is on their way to pick you up.`;
    
    await this.sendNotificationToUser(ride.riderId, title, message, {
      type: 'ride_started',
      rideId: ride.id,
      driverId: ride.driverId,
      driverName: ride.driverName,
      action: 'track_ride'
    });
  },

  // Driver arrived - notify rider
  async notifyRiderArrived(ride: Ride): Promise<void> {
    if (!ride.riderId) return;

    const title = 'Driver Arrived! 📍';
    const message = `${ride.driverName} has arrived at your location.`;
    
    await this.sendNotificationToUser(ride.riderId, title, message, {
      type: 'ride_arrived',
      rideId: ride.id,
      driverId: ride.driverId,
      driverName: ride.driverName,
      action: 'view_ride'
    });
  },

  // Ride completed - notify both rider and driver
  async notifyRideCompleted(ride: Ride): Promise<void> {
    const title = 'Ride Completed! 🎉';
    const message = 'Your ride has been completed. Thank you for using Muuv!';
    
    // Notify rider
    if (ride.riderId) {
      await this.sendNotificationToUser(ride.riderId, title, message, {
        type: 'ride_completed',
        rideId: ride.id,
        driverId: ride.driverId,
        driverName: ride.driverName,
        action: 'rate_ride'
      });
    }

    // Notify driver
    if (ride.driverId) {
      await this.sendNotificationToUser(ride.driverId, title, message, {
        type: 'ride_completed',
        rideId: ride.id,
        riderId: ride.riderId,
        riderName: ride.riderName,
        action: 'view_ride'
      });
    }
  },

  // Milestone notification for riders (every 5th ride)
  async notifyRiderMilestone(riderId: string, rideCount: number): Promise<void> {
    const title = 'Thank You! 🙏';
    const message = `You've completed ${rideCount} rides! Thank you for being a valued Muuv rider.`;
    
    await this.sendNotificationToUser(riderId, title, message, {
      type: 'ride_milestone',
      milestone: 'rider',
      count: rideCount,
      action: 'view_profile'
    });
  },

  // Milestone notification for drivers (every 5th drive)
  async notifyDriverMilestone(driverId: string, driveCount: number): Promise<void> {
    const title = 'Thank You! 🙏';
    const message = `You've completed ${driveCount} drives! Thank you for volunteering to help riders.`;
    
    await this.sendNotificationToUser(driverId, title, message, {
      type: 'ride_milestone',
      milestone: 'driver',
      count: driveCount,
      action: 'view_profile'
    });
  },

  // System alert notifications
  async notifySystemAlert(
    userId: string,
    title: string,
    message: string,
    alertType: 'error' | 'warning' | 'info' | 'success'
  ): Promise<void> {
    await this.sendNotificationToUser(userId, title, message, {
      type: 'system_alert',
      alertType,
      action: 'dismiss'
    });
  },

  // Check and send milestone notifications
  async checkAndSendMilestoneNotifications(userId: string, userType: 'rider' | 'driver'): Promise<void> {
    try {
      // Get user's ride history
      const { rideUtils } = await import('./rideUtils');
      const rides = await rideUtils.getUserRides(userId, userType);
      
      // Count completed rides
      const completedRides = rides.filter(ride => ride.status === 'completed').length;
      
      // Check if it's a milestone (multiple of 5)
      if (completedRides > 0 && completedRides % 5 === 0) {
        if (userType === 'rider') {
          await this.notifyRiderMilestone(userId, completedRides);
        } else {
          await this.notifyDriverMilestone(userId, completedRides);
        }
      }
    } catch (error) {
      console.error('Error checking milestone notifications:', error);
    }
  },

  // Initialize OneSignal user ID for current user
  async initializeUserOneSignalId(userId: string): Promise<void> {
    try {
      const oneSignalUserId = await getOneSignalUserId();
      if (oneSignalUserId) {
        await userUtils.updateOneSignalUserId(userId, oneSignalUserId);
        console.log('✅ OneSignal user ID initialized for user:', userId);
      }
    } catch (error) {
      console.error('Error initializing OneSignal user ID:', error);
    }
  }
};
