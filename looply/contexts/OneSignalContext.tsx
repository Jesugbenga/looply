import React, { createContext, useContext, useEffect, useState } from 'react';
import { getOneSignalUserId } from '@/lib/oneSignal';
import { userUtils, driverUtils } from '@/lib/firebaseUtils';
import { useAuth } from './AuthContext';

interface OneSignalContextType {
  oneSignalUserId: string | null;
  isInitialized: boolean;
  initializeOneSignal: () => Promise<void>;
}

const OneSignalContext = createContext<OneSignalContextType | undefined>(undefined);

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth();
  const [oneSignalUserId, setOneSignalUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeOneSignal = async () => {
    if (!user || !userProfile) return;

    try {
      // Get OneSignal user ID
      const osUserId = await getOneSignalUserId();
      if (!osUserId) {
        console.warn('OneSignal user ID not available - this is normal if OneSignal is not configured');
        setIsInitialized(false);
        return;
      }

      setOneSignalUserId(osUserId);

      // Update user profile with OneSignal user ID
      await userUtils.updateOneSignalUserId(user.uid, osUserId);

      // If user is a driver, also update driver profile
      if (userProfile.userType === 'driver' || userProfile.userType === 'both') {
        try {
          const driverProfile = await driverUtils.getDriverProfile(user.uid);
          if (driverProfile) {
            await driverUtils.updateOneSignalUserId(driverProfile.id, osUserId);
          }
        } catch (error) {
          console.warn('Failed to update driver profile with OneSignal ID:', error);
        }
      }

      console.log('✅ OneSignal initialized for user:', user.uid);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing OneSignal:', error);
      setIsInitialized(false);
    }
  };

  useEffect(() => {
    if (user && userProfile && !isInitialized) {
      initializeOneSignal();
    }
  }, [user, userProfile, isInitialized]);

  return (
    <OneSignalContext.Provider value={{
      oneSignalUserId,
      isInitialized,
      initializeOneSignal
    }}>
      {children}
    </OneSignalContext.Provider>
  );
}

export function useOneSignal() {
  const context = useContext(OneSignalContext);
  if (context === undefined) {
    throw new Error('useOneSignal must be used within a OneSignalProvider');
  }
  return context;
}
