# 📱 OneSignal Integration Guide

This guide shows how to integrate OneSignal push notifications with the rideshare matching system.

## 🔧 Setup

### 1. Install OneSignal

```bash
npm install react-native-onesignal
```

### 2. Configure OneSignal

Add to your `.env` file:
```env
EXPO_PUBLIC_ONESIGNAL_APP_ID=your_onesignal_app_id_here
EXPO_PUBLIC_ONESIGNAL_REST_API_KEY=your_rest_api_key_here
```

### 3. Initialize OneSignal

Create `lib/oneSignal.ts`:

```typescript
import { OneSignal } from 'react-native-onesignal';

// Initialize OneSignal
OneSignal.initialize(process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID!);

// Request notification permission
OneSignal.Notifications.requestPermission(true);

// Get user ID for targeting
export const getOneSignalUserId = async (): Promise<string | null> => {
  try {
    const deviceState = await OneSignal.User.getOnesignalId();
    return deviceState;
  } catch (error) {
    console.error('Error getting OneSignal user ID:', error);
    return null;
  }
};

// Send notification to specific user
export const sendNotification = async (
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<void> => {
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.EXPO_PUBLIC_ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
        include_player_ids: [userId],
        headings: { en: title },
        contents: { en: message },
        data: data || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`OneSignal API error: ${response.status}`);
    }

    console.log('✅ Notification sent successfully');
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    throw error;
  }
};
```

## 🔄 Update Firebase Utils

Update `lib/firebaseUtils.ts` to use OneSignal:

```typescript
import { sendNotification } from './oneSignal';

// Update the rideMatchingService.notifyDriver method
export const rideMatchingService = {
  // ... existing methods ...

  // Send notification to driver (with OneSignal integration)
  async notifyDriver(driverId: string, rideId: string, riderName: string): Promise<void> {
    try {
      // Get driver's OneSignal user ID from their profile
      const driverProfile = await driverUtils.getDriverProfile(driverId);
      if (!driverProfile?.oneSignalUserId) {
        console.warn('Driver OneSignal user ID not found');
        return;
      }

      await sendNotification(
        driverProfile.oneSignalUserId,
        'New Ride Request',
        `${riderName} is requesting a ride. Tap to view details.`,
        {
          rideId,
          riderName,
          type: 'ride_request'
        }
      );
    } catch (error) {
      console.error('Error notifying driver:', error);
      throw error;
    }
  },
};
```

## 👤 User Profile Updates

Add OneSignal user ID to user profiles:

```typescript
// Update UserProfile interface
export interface UserProfile {
  // ... existing fields ...
  oneSignalUserId?: string;
}

// Update driver profile creation
export const driverUtils = {
  async createDriverProfile(userId: string, driverData: Omit<DriverProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Get OneSignal user ID
      const oneSignalUserId = await getOneSignalUserId();
      
      const driverProfilesCollection = collection(db, 'driverProfiles');
      const docRef = await addDoc(driverProfilesCollection, {
        ...driverData,
        oneSignalUserId, // Add OneSignal user ID
        availableSeats: driverData.seats,
        rating: driverData.rating || 5.0,
        recentLoadCount: 0,
        lastLoadReset: new Date().toISOString(),
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating driver profile:', error);
      throw error;
    }
  },
};
```

## 📱 Notification Types

### Ride Request Notification

```typescript
const sendRideRequestNotification = async (driverId: string, rideId: string, riderName: string) => {
  await sendNotification(
    driverId,
    'New Ride Request',
    `${riderName} is requesting a ride to the event.`,
    {
      rideId,
      riderName,
      type: 'ride_request',
      action: 'view_ride'
    }
  );
};
```

### Ride Accepted Notification

```typescript
const sendRideAcceptedNotification = async (riderId: string, driverName: string, carDescription: string) => {
  await sendNotification(
    riderId,
    'Ride Accepted!',
    `${driverName} has accepted your ride request. ${carDescription}`,
    {
      type: 'ride_accepted',
      driverName,
      carDescription,
      action: 'view_ride'
    }
  );
};
```

### Ride Status Updates

