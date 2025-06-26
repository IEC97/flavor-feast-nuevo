// App.tsx
import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { RecipeProvider } from './context/RecipeContext';
import { FilterProvider } from './context/FilterContext';

export default function App() {
  return (
    <RecipeProvider>
      <FilterProvider>
        <AppNavigator />
      </FilterProvider>
    </RecipeProvider>
  );
}
