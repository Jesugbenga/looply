import { useState, useEffect } from 'react';
import { connectionUtils } from '@/lib/firebase';

export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const checkConnection = async () => {
      try {
        const connected = await connectionUtils.checkConnection();
        setIsOnline(connected);
      } catch (error) {
        console.warn('Connection check failed:', error);
        setIsOnline(false);
      }
    };

    // Check connection immediately
    checkConnection();

    // Check connection every 30 seconds
    intervalId = setInterval(checkConnection, 30000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const retryConnection = async () => {
    setIsConnecting(true);
    try {
      await connectionUtils.enableConnection();
      const connected = await connectionUtils.checkConnection();
      setIsOnline(connected);
    } catch (error) {
      console.error('Failed to retry connection:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    isOnline,
    isConnecting,
    retryConnection,
  };
};
