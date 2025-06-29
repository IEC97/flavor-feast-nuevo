import React from 'react';
import { BackHandler } from 'react-native';
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

  const handleExitApp = () => {
    // Salir de la aplicación
    BackHandler.exitApp();
  };

  return (
    <>
      {children}
      <OfflineModal
        visible={isOffline}
        onRetry={handleRetry}
        onExitApp={handleExitApp}
        message="No tienes conexión a internet. Intenta conectarte nuevamente o sal de la aplicación."
      />
    </>
  );
};
