import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import { Avatar, EmptyState } from '../components/common';
import { settingsStyles } from '../components/SettingsUI';
import { getUserById } from '../lib/mockUsers';
import { isUuid } from '../lib/uuid';
import { supabase } from '../lib/supabase';
import { hapticImpact } from '../lib/haptics';
import { border, colors, radius, spacing, type } from '../theme/tokens';

type Props = RootStackScreenProps<'BlockedUsers'>;

// Blocked Users. `blockedUsers` (from AppStateContext) is a list of user ids —
// real uuids (persisted in the `blocks` table) mixed with mock ids for the
// still-mocked demo users. Real-uuid usernames are resolved from `profiles`;
// mock ids resolve from lib/mockUsers. Unblock delegates to the context, which
// already routes uuid vs. mock ids to Supabase vs. local state.
export default function BlockedUsersScreen(_props: Props) {
  const { blockedUsers, unblockUser } = useAppState();
  const [names, setNames] = useState<Record<string, string>>({});

  // Resolve usernames for any real (uuid) blocked ids from `profiles`.
  useEffect(() => {
    const uuids = blockedUsers.filter(isUuid);
    if (uuids.length === 0) return;
    let active = true;
    supabase
      .from('profiles')
      .select('id, username')
      .in('id', uuids)
      .then(({ data }) => {
        if (!active || !data) return;
        setNames((prev) => {
          const next = { ...prev };
          for (const row of data as { id: string; username: string }[]) {
            next[row.id] = row.username;
          }
          return next;
        });
      });
    return () => {
      active = false;
    };
  }, [blockedUsers]);

  const displayName = (id: string): string => {
    if (isUuid(id)) return names[id] ?? 'Utilisateur';
    return getUserById(id)?.username ?? 'Utilisateur';
  };

  const confirmUnblock = (id: string) => {
    const name = displayName(id);
    Alert.alert(
      'Débloquer',
      `Débloquer @${name} ? Cette personne pourra de nouveau voir ton profil et interagir avec toi.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Débloquer',
          style: 'destructive',
          onPress: () => {
            hapticImpact();
            unblockUser(id);
          },
        },
      ]
    );
  };

  if (blockedUsers.length === 0) {
    return (
      <View style={settingsStyles.container}>
        <EmptyState
          icon="🚫"
          title="Aucun blocage"
          message="Tu n'as bloqué personne. Les personnes que tu bloques apparaîtront ici."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={settingsStyles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        {blockedUsers.map((id, i) => {
          const name = displayName(id);
          return (
            <View
              key={id}
              style={[styles.row, i === blockedUsers.length - 1 && styles.rowLast]}
            >
              <Avatar name={name} size={40} />
              <Text style={styles.username} numberOfLines={1}>
                @{name}
              </Text>
              <Pressable
                style={styles.unblockBtn}
                onPress={() => confirmUnblock(id)}
                accessibilityRole="button"
                accessibilityLabel={`Débloquer ${name}`}
              >
                <Text style={styles.unblockText}>Débloquer</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.bone,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 60,
    borderBottomWidth: border.hair,
    borderBottomColor: colors.stock,
  },
  rowLast: { borderBottomWidth: 0 },
  username: { ...type.bodyMdMedium, fontSize: 15, color: colors.ink, flex: 1 },
  unblockBtn: {
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  unblockText: { ...type.button, fontSize: 12, color: colors.ink },
});
