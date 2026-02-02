import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { colors } from '../theme';
import HomeIcon from '../../assets/images/Icons/bottomNavIcons/home-icon.svg';
import ProfileIcon from '../../assets/images/Icons/bottomNavIcons/profile-icon.svg';

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICON_SIZE = 100;

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.heading,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.heading,
        tabBarStyle: { backgroundColor: colors.card },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <View style={{ width: TAB_ICON_SIZE, height: TAB_ICON_SIZE, alignItems: 'center', justifyContent: 'center' }}>
              <HomeIcon width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <View style={{ width: TAB_ICON_SIZE, height: TAB_ICON_SIZE, alignItems: 'center', justifyContent: 'center' }}>
              <ProfileIcon width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}


