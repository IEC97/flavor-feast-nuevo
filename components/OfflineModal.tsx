import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  ActivityIndicator,
} from 'react-native';

interface OfflineModalProps {
  visible: boolean;
  onRetry: () => void;
  onExitApp: () => void;
  message?: string;
}

export const OfflineModal: React.FC<OfflineModalProps> = ({
  visible,
  onRetry,
  onExitApp,
  message = 'No tienes conexión a internet. Algunas funciones pueden no estar disponibles.',
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    
    // Simular un timeout de 2 segundos antes de llamar a onRetry
    setTimeout(() => {
      setIsRetrying(false);
      onRetry();
    }, 2000);
  };
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        // En Android, esto se llama cuando se presiona el botón de atrás
        // Por defecto, salir de la app
        onExitApp();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📵</Text>
          </View>
          
          <Text style={styles.title}>Sin conexión a internet</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.retryButton, isRetrying && styles.disabledButton]}
              onPress={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <View style={styles.retryingContainer}>
                  <ActivityIndicator size="small" color="white" style={styles.loadingSpinner} />
                  <Text style={styles.retryButtonText}>Reintentando...</Text>
                </View>
              ) : (
                <Text style={styles.retryButtonText}>� Reintentar</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.exitButton]}
              onPress={onExitApp}
              disabled={isRetrying}
            >
              <Text style={styles.exitButtonText}>🚪 Salir de la app</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  iconContainer: {
    marginBottom: 15,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#13162e',
  },
  disabledButton: {
    opacity: 0.7,
  },
  retryingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginRight: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  exitButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  exitButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
  },
});
