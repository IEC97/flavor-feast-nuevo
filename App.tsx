// App.tsx
import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { RecipeProvider } from './context/RecipeContext';
import { FilterProvider } from './context/FilterContext';
import { UserProvider } from './context/UserContext';

export default function App() {
  return (
    <UserProvider> {/* <-- Envuelve aquí */}
      <RecipeProvider>
        <FilterProvider>
          <AppNavigator />
        </FilterProvider>
      </RecipeProvider>
    </UserProvider>
  );
}
