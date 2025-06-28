// 📄 navigation/TabNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import MyRecipesScreen from '../screens/MyRecipesScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';

type TabParamList = {
  Recetas: undefined;
  MisRecetas: undefined;
  Favoritos: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = (): React.ReactElement => {
  return React.createElement(
    Tab.Navigator,
    {
      screenOptions: ({ route }: any) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Recetas':
              iconName = 'home-outline';
              break;
            case 'MisRecetas':
              iconName = 'book-outline';
              break;
            case 'Favoritos':
              iconName = 'heart-outline';
              break;
            case 'Perfil':
              iconName = 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })
    },
    React.createElement(Tab.Screen, { name: "Recetas", component: HomeScreen }),
    React.createElement(Tab.Screen, { name: "MisRecetas", component: MyRecipesScreen }),
    React.createElement(Tab.Screen, { name: "Favoritos", component: FavoritesScreen }),
    React.createElement(Tab.Screen, { name: "Perfil", component: ProfileScreen })
  );
};

export default TabNavigator;