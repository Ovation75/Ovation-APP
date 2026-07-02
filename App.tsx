import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreenModule from 'expo-splash-screen';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

import type { RootStackParamList } from './navigation/types';
import { AppStateProvider } from './contexts/AppStateContext';
import { colors, fonts } from './theme/tokens';
import MainTabs from './navigation/MainTabs';
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import SignupScreen from './screens/SignupScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import ShowDetailScreen from './screens/ShowDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SettingsScreen from './screens/SettingsScreen';
import CategoryListScreen from './screens/CategoryListScreen';
import PlaylistDetailScreen from './screens/PlaylistDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Keep the native splash up until our custom fonts are ready.
SplashScreenModule.preventAutoHideAsync().catch(() => {
  /* ignore — not fatal if the splash module isn't available */
});

// Paint the navigator background as BROADSIDE "paper" cream.
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.paper,
    card: colors.paper,
    text: colors.ink,
    border: colors.ink,
    primary: colors.ink,
  },
};

// Shared header styling for the detail/modal screens (BROADSIDE ink-on-paper).
const detailHeaderOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.paper },
  headerTintColor: colors.ink,
  headerTitleStyle: { fontFamily: fonts.bodyBold, color: colors.ink },
  headerShadowVisible: false,
} as const;

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    ArchivoBlack_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreenModule.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Hold rendering until fonts resolve (loaded or errored) so text never
  // flashes in a fallback family first.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        {/* Shared interactive state (wishlist, follow) lives here so every
            screen that pushes on top of the tabs reads the same source. */}
        <AppStateProvider>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          {/* Tab navigator hosts Recherche / Feed / Découverte / Mon Carnet. */}
          <Stack.Screen name="Main" component={MainTabs} />
          {/* Detail / modal-ish screens push on top of the tabs. */}
          <Stack.Screen
            name="ShowDetail"
            component={ShowDetailScreen}
            options={{ ...detailHeaderOptions, title: '' }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ ...detailHeaderOptions, title: '' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ ...detailHeaderOptions, title: 'Notifications' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ ...detailHeaderOptions, title: 'Paramètres' }}
          />
          <Stack.Screen
            name="CategoryList"
            component={CategoryListScreen}
            options={{ ...detailHeaderOptions, title: '' }}
          />
          <Stack.Screen
            name="PlaylistDetail"
            component={PlaylistDetailScreen}
            options={{ ...detailHeaderOptions, title: '' }}
          />
        </Stack.Navigator>
        </AppStateProvider>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
