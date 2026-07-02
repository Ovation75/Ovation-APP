import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Avatar } from '../components/common';
import { useAppState } from '../contexts/AppStateContext';
import { supabase } from '../lib/supabase';
import { hapticSelect } from '../lib/haptics';
import { border, colors, radius, spacing, type } from '../theme/tokens';
import type { TabParamList } from './types';

// ---------------------------------------------------------------------------
// Profile drawer (E00). Slides in from the header avatar. Sections:
//   - user card (avatar, username, bio) → taps through to Mon Profil
//   - shortcuts to the four tabs, with an active-state highlight
//   - account rows (profil / édition / préférences / notifications / … )
//   - Déconnexion pinned to the bottom
// Everything is theme-token styled to match BROADSIDE (hard ink rules, mono
// section labels). Deep-link routes (Profile, Notifications, Settings, …) are
// reached by bubbling `navigate` up to the root stack.
// ---------------------------------------------------------------------------

type RowDef = {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: number;
};

const TAB_SHORTCUTS: { name: keyof TabParamList; icon: string; label: string }[] = [
  { name: 'Feed', icon: '🏠', label: 'Feed' },
  { name: 'Recherche', icon: '🔍', label: 'Recherche' },
  { name: 'Decouverte', icon: '✨', label: 'Découverte' },
  { name: 'MonCarnet', icon: '📖', label: 'Mon Carnet' },
];

// Pull the focused tab name out of the nested drawer/tab navigation state so
// the matching shortcut can render its active state.
function activeTabName(state: DrawerContentComponentProps['state']): string {
  const drawerRoute = state.routes[state.index];
  const tabState = drawerRoute.state as
    | { index?: number; routes: { name: string }[] }
    | undefined;
  if (!tabState) return 'Feed';
  const idx = tabState.index ?? 0;
  return tabState.routes[idx]?.name ?? 'Feed';
}

export default function ProfileDrawerContent(props: DrawerContentComponentProps) {
  const { navigation, state } = props;
  const { myProfile, unreadCount } = useAppState();
  const [signingOut, setSigningOut] = useState(false);

  const active = activeTabName(state);

  const username = myProfile?.username ?? 'Mon compte';
  const bio = myProfile?.bio;

  const goToTab = (name: keyof TabParamList) => {
    hapticSelect();
    navigation.navigate('Tabs', { screen: name });
    navigation.closeDrawer();
  };

  // Root-stack routes: a navigate action bubbles up past the drawer to the
  // root stack when the drawer itself has no such route.
  const goToRoute = (name: string, params?: object) => {
    navigation.dispatch(CommonActions.navigate(name, params));
    navigation.closeDrawer();
  };

  const comingSoon = () => {
    navigation.closeDrawer();
    Alert.alert('Bientôt disponible', 'Cette section arrive prochainement.');
  };

  const doSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      // Reset the ROOT navigator (drawer's parent) back to Onboarding — mirrors
      // the deliberate Déconnexion flow in Settings.
      const root = navigation.getParent() ?? navigation;
      root.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Onboarding' }] })
      );
    }
  };

  const confirmSignOut = () =>
    Alert.alert('Déconnexion', 'Se déconnecter de ton compte ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: doSignOut },
    ]);

  const accountRows: RowDef[] = [
    { icon: '👤', label: 'Mon profil', onPress: () => goToRoute('MyProfile') },
    { icon: '✏️', label: 'Modifier mon profil', onPress: () => goToRoute('EditProfile') },
    { icon: '🎚️', label: 'Préférences', onPress: comingSoon },
    {
      icon: '🔔',
      label: 'Notifications',
      onPress: () => goToRoute('Notifications'),
      badge: unreadCount,
    },
    { icon: '🔒', label: 'Confidentialité', onPress: comingSoon },
    { icon: '❓', label: 'Aide', onPress: comingSoon },
    { icon: '⚙️', label: 'Paramètres', onPress: () => goToRoute('Settings') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* User card */}
        <Pressable
          style={styles.userCard}
          onPress={() => goToRoute('MyProfile')}
          accessibilityRole="button"
          accessibilityLabel="Voir mon profil"
        >
          <Avatar name={username} size={52} />
          <View style={styles.userText}>
            <Text style={styles.username} numberOfLines={1}>
              @{username}
            </Text>
            {bio ? (
              <Text style={styles.bio} numberOfLines={2}>
                {bio}
              </Text>
            ) : (
              <Text style={styles.bioMuted}>Voir mon profil ›</Text>
            )}
          </View>
        </Pressable>

        {/* Shortcuts */}
        <Text style={styles.sectionLabel}>Raccourcis</Text>
        <View style={styles.section}>
          {TAB_SHORTCUTS.map((t) => {
            const isActive = active === t.name;
            return (
              <Pressable
                key={t.name}
                style={[styles.row, isActive && styles.rowActive]}
                onPress={() => goToTab(t.name)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={styles.rowIcon}>{t.icon}</Text>
                <Text style={[styles.rowLabel, isActive && styles.rowLabelActive]}>
                  {t.label}
                </Text>
                {isActive ? <View style={styles.activeDot} /> : null}
              </Pressable>
            );
          })}
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>Compte</Text>
        <View style={styles.section}>
          {accountRows.map((r) => (
            <Pressable
              key={r.label}
              style={styles.row}
              onPress={r.onPress}
              accessibilityRole="button"
            >
              <Text style={styles.rowIcon}>{r.icon}</Text>
              <Text style={styles.rowLabel}>{r.label}</Text>
              {r.badge && r.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {r.badge > 99 ? '99+' : r.badge}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Déconnexion pinned to the bottom */}
      <Pressable
        style={styles.signOut}
        onPress={confirmSignOut}
        disabled={signingOut}
        accessibilityRole="button"
      >
        <Text style={styles.signOutText}>
          {signingOut ? 'Déconnexion…' : 'Déconnexion'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scroll: {
    paddingBottom: spacing.lg,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: border.rule,
    borderBottomColor: colors.ink,
    backgroundColor: colors.bone,
  },
  userText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  username: {
    ...type.headlineLg,
    fontSize: 20,
    color: colors.ink,
  },
  bio: {
    ...type.bodySm,
    color: colors.inkSoft,
    marginTop: 2,
  },
  bioMuted: {
    ...type.micro,
    color: colors.muted,
    marginTop: 4,
  },
  sectionLabel: {
    ...type.labelSm,
    color: colors.muted,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  section: {
    borderTopWidth: border.hair,
    borderTopColor: colors.stock,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    borderBottomWidth: border.hair,
    borderBottomColor: colors.stock,
  },
  rowActive: {
    backgroundColor: colors.acid,
  },
  rowIcon: {
    fontSize: 18,
    width: 30,
  },
  rowLabel: {
    ...type.bodyMdMedium,
    fontSize: 15,
    color: colors.ink,
    flex: 1,
  },
  rowLabelActive: {
    fontFamily: type.headlineMd.fontFamily,
    color: colors.onAcid,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: radius.full,
    backgroundColor: colors.signal,
    borderWidth: border.hair,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...type.micro,
    fontSize: 10,
    letterSpacing: 0,
    color: colors.onSignal,
  },
  signOut: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    backgroundColor: colors.signal,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signOutText: {
    ...type.button,
    color: colors.onSignal,
  },
});
