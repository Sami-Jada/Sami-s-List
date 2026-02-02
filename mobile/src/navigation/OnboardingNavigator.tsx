import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SetPasswordScreen from '../screens/auth/SetPasswordScreen';
import CreatePasswordScreen from '../screens/auth/CreatePasswordScreen';

export type OnboardingStackParamList = {
  SetPassword: undefined;
  CompleteProfile: { orderId?: string };
};

const Stack = createStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="SetPassword"
    >
      <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
      <Stack.Screen name="CompleteProfile" component={CreatePasswordScreen} />
    </Stack.Navigator>
  );
}
