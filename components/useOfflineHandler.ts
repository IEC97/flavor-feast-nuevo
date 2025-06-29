import { useState, useEffect } from 'react';
import { useNetworkContext } from '../context/NetworkContext';

interface UseOfflineHandlerOptions {
  showModalOnOffline?: boolean;
  onGoOffline?: () => void;
  onGoOnline?: () => void;
}

export const useOfflineHandler = (options: UseOfflineHandlerOptions = {}) => {
  const { 
    showModalOnOffline = true, 
    onGoOffline, 
    onGoOnline 
  } = options;
  
  const { isConnected, isOffline } = useNetworkContext();
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  useEffect(() => {
    if (isOffline && showModalOnOffline) {
      setShowOfflineModal(true);
      if (onGoOffline) {
        onGoOffline();
      }
    } else if (isConnected) {
      setShowOfflineModal(false);
      if (onGoOnline) {
        onGoOnline();
      }
    }
  }, [isOffline, isConnected, showModalOnOffline, onGoOffline, onGoOnline]);

  const hideOfflineModal = () => {
    setShowOfflineModal(false);
  };

  const retryAndHideModal = () => {
    setShowOfflineModal(false);
  };

  return {
    isConnected,
    isOffline,
    showOfflineModal,
    hideOfflineModal,
    retryAndHideModal,
  };
};
