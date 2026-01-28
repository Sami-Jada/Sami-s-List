import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DriverAssignedScreen from '../screens/driver/DriverAssignedScreen';
import DriverActiveScreen from '../screens/driver/DriverActiveScreen';
import DriverHistoryScreen from '../screens/driver/DriverHistoryScreen';
import DriverProfileScreen from '../screens/driver/DriverProfileScreen';

export type DriverTabParamList = {
  DriverAssigned: undefined;
  DriverActive: undefined;
  DriverHistory: undefined;
  DriverProfile: undefined;
};

const Tab = createBottomTabNavigator<DriverTabParamList>();

export default function DriverNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen
        name="DriverAssigned"
        component={DriverAssignedScreen}
        options={{ title: 'Assigned' }}
      />
      <Tab.Screen
        name="DriverActive"
        component={DriverActiveScreen}
        options={{ title: 'Active' }}
      />
      <Tab.Screen
        name="DriverHistory"
        component={DriverHistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen
        name="DriverProfile"
        component={DriverProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

