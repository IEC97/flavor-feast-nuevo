import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNetworkContext } from '../context/NetworkContext';

interface OfflineModalProps {
  visible: boolean;
  onRetry?: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
  message?: string;
}

export const OfflineModal: React.FC<OfflineModalProps> = ({
  visible,
  onRetry,
  onGoBack,
  canGoBack = true,
  message = 'No tienes conexión a internet. Algunas funciones pueden no estar disponibles.',
}) => {
  const { retryConnection } = useNetworkContext();

  const handleRetry = () => {
    retryConnection();
    if (onRetry) {
      onRetry();
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        // En Android, esto se llama cuando se presiona el botón de atrás
        if (canGoBack && onGoBack) {
          onGoBack();
        }
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📵</Text>
          </View>
          
          <Text style={styles.title}>Sin conexión</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.retryButton]}
              onPress={handleRetry}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
            
            {canGoBack && (
              <TouchableOpacity
                style={[styles.button, styles.backButton]}
                onPress={handleGoBack}
              >
                <Text style={styles.backButtonText}>Volver</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconContainer: {
    marginBottom: 15,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});
