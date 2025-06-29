import React from 'react';
import { useNetworkContext } from '../context/NetworkContext';
import { OfflineModal } from './OfflineModal';

interface NetworkWrapperProps {
  children: React.ReactNode;
}

export const NetworkWrapper: React.FC<NetworkWrapperProps> = ({ children }) => {
  const { isOffline, retryConnection } = useNetworkContext();

  const handleRetry = () => {
    retryConnection();
  };

  return (
    <>
      {children}
      <OfflineModal
        visible={isOffline}
        onRetry={handleRetry}
        canGoBack={false} // A nivel global no permitimos "volver atrás"
        message="No tienes conexión a internet. Algunas funciones pueden no estar disponibles hasta que se restablezca la conexión."
      />
    </>
  );
};
