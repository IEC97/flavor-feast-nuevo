import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

type NetworkContextType = {
  isConnected: boolean;
  isOffline: boolean;
  retryConnection: () => void;
};

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetworkContext = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetworkContext debe usarse dentro de un NetworkProvider');
  }
  return context;
};

export const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const checkConnection = async () => {
    try {
      const netInfoState = await NetInfo.fetch();
      const connected = netInfoState.isConnected && netInfoState.isInternetReachable;
      setIsConnected(connected || false);
      setIsOffline(!connected);
      
      console.log('🌐 Conexión verificada:', connected ? 'Conectado' : 'Desconectado');
    } catch (error) {
      console.error('❌ Error al verificar conexión:', error);
      setIsConnected(false);
      setIsOffline(true);
    }
  };

  useEffect(() => {
    // Verificar conexión inicial
    checkConnection();

    // Suscribirse a cambios de conectividad
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsConnected(connected || false);
      setIsOffline(!connected);
      
      console.log('🌐 Cambio de conectividad:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        finalConnected: connected
      });
    });

    return () => unsubscribe();
  }, []);

  const retryConnection = () => {
    console.log('🔄 Reintentando conexión...');
    checkConnection();
  };

  return (
    <NetworkContext.Provider value={{ isConnected, isOffline, retryConnection }}>
      {children}
    </NetworkContext.Provider>
  );
};