```typescript
const sendRideStatusNotification = async (userId: string, status: string, details: string) => {
  const statusMessages = {
    'in-progress': 'Your ride has started!',
    'completed': 'Ride completed. Thank you!',
    'cancelled': 'Ride was cancelled.',
  };

  await sendNotification(
    userId,
    'Ride Update',
    statusMessages[status] || details,
    {
      type: 'ride_status',
      status,
      action: 'view_ride'
    }
  );
};
```

## 🔔 Notification Handling

### Handle Incoming Notifications

```typescript
import { OneSignal } from 'react-native-onesignal';

// Set up notification handlers
OneSignal.Notifications.addEventListener('click', (event) => {
  const data = event.notification.additionalData;
  
  switch (data?.type) {
    case 'ride_request':
      // Navigate to ride request screen
      console.log('Opening ride request:', data.rideId);
      break;
    case 'ride_accepted':
      // Navigate to ride details screen
      console.log('Ride accepted by:', data.driverName);
      break;
    case 'ride_status':
      // Update ride status in UI
      console.log('Ride status update:', data.status);
      break;
  }
});
```

### Background Notification Handling

```typescript
// Handle notifications when app is in background
OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
  // Customize notification display
  event.preventDefault();
  
  // Show custom in-app notification
  showInAppNotification(event.notification);
});
```

## 🧪 Testing Notifications

### Test Notification Sending

```typescript
const testNotifications = async () => {
  try {
    // Test basic notification
    await sendNotification(
      'test-user-id',
      'Test Notification',
      'This is a test notification from the rideshare app.',
      { type: 'test' }
    );
    
    console.log('✅ Test notification sent');
  } catch (error) {
    console.error('❌ Test notification failed:', error);
  }
};
```

### Test Ride Flow Notifications

```typescript
const testRideFlowNotifications = async () => {
  try {
    // Simulate ride request
    await sendRideRequestNotification('driver123', 'ride456', 'John Doe');
    
    // Simulate ride acceptance
    await sendRideAcceptedNotification('rider123', 'Jane Smith', 'Silver Toyota Camry');
    
    // Simulate ride completion
    await sendRideStatusNotification('rider123', 'completed', 'Ride completed successfully!');
    
    console.log('✅ Ride flow notifications sent');
  } catch (error) {
    console.error('❌ Ride flow notifications failed:', error);
  }
};
```

## 📊 Notification Analytics

### Track Notification Performance

```typescript
const trackNotificationMetrics = async (notificationId: string) => {
  try {
    const response = await fetch(`https://onesignal.com/api/v1/notifications/${notificationId}`, {
      headers: {
        'Authorization': `Basic ${process.env.EXPO_PUBLIC_ONESIGNAL_REST_API_KEY}`,
      },
    });
    
    const data = await response.json();
    console.log('Notification metrics:', {
      sent: data.recipients,
      delivered: data.successful,
      failed: data.failed,
      clicked: data.converted
    });
  } catch (error) {
    console.error('Error tracking notification metrics:', error);
  }
};
```

## 🔧 Configuration Options

### Customize Notification Appearance

```typescript
const sendCustomNotification = async (
  userId: string,
  title: string,
  message: string,
  options: {
    sound?: string;
    badge?: number;
    priority?: 'high' | 'normal';
    ttl?: number; // Time to live in seconds
  } = {}
) => {
  await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${process.env.EXPO_PUBLIC_ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
      include_player_ids: [userId],
      headings: { en: title },
      contents: { en: message },
      android_sound: options.sound || 'default',
      ios_sound: options.sound || 'default',
      android_badge: options.badge,
      ios_badge: options.badge,
      priority: options.priority || 'high',
      ttl: options.ttl || 3600, // 1 hour default
    }),
  });
};
```

## 🚀 Production Deployment

### Environment Setup

1. **Development**: Use test OneSignal app
2. **Staging**: Use staging OneSignal app  
3. **Production**: Use production OneSignal app

### Security Considerations

- Store API keys securely
- Use environment variables
- Implement rate limiting
- Validate notification data
- Monitor notification abuse

### Performance Optimization

- Batch notifications when possible
- Use notification scheduling for non-urgent messages
- Implement notification queuing
- Monitor delivery rates
- Optimize notification content

This integration provides a complete push notification system for the rideshare matching platform! 📱✨
