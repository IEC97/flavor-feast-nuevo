import { useNetworkContext } from '../context/NetworkContext';

/**
 * Hook simplificado para verificar conectividad antes de hacer peticiones HTTP
 * No maneja modales - eso lo hace el NetworkWrapper global
 */
export const useNetworkGuard = () => {
  const { isConnected, isOffline } = useNetworkContext();

  /**
   * Verifica si hay conexión antes de ejecutar una función
   * @param fn Función a ejecutar si hay conexión
   * @param fallback Función opcional a ejecutar si no hay conexión
   */
  const executeIfConnected = async <T>(
    fn: () => Promise<T> | T,
    fallback?: () => void
  ): Promise<T | null> => {
    if (!isConnected) {
      console.log('⚠️ Sin conexión, operación cancelada');
      if (fallback) {
        fallback();
      }
      return null;
    }
    
    try {
      return await fn();
    } catch (error) {
      console.error('❌ Error en operación de red:', error);
      throw error;
    }
  };

  return {
    isConnected,
    isOffline,
    executeIfConnected,
  };
};
