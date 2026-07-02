import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import { Section, Row, settingsStyles } from '../components/SettingsUI';
import { Skeleton } from '../components/common';
import { supabase } from '../lib/supabase';
import { border, colors, radius, spacing, type } from '../theme/tokens';

type Props = RootStackScreenProps<'Settings'>;

const APP_VERSION = '1.0.0';

// Settings hub. Grouped into Account / Notifications / Privacy & safety / App /
// Legal / Danger zone. Fine-grained toggles live in the separate Preferences
// screen; this screen owns account identity, safety shortcuts (blocked users,
// reports), and the account-level danger actions. Placeholders (download data,
// delete account) are wired to confirm modals / "bientôt disponible" alerts —
// no destructive backend action exists yet.
export default function SettingsScreen({ navigation }: Props) {
  const { myProfile, refreshShows } = useAppState();
  const [email, setEmail] = useState<string | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Email lives on the auth user, not the profiles row — read it once.
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
      setLoadingEmail(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const comingSoon = () =>
    Alert.alert('Bientôt disponible', 'Cette action sera bientôt disponible.');

  const onRefreshCatalogue = async () => {
    setRefreshing(true);
    await refreshShows();
    setRefreshing(false);
    Alert.alert('Catalogue à jour', 'Le catalogue a été rechargé.');
  };

  const confirmDelete = () =>
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes tes données seront supprimées. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: comingSoon, // no destructive backend action yet
        },
      ]
    );

  const signOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
    }
  };

  const confirmSignOut = () =>
    Alert.alert('Déconnexion', 'Se déconnecter de ton compte ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: signOut },
    ]);

  return (
    <ScrollView
      style={settingsStyles.container}
      contentContainerStyle={settingsStyles.content}
    >
      <Section title="Mon compte">
        <Row
          icon="✉️"
          label="E-mail"
          value={email ?? '—'}
          right={loadingEmail ? <Skeleton width={140} height={14} /> : undefined}
        />
        <Row icon="@" label="Pseudo" value={myProfile ? `@${myProfile.username}` : '—'} />
        <Row
          icon="🔒"
          label="Visibilité"
          value={myProfile ? (myProfile.isPublic ? 'Public' : 'Privé') : '—'}
        />
        <Row
          icon="✏️"
          label="Modifier mon profil"
          chevron
          onPress={() => navigation.navigate('EditProfile')}
          last
        />
      </Section>

      <Section title="Notifications">
        <Row
          icon="🔔"
          label="Préférences de notification"
          chevron
          onPress={() => navigation.navigate('Preferences')}
          last
        />
      </Section>

      <Section title="Confidentialité et sécurité">
        <Row
          icon="🚫"
          label="Utilisateurs bloqués"
          chevron
          onPress={() => navigation.navigate('BlockedUsers')}
        />
        <Row
          icon="🚩"
          label="Signalements envoyés"
          chevron
          onPress={() => navigation.navigate('ReportsSent')}
        />
        <Row
          icon="🎛️"
          label="Préférences de confidentialité"
          chevron
          onPress={() => navigation.navigate('Preferences')}
        />
        <Row icon="⬇️" label="Télécharger mes données" chevron onPress={comingSoon} />
        <Row icon="🗑️" label="Supprimer mon compte" danger onPress={confirmDelete} last />
      </Section>

      <Section title="Application">
        <Row icon="🏷️" label="Version" value={APP_VERSION} />
        <Row
          icon="🔄"
          label={refreshing ? 'Actualisation…' : 'Actualiser le catalogue'}
          onPress={refreshing ? undefined : onRefreshCatalogue}
        />
        <Row icon="💬" label="Envoyer un avis / contact" chevron onPress={comingSoon} last />
      </Section>

      <Section title="Légal">
        <Row icon="📄" label="Conditions d'utilisation" chevron onPress={comingSoon} />
        <Row icon="🛡️" label="Politique de confidentialité" chevron onPress={comingSoon} />
        <Row icon="📃" label="Licences" chevron onPress={comingSoon} last />
      </Section>

      <Section title="Zone de danger">
        <Row icon="🚪" label="Déconnexion" danger onPress={confirmSignOut} />
        <Row icon="🗑️" label="Supprimer mon compte" danger onPress={confirmDelete} last />
      </Section>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  signOut: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: radius.none,
    borderWidth: border.rule,
    borderColor: colors.ink,
    backgroundColor: colors.signal,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signOutText: { ...type.button, color: colors.onSignal },
});
