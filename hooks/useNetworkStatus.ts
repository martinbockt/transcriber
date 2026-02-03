'use client';

import { useState, useEffect } from 'react';
import { logError } from '@/lib/error-sanitizer';

export interface UseNetworkStatusReturn {
  isOnline: boolean;
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    try {
      // Initialize with current online status
      setIsOnline(navigator.onLine);

      // Event handlers
      const handleOnline = () => {
        setIsOnline(true);
      };

      const handleOffline = () => {
        setIsOnline(false);
      };

      // Add event listeners
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Cleanup event listeners on unmount
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } catch (err) {
      logError('Network status detection error', err);
      // Default to online if detection fails
      setIsOnline(true);
    }
  }, []);

  return {
    isOnline,
  };
}
