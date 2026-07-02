import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { DrawerScreenProps } from '@react-navigation/drawer';

// Bottom tab bar (E00): Recherche, Feed, Découverte, Mon Carnet.
export type TabParamList = {
  Recherche: undefined;
  Feed: undefined;
  Decouverte: undefined;
  // Optional deep-link params: preselect a sub-tab and/or open the create-
  // playlist dialog (used by the Mon Profil quick actions).
  MonCarnet:
    | { tab?: 'journal' | 'playlists' | 'wishlist'; create?: boolean }
    | undefined;
};

// Drawer (E00): wraps the bottom tabs so the profile panel can slide in from
// the avatar button. The tabs live under the single `Tabs` drawer screen.
export type DrawerParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
};

// Root native stack. The drawer (which hosts the tabs) lives under `Main`, so
// detail screens (ShowDetail, Profile, MyProfile, EditProfile, Notifications,
// Settings, …) push on top of it.
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Signup: undefined;
  Login: undefined;
  ProfileSetup: undefined;
  Main: NavigatorScreenParams<DrawerParamList> | undefined;
  ShowDetail: { showId: string; title?: string };
  Profile: { userId: string; username?: string };
  MyProfile: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  Settings: undefined;
  Preferences: undefined;
  BlockedUsers: undefined;
  ReportsSent: undefined;
  CategoryList: { category: string };
  PlaylistDetail: { playlistId: string; name?: string };
  // Log / rating flow (E05). No showId -> starts on the catalogue search step
  // (Carnet "+"). With a showId -> jumps straight to rating (ShowDetail "Noter").
  LogFlow: { showId?: string } | undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// The drawer content component navigates both the drawer (tab switch) and, by
// bubbling, the root stack (Profile, Settings, …).
export type DrawerScreenPropsFor<T extends keyof DrawerParamList> =
  CompositeScreenProps<
    DrawerScreenProps<DrawerParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

// Screens rendered inside the tab navigator can also navigate the root stack.
export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
