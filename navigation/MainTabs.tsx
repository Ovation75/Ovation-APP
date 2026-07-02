import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { TabParamList } from './types';
import SearchScreen from '../screens/SearchScreen';
import FeedScreen from '../screens/FeedScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import CarnetScreen from '../screens/CarnetScreen';
import { border, colors, fonts } from '../theme/tokens';

const Tab = createBottomTabNavigator<TabParamList>();

// Simple emoji tab icons for now (no icon library installed).
const ICONS: Record<keyof TabParamList, string> = {
  Recherche: '🔍',
  Feed: '🏠',
  Decouverte: '✨',
  MonCarnet: '📖',
};

// Tab icon that pops (scale spring) whenever its tab becomes focused.
function TabIcon({
  icon,
  color,
  focused,
}: {
  icon: string;
  color: string;
  focused: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      scale.setValue(0.8);
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }
  }, [focused, scale]);

  return (
    <Animated.Text style={{ fontSize: 18, color, transform: [{ scale }] }}>
      {icon}
    </Animated.Text>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Feed"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopWidth: border.rule,
          borderTopColor: colors.ink,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.mono,
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
        tabBarIcon: ({ color, focused }) => (
          <TabIcon icon={ICONS[route.name]} color={color} focused={focused} />
        ),
      })}
    >
      <Tab.Screen
        name="Recherche"
        component={SearchScreen}
        options={{ tabBarLabel: 'Recherche' }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{ tabBarLabel: 'Feed' }}
      />
      <Tab.Screen
        name="Decouverte"
        component={DiscoverScreen}
        options={{ tabBarLabel: 'Découverte' }}
      />
      <Tab.Screen
        name="MonCarnet"
        component={CarnetScreen}
        options={{ tabBarLabel: 'Mon Carnet' }}
      />
    </Tab.Navigator>
  );
}
