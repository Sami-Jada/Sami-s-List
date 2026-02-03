import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CategoriesScreen from '../screens/main/CategoriesScreen';
import CategoryVendorsScreen from '../screens/main/CategoryVendorsScreen';
import { colors } from '../theme';
import HomeIcon from '../../assets/images/Icons/bottomNavIcons/home-icon.svg';
import CategoriesIcon from '../../assets/images/Icons/bottomNavIcons/categories-icon.svg';
import ProfileIcon from '../../assets/images/Icons/bottomNavIcons/profile-icon.svg';

export type CategoriesStackParamList = {
  Categories: undefined;
  CategoryVendors: { serviceId: string; serviceName: string };
};

export type MainTabParamList = {
  Home: undefined;
  Categories: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const CategoriesStack = createStackNavigator<CategoriesStackParamList>();

const TAB_ICON_SIZE = 90;
// Push icons down within the tab bar (closer to bottom of screen)
const TAB_ICON_PADDING_TOP = 20;

function CategoriesStackNavigator() {
  return (
    <CategoriesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.heading,
      }}
    >
      <CategoriesStack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ title: 'Categories' }}
      />
      <CategoriesStack.Screen
        name="CategoryVendors"
        component={CategoryVendorsScreen}
        options={({ route }) => ({
          title: route.params?.serviceName ?? '',
        })}
      />
    </CategoriesStack.Navigator>
  );
}

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
            <View style={{ width: TAB_ICON_SIZE, height: TAB_ICON_SIZE, alignItems: 'center', justifyContent: 'center', paddingTop: TAB_ICON_PADDING_TOP }}>
              <HomeIcon width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesStackNavigator}
        options={{
          title: 'Categories',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <View style={{ width: TAB_ICON_SIZE, height: TAB_ICON_SIZE, alignItems: 'center', justifyContent: 'center', paddingTop: TAB_ICON_PADDING_TOP }}>
              <CategoriesIcon width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} color={color} />
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
            <View style={{ width: TAB_ICON_SIZE, height: TAB_ICON_SIZE, alignItems: 'center', justifyContent: 'center', paddingTop: TAB_ICON_PADDING_TOP }}>
              <ProfileIcon width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}


