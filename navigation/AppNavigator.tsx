import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoginScreen from '../screens/LoginScreen';
import MyRecipesScreen from '../screens/MyRecipesScreen';
import RecipeDetailsScreen from '../screens/RecipeDetailsScreen';
import RecipeFormScreen from '../screens/RecipeFormScreen';
import RecipeStepsScreen from '../screens/RecipeStepsScreen';
import FilterScreen from '../screens/FilterScreen';
import SortOptionsScreen from '../screens/SortOptionsScreen';
import AdminScreen from '../screens/AdminScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import RegisterInfoScreen from '../screens/RegisterInfoScreen';
import TabNavigator from './TabNavigator';
import { RatingCacheInitializer } from '../components/RatingCacheInitializer';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <RatingCacheInitializer />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="HomeTabs"
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: '#FFFFFF' }
          }}
        >
          <Stack.Screen 
            name="HomeTabs" 
            component={TabNavigator}
            options={{ 
              gestureEnabled: false // Evitar gestos que interfieran con la navegación
            }}
          />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="RecipeDetails" component={RecipeDetailsScreen} />
          <Stack.Screen name="MyRecipesScreen" component={MyRecipesScreen} />
          <Stack.Screen name="RecipeForm" component={RecipeFormScreen} />
          <Stack.Screen name="RecipeSteps" component={RecipeStepsScreen} />
          <Stack.Screen name="FilterScreen" component={FilterScreen} />
          <Stack.Screen name="SortOptions" component={SortOptionsScreen} />
          <Stack.Screen name="RegisterInfo" component={RegisterInfoScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen 
            name="AdminScreen" 
            component={AdminScreen}
            options={{
              presentation: 'modal', // Presentar como modal para mejor UX
              gestureEnabled: true
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}