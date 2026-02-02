import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainNavigator from './MainNavigator';
import OrderNavigator from './OrderNavigator';
import DriverNavigator from './DriverNavigator';
import AddressFormScreen from '../screens/main/AddressFormScreen';
import AddressEditScreen from '../screens/main/AddressEditScreen';
import OrdersScreen from '../screens/main/OrdersScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading, isDriver, isGuestUser } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // New users (guest, no name) must complete onboarding: set password then name + address
  if (isGuestUser) {
    return <OnboardingNavigator />;
  }

  // Driver accounts go to DriverNavigator; everyone else to MainNavigator
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
        name="Orders"
        component={OrdersScreen}
        options={{
          presentation: 'card',
          headerShown: true,
          title: 'Orders',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.heading,
        }}
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



