import { OneSignal } from 'react-native-onesignal';
import Constants from 'expo-constants';

function readOneSignalConfig() {
  // Try runtime config (expo) first, then fall back to process.env
  const C: any = Constants as any;
  const extras = C.expoConfig?.extra ?? C.manifest?.extra ?? C.expo?.extra ?? C.default?.extra ?? {};
  const appId = extras?.oneSignalAppId || process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || extras?.EXPO_PUBLIC_ONESIGNAL_APP_ID;
  const restApiKey = extras?.oneSignalRestApiKey || process.env.EXPO_PUBLIC_ONESIGNAL_REST_API_KEY || extras?.EXPO_PUBLIC_ONESIGNAL_REST_API_KEY;
  return { appId, restApiKey };
}

// Log presence (but not the actual values) to help debug env loading during development
try {
  const { appId, restApiKey } = readOneSignalConfig();
  console.log('OneSignal config loaded:', {
    appIdPresent: Boolean(appId),
    restApiKeyPresent: Boolean(restApiKey),
    // show where extras exist
    extrasPresent: Boolean((Constants as any).expoConfig?.extra || (Constants as any).manifest?.extra),
  });
} catch (e) {
  // ignore errors in logging; keep initialization resilient
}

// Initialize OneSignal
const initializeOneSignal = () => {
  const { appId } = readOneSignalConfig();

  if (!appId) {
    console.warn('OneSignal App ID not found. Please set EXPO_PUBLIC_ONESIGNAL_APP_ID in your .env or app config (app.config.js -> extra).');
    return false;
  }

  try {
    OneSignal.initialize(appId);
    // Request notification permission (platform-specific behavior)
    if (OneSignal.Notifications?.requestPermission) {
      OneSignal.Notifications.requestPermission(true);
    }

    console.log('✅ OneSignal initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ OneSignal initialization failed:', error);
    return false;
  }
};

// Initialize on import
initializeOneSignal();

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
    const { restApiKey, appId } = readOneSignalConfig();
    if (!restApiKey || !appId) {
      throw new Error('OneSignal configuration not found. Ensure EXPO_PUBLIC_ONESIGNAL_REST_API_KEY and EXPO_PUBLIC_ONESIGNAL_APP_ID are provided in .env and added to app.config.js extra.');
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${restApiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
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

// Send message notification
export const sendMessageNotification = async (
  recipientId: string,
  senderName: string,
  messageContent: string,
  rideId: string,
  senderId: string
): Promise<void> => {
  try {
    await sendNotification(
      recipientId,
      `Message from ${senderName}`,
      messageContent,
      {
        type: 'message',
        rideId,
        senderId,
        senderName,
        action: 'open_chat'
      }
    );
  } catch (error) {
    console.error('Error sending message notification:', error);
    throw error;
  }
};

// Set up notification handlers
export const setupNotificationHandlers = () => {
  // Handle notification clicks
  OneSignal.Notifications.addEventListener('click', (event) => {
    const data = event.notification.additionalData as any;
    
    switch (data?.type) {
      case 'message':
        // Navigate to chat screen
        console.log('Opening chat for ride:', data.rideId);
        // This will be handled by the navigation system
        break;
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

  // Handle foreground notifications
  OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
    // Customize notification display for foreground
    console.log('Foreground notification received:', event.notification);
  });
};

// Initialize notification handlers
setupNotificationHandlers();
