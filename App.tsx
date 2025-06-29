// App.tsx
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { RecipeProvider } from './context/RecipeContext';
import { FilterProvider } from './context/FilterContext';
import { UserProvider } from './context/UserContext';
import { NetworkProvider } from './context/NetworkContext';
import { NetworkWrapper } from './components/NetworkWrapper';

export default function App(): React.ReactElement {
  const appNavigator = <AppNavigator />;
  
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <NetworkWrapper>
          <UserProvider children={
            <RecipeProvider children={
              <FilterProvider children={appNavigator} />
            } />
          } />
        </NetworkWrapper>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}
