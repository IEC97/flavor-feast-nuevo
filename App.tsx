// App.tsx
import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { RecipeProvider } from './context/RecipeContext';
import { FilterProvider } from './context/FilterContext';
import { UserProvider } from './context/UserContext';

export default function App(): React.ReactElement {
  const appNavigator = <AppNavigator />;
  
  return (
    <UserProvider children={
      <RecipeProvider children={
        <FilterProvider children={appNavigator} />
      } />
    } />
  );
}
