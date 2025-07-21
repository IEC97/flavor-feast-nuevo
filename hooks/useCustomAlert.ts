import { useState } from 'react';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  icon: string;
}

export const useCustomAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    icon: '⚠️'
  });

  const showAlert = (
    title: string,
    message: string,
    buttons: AlertButton[] = [{ text: 'OK' }],
    icon: string = '⚠️'
  ) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons,
      icon
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  // Función de conveniencia para Alert de login
  const showLoginAlert = (onLogin: () => void) => {
    showAlert(
      'Iniciar sesión requerido',
      'Debes iniciar sesión para agregar recetas a favoritos',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Iniciar sesión', onPress: onLogin, style: 'default' }
      ],
      '🔐'
    );
  };

  // Función de conveniencia para Alert de favoritos
  const showFavoritesLimitAlert = (onGoToFavorites: () => void) => {
    showAlert(
      'Límite de favoritos alcanzado',
      'Ya tienes 10 recetas en favoritos. Este es el máximo permitido. ¿Quieres ir a tu lista de favoritos para eliminar alguna?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir a Favoritos', onPress: onGoToFavorites, style: 'default' }
      ],
      '❤️'
    );
  };

  // Función de conveniencia para Alert de límite preventivo
  const showPreventiveLimitAlert = (onGoToFavorites: () => void) => {
    showAlert(
      'Límite alcanzado',
      'Solo puedes tener un máximo de 10 recetas favoritas. Elimina alguna para agregar otra.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir a Favoritos', onPress: onGoToFavorites, style: 'default' }
      ],
      '📋'
    );
  };

  return {
    alertState,
    showAlert,
    hideAlert,
    showLoginAlert,
    showFavoritesLimitAlert,
    showPreventiveLimitAlert
  };
};
