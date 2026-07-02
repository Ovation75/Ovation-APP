import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Bottom tab bar (E00): Recherche, Feed, Découverte, Mon Carnet.
export type TabParamList = {
  Recherche: undefined;
  Feed: undefined;
  Decouverte: undefined;
  MonCarnet: undefined;
};

// Root native stack. The tab navigator lives under `Main`, so detail screens
// (ShowDetail, Profile, Notifications, Settings, …) push on top of the tabs.
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Signup: undefined;
  Login: undefined;
  ProfileSetup: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  ShowDetail: { showId: string; title?: string };
  Profile: { userId: string; username?: string };
  Notifications: undefined;
  Settings: undefined;
  CategoryList: { category: string };
  PlaylistDetail: { playlistId: string; name?: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// Screens rendered inside the tab navigator can also navigate the root stack.
export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
