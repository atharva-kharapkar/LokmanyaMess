import { useState, useEffect } from 'react';

/**
 * Custom hook to monitor online/offline status and ensure reliable
 * cloud re-syncing when internet connectivity is restored.
 */
export function useOfflineSync({ saveHealth, handleForceSync, showToast }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (typeof showToast === 'function') {
        showToast('🌐 Internet reconnected! Syncing offline changes to cloud...', 'success');
      }
      if (typeof handleForceSync === 'function') {
        handleForceSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (typeof showToast === 'function') {
        showToast('📡 You are offline. All changes will save locally and sync when reconnected.', 'warning');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast, handleForceSync]);

  return {
    isOnline,
    saveHealth
  };
}
