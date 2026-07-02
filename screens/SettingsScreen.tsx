import { useState, type ReactNode } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import { hapticSelect } from '../lib/haptics';
import { supabase } from '../lib/supabase';
import { border, colors, radius, spacing, type } from '../theme/tokens';

type Props = RootStackScreenProps<'Settings'>;

const APP_VERSION = '1.0.0';

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  onPress,
  right,
  danger,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      disabled={!onPress && !right}
    >
      <Text style={[styles.rowLabel, danger && styles.danger]}>{label}</Text>
      {right ?? (value ? <Text style={styles.rowValue}>{value}</Text> : null)}
    </Pressable>
  );
}

export default function SettingsScreen({ navigation }: Props) {
  // Notification toggles are centralized so they persist across navigation (E11).
  const { notificationSettings, setNotificationSetting } = useAppState();
  const toggleSetting = (key: 'push' | 'social' | 'editorial') => (v: boolean) => {
    hapticSelect();
    setNotificationSetting(key, v);
  };
  const [signingOut, setSigningOut] = useState(false);

  const noop = () =>
    Alert.alert('Bientôt disponible', 'Cette action sera bientôt disponible.');

  const confirmDelete = () =>
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes tes données seront supprimées. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: noop, // no-op for now
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title="Mon compte">
        <Row label="Prénom" value="Malo" onPress={noop} />
        <Row label="E-mail" value="malo@exemple.com" onPress={noop} />
        <Row label="Mot de passe" value="Modifier" onPress={noop} />
      </Section>

      <Section title="Notifications">
        <Row
          label="Notifications push"
          right={
            <Switch
              value={notificationSettings.push}
              onValueChange={toggleSetting('push')}
              trackColor={{ false: colors.stock, true: colors.acid }}
              thumbColor={colors.ink}
              ios_backgroundColor={colors.stock}
            />
          }
        />
        <Row
          label="Activité sociale"
          right={
            <Switch
              value={notificationSettings.social}
              onValueChange={toggleSetting('social')}
              trackColor={{ false: colors.stock, true: colors.acid }}
              thumbColor={colors.ink}
              ios_backgroundColor={colors.stock}
            />
          }
        />
        <Row
          label="Recommandations éditoriales"
          right={
            <Switch
              value={notificationSettings.editorial}
              onValueChange={toggleSetting('editorial')}
              trackColor={{ false: colors.stock, true: colors.acid }}
              thumbColor={colors.ink}
              ios_backgroundColor={colors.stock}
            />
          }
        />
      </Section>

      <Section title="Confidentialité">
        <Row label="Télécharger mes données" onPress={noop} />
        <Row label="Supprimer mon compte" danger onPress={confirmDelete} />
      </Section>

      <Section title="À propos">
        <Row label="Version" value={APP_VERSION} />
        <Row label="Conditions d'utilisation" onPress={noop} />
        <Row label="Politique de confidentialité" onPress={noop} />
      </Section>

      {/*
        E12 (future) — internal admin/editorial workflows. Placeholders only for
        now; a real admin panel will need Supabase + role-based access:
          - Gestion du catalogue (add/edit/remove shows)
          - Mise à jour hebdo des statuts (En ce moment / En tournée / Terminé)
          - Sélection éditoriale (feed + reco de la semaine)
          - Modération (reviews signalés, retrait de contenu, utilisateurs)
      */}
      <Section title="Espace interne (à venir)">
        <Row label="Gestion du catalogue" value="À venir" onPress={noop} />
        <Row label="Statuts hebdomadaires" value="À venir" onPress={noop} />
        <Row label="Sélection éditoriale" value="À venir" onPress={noop} />
        <Row label="Modération" value="À venir" onPress={noop} />
      </Section>

      <Pressable
        style={styles.signOut}
        onPress={confirmSignOut}
        disabled={signingOut}
      >
        <Text style={styles.signOutText}>
          {signingOut ? 'Déconnexion…' : 'Déconnexion'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { paddingVertical: spacing.lg, paddingBottom: spacing.xxl },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    ...type.labelSm,
    color: colors.muted,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.bone,
    marginHorizontal: spacing.md,
    borderRadius: radius.none,
    borderWidth: border.rule,
    borderColor: colors.ink,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: border.hair,
    borderBottomColor: colors.stock,
    minHeight: 52,
  },
  rowLabel: { ...type.bodyMdMedium, fontSize: 15, color: colors.ink },
  rowValue: { ...type.bodySm, color: colors.muted },
  danger: { color: colors.signal },
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
