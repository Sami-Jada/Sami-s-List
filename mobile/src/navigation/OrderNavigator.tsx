import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OrderQuantityScreen from '../screens/order/OrderQuantityScreen';
import OrderConfirmationScreen from '../screens/order/OrderConfirmationScreen';

export type OrderStackParamList = {
  Quantity: { quantity?: number };
  Confirmation: { order: any };
};

const Stack = createStackNavigator<OrderStackParamList>();

export default function OrderNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Quantity"
        component={OrderQuantityScreen}
        options={{ title: 'Select Quantity' }}
      />
      <Stack.Screen
        name="Confirmation"
        component={OrderConfirmationScreen}
        options={{ title: 'Order Confirmation', headerLeft: () => null }}
      />
    </Stack.Navigator>
  );
}
