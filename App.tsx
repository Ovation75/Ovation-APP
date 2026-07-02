import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  NavigationContainer,
  DefaultTheme,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import { AppStateProvider, useAppState } from './contexts/AppStateContext';
import { colors, fonts } from './theme/tokens';
import MainDrawer from './navigation/MainDrawer';
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import SignupScreen from './screens/SignupScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import ShowDetailScreen from './screens/ShowDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import MyProfileScreen from './screens/MyProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SettingsScreen from './screens/SettingsScreen';
import CategoryListScreen from './screens/CategoryListScreen';
import PlaylistDetailScreen from './screens/PlaylistDetailScreen';
import LogFlowScreen from './screens/LogFlowScreen';

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

// Watches AppStateContext.sessionExpired (set when a Supabase query hits an
// auth/JWT error) and force-resets navigation to Login. Distinct from the
// deliberate Déconnexion flow in Settings, which already navigates itself —
// this only fires for an *unexpected* session death mid-use.
function SessionExpiryWatcher({
  navigationRef,
}: {
  navigationRef: ReturnType<typeof useNavigationContainerRef<RootStackParamList>>;
}) {
  const { sessionExpired } = useAppState();
  useEffect(() => {
    if (sessionExpired && navigationRef.isReady()) {
      navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }, [sessionExpired, navigationRef]);
  return null;
}

export default function App() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
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
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        {/* Shared interactive state (logs, wishlist, playlists, follows,
            notifications, moderation) lives here, backed by Supabase, so
            every screen that pushes on top of the tabs reads the same
            source. */}
        <AppStateProvider>
        <SessionExpiryWatcher navigationRef={navigationRef} />
        <Stack.Navigator
          initialRouteName="Splash"
          // Native-stack transition presets: detail pushes slide in from the
          // right; auth/onboarding steps cross-fade (they replace context
          // rather than stack on top of it).
          screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        >
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          {/* Drawer hosts the tab navigator (Recherche / Feed / Découverte /
              Mon Carnet) plus the profile side panel. */}
          <Stack.Screen
            name="Main"
            component={MainDrawer}
            options={{ animation: 'fade' }}
          />
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
          {/* Own-profile hub + editor (E09). These render their own AppHeader,
              so the native stack header is hidden. */}
          <Stack.Screen
            name="MyProfile"
            component={MyProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerShown: false }}
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
          {/* Log / rating flow (E05) — presented modally over the tabs. */}
          <Stack.Screen
            name="LogFlow"
            component={LogFlowScreen}
            options={{
              ...detailHeaderOptions,
              title: 'Noter',
              presentation: 'modal',
              // Android ignores iOS modal sheets — force the bottom slide.
              animation: 'slide_from_bottom',
            }}
          />
        </Stack.Navigator>
        </AppStateProvider>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
