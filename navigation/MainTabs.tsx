import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { TabParamList } from './types';
import SearchScreen from '../screens/SearchScreen';
import FeedScreen from '../screens/FeedScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import CarnetScreen from '../screens/CarnetScreen';
import { hapticSelect } from '../lib/haptics';
import { border, colors, fonts, radius, spacing } from '../theme/tokens';

const Tab = createBottomTabNavigator<TabParamList>();

// Simple emoji tab icons for now (no icon library installed).
const ICONS: Record<keyof TabParamList, string> = {
  Recherche: '🔍',
  Feed: '🏠',
  Decouverte: '✨',
  MonCarnet: '📖',
};

// Tab icon that pops (scale spring) when focused and sits inside an acid pill
// with a hard ink frame — mirroring the drawer's active-row highlight so the
// tab bar reads as the same design system.
function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
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
    <Animated.View
      style={[
        styles.iconPill,
        focused && styles.iconPillActive,
        { transform: [{ scale }] },
      ]}
    >
      <Animated.Text style={styles.icon}>{icon}</Animated.Text>
    </Animated.View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Feed"
      // Light haptic tick on every tab switch, matching the drawer/toggle feel.
      screenListeners={{ tabPress: () => hapticSelect() }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopWidth: border.rule,
          borderTopColor: colors.ink,
          height: 64,
          paddingTop: spacing.xs,
          paddingBottom: spacing.xs,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.mono,
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon icon={ICONS[route.name]} focused={focused} />
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
        options={{ tabBarLabel: 'Carnet' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: border.rule,
    borderColor: 'transparent',
  },
  iconPillActive: {
    backgroundColor: colors.acid,
    borderColor: colors.ink,
  },
  icon: {
    fontSize: 18,
  },
});
