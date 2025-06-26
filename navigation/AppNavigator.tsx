import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyRecipesScreen from '../screens/MyRecipesScreen';
import RecipeDetailsScreen from '../screens/RecipeDetailsScreen';
import RecipeFormScreen from '../screens/RecipeFormScreen';
import RecipeStepsScreen from '../screens/RecipeStepsScreen';
import FilterScreen from '../screens/FilterScreen';
import SortOptionsScreen from '../screens/SortOptionsScreen';
import { UserProvider } from '../context/UserContext'; 
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';



const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: string = 'home';
          if (route.name === 'Recetas') iconName = 'fast-food';
          else if (route.name === 'Mis Recetas') iconName = 'book';
          else if (route.name === 'Favoritos') iconName = 'heart';
          else if (route.name === 'Perfil') iconName = 'person';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Recetas" component={HomeScreen} />
      <Tab.Screen name="Mis Recetas" component={MyRecipesScreen} />
      <Tab.Screen name="Favoritos" component={FavoritesScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="HomeTabs" // 👈 Esto define que arranque acá
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="HomeTabs" component={HomeTabs} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="RecipeDetails" component={RecipeDetailsScreen} />
          <Stack.Screen name="RecipeForm" component={RecipeFormScreen} />
          <Stack.Screen name="RecipeSteps" component={RecipeStepsScreen} />
          <Stack.Screen name="FilterScreen" component={FilterScreen} />
          <Stack.Screen name="SortOptions" component={SortOptionsScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
