import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OrderNavigator from './OrderNavigator';
import DriverNavigator from './DriverNavigator';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, isDriver } = useAuth();

  // For now, we route based on role:
  // - Driver accounts go to DriverNavigator
  // - Everyone else (guest or regular user) goes to MainNavigator
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isDriver ? (
        <Stack.Screen name="DriverMain" component={DriverNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainNavigator} />
      )}
      <Stack.Screen 
        name="Order" 
        component={OrderNavigator}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen 
        name="Auth" 
        component={AuthNavigator}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}



