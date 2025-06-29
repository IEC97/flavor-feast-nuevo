import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
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

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="HomeTabs"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="HomeTabs" component={TabNavigator} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RecipeDetails" component={RecipeDetailsScreen} />
        <Stack.Screen name="RecipeForm" component={RecipeFormScreen} />
        <Stack.Screen name="RecipeSteps" component={RecipeStepsScreen} />
        <Stack.Screen name="FilterScreen" component={FilterScreen} />
        <Stack.Screen name="SortOptions" component={SortOptionsScreen} />
        <Stack.Screen name="RegisterInfo" component={RegisterInfoScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="AdminScreen" component={AdminScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}