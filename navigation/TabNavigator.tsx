// navigation/TabNavigator.tsx
import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Alert, GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import HomeScreen from '../screens/HomeScreen';
import MyRecipesScreen from '../screens/MyRecipesScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';

type TabNavigatorProps = NativeStackNavigationProp<RootStackParamList, 'AdminScreen'>;

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const navigation = useNavigation<TabNavigatorProps>();
  
  // Estados para la presión larga en el ícono de perfil
  const pressStartTimeRef = useRef<number>(0);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleProfilePressIn = () => {
    pressStartTimeRef.current = Date.now();
    
    // Timer para mostrar feedback visual a los 2 segundos
    pressTimerRef.current = setTimeout(() => {
      // Aquí podrías agregar vibración o feedback visual si quieres
      console.log('⏱️ Mantén presionado 1 segundo más para acceder al panel admin...');
    }, 2000);
  };

  const handleProfilePressOut = () => {
    const pressDuration = Date.now() - pressStartTimeRef.current;
    
    // Limpiar timer
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (pressDuration >= 3000) {
      // Presión larga (3+ segundos) - Acceso admin
      Alert.alert(
        '🔐 Modo Administrador',
        '¿Deseas acceder al panel de administración?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Acceder',
            onPress: () => navigation.navigate('AdminScreen'),
          },
        ]
      );
    } else if (pressDuration < 2000) {
      // Presión corta (menos de 2 segundos) - Navegar a perfil normal
      // No hacer nada ya que el tab navigator se encargará de la navegación normal
    }
    // Entre 2-3 segundos no hace nada (zona intermedia)
  };
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any = '';

          if (route.name === 'Inicio') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Mis Recetas') {
            iconName = focused ? 'pencil' : 'pencil-outline';
          } else if (route.name === 'Favoritos') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
            // Para el ícono de perfil, envolver en TouchableOpacity para presión larga
            return (
              <TouchableOpacity 
                onPressIn={handleProfilePressIn}
                onPressOut={handleProfilePressOut}
                activeOpacity={0.7}
                style={{ padding: 8 }}
              >
                <Ionicons name={iconName} size={24} color={color} />
              </TouchableOpacity>
            );
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF', // iOS Blue para mejor accesibilidad
        tabBarInactiveTintColor: '#8E8E93', // iOS Gray para estados inactivos
        tabBarStyle: {
          backgroundColor: '#FFFFFF', // Fondo blanco para mejor contraste
          borderTopWidth: 0.5,
          borderTopColor: '#E5E5EA', // Línea sutil superior
          height: 83, // Altura estándar iOS (49 + 34 safe area)
          paddingBottom: 20, // Espacio para safe area en iPhone X+
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 16, // Sombra para Android
          position: 'absolute', // Mantener la barra siempre visible
        },
        tabBarLabelStyle: {
          fontSize: 10, // Tamaño estándar iOS
          fontWeight: '500', // Peso medio para mejor legibilidad
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarHideOnKeyboard: true, // Ocultar cuando aparece el teclado
        lazy: false, // Cargar todas las pantallas para navegación fluida
        headerShown: false,
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Mis Recetas" component={MyRecipesScreen} />
      <Tab.Screen name="Favoritos" component={FavoritesScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;