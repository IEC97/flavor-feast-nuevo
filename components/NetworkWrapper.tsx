import React, { useState } from 'react';
import { BackHandler } from 'react-native';
import { useNetworkContext } from '../context/NetworkContext';
import { OfflineModal } from './OfflineModal';

interface NetworkWrapperProps {
  children: React.ReactNode;
}

export const NetworkWrapper: React.FC<NetworkWrapperProps> = ({ children }) => {
  const { isOffline, retryConnection } = useNetworkContext();
  const [isOfflineModalDismissed, setIsOfflineModalDismissed] = useState(false);

  // Mostrar modal solo si está offline Y no ha sido descartado manualmente
  const shouldShowModal = isOffline && !isOfflineModalDismissed;

  const handleRetry = () => {
    retryConnection();
    // No cerrar el modal aquí - se cerrará automáticamente cuando vuelva la conexión
  };

  const handleContinueOffline = () => {
    // Permitir usar la app sin conexión
    setIsOfflineModalDismissed(true);
  };

  const handleExitApp = () => {
    // Salir de la aplicación
    BackHandler.exitApp();
  };

  // Resetear el estado cuando vuelve la conexión
  React.useEffect(() => {
    if (!isOffline) {
      setIsOfflineModalDismissed(false);
    }
  }, [isOffline]);

  return (
    <>
      {children}
      <OfflineModal
        visible={shouldShowModal}
        onRetry={handleRetry}
        onContinueOffline={handleContinueOffline}
        onExitApp={handleExitApp}
        message="Parece que no tienes conexión a internet. Puedes continuar usando la app con funcionalidad limitada o intentar conectarte nuevamente."
      />
    </>
  );
};
