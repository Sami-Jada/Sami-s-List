import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OrderNavigator from './OrderNavigator';
import DriverNavigator from './DriverNavigator';
import AddressFormScreen from '../screens/main/AddressFormScreen';
import AddressEditScreen from '../screens/main/AddressEditScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, isDriver } = useAuth();

  if (isLoading) {
    // You can replace this with a proper splash/loading screen later
    return null;
  }

  // If not authenticated, show the auth flow as the first screen.
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Otherwise, show the main app shell:
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
        name="AddressForm"
        component={AddressFormScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="AddressEdit"
        component={AddressEditScreen}
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



