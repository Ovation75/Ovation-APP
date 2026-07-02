import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import { Avatar, EmptyState } from '../components/common';
import { hapticSelect } from '../lib/haptics';
import { border, colors, radius, spacing, type } from '../theme/tokens';
import { NOTIF_ICON, type NotificationItem } from '../lib/notifications';

type Props = RootStackScreenProps<'Notifications'>;

type Tab = 'all' | 'unread';

export default function NotificationsScreen({ navigation }: Props) {
  // Read/unread + deletion live in the shared app state, backed by the real
  // `notifications` table, so they persist across reloads (E10). NOTE: since
  // there is no seeded real multi-user data yet, this list will stay empty
  // in practice until another real user follows/applauds the current user.
  const {
    notifications,
    notificationsLoading,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useAppState();
  const [tab, setTab] = useState<Tab>('all');

  const visible = useMemo(
    () => (tab === 'unread' ? notifications.filter((n) => !n.read) : notifications),
    [notifications, tab]
  );

  const open = (n: NotificationItem) => {
    // Mark this one read, then navigate to its target.
    markNotificationRead(n.id);
    if (n.target.screen === 'Profile') {
      navigation.navigate('Profile', {
        userId: n.target.userId,
        username: n.target.username,
      });
    } else {
      navigation.navigate('ShowDetail', {
        showId: n.target.showId,
        title: n.target.title,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.tabs}>
          {(['all', 'unread'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'all' ? 'Toutes' : 'Non lues'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() => {
            hapticSelect();
            markAllNotificationsRead();
          }}
          hitSlop={12}
          accessibilityRole="button"
        >
          <Text style={styles.markRead}>Tout marquer comme lu</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {notificationsLoading ? (
          <ActivityIndicator style={styles.loading} color={colors.ink} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="🔔"
            title={tab === 'unread' ? 'Tout est lu' : 'Aucune notification'}
            message={
              tab === 'unread'
                ? 'Tu es à jour — aucune notification non lue.'
                : 'Ton activité et les recos Ovation apparaîtront ici.'
            }
            ctaLabel={tab === 'unread' ? 'Voir toutes' : undefined}
            onCtaPress={tab === 'unread' ? () => setTab('all') : undefined}
          />
        ) : (
          visible.map((n) => (
            <Pressable
              key={n.id}
              style={[styles.row, !n.read && styles.rowUnread]}
              onPress={() => open(n)}
            >
              {n.actorUsername ? (
                <Avatar name={n.actorUsername} size={40} />
              ) : (
                <View style={styles.editorialIcon}>
                  <Text style={{ fontSize: 18 }}>{NOTIF_ICON[n.type]}</Text>
                </View>
              )}
              <View style={styles.rowText}>
                <Text style={styles.rowMain}>
                  {n.actorUsername ? (
                    <Text style={styles.actor}>{n.actorUsername} </Text>
                  ) : null}
                  {n.text}
                </Text>
                <Text style={styles.date}>
                  {NOTIF_ICON[n.type]} {n.date}
                </Text>
              </View>
              {!n.read ? <View style={styles.dot} /> : null}
              <Pressable
                hitSlop={14}
                onPress={() => {
                  hapticSelect();
                  deleteNotification(n.id);
                }}
                accessibilityRole="button"
                accessibilityLabel="Supprimer la notification"
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteText}>✕</Text>
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: border.rule,
    borderBottomColor: colors.ink,
  },
  tabs: { flexDirection: 'row', gap: spacing.xs },
  // Pill tabs — the chip anatomy (full radius) is sanctioned for tab counters.
  tab: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: border.rule,
    borderColor: colors.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.bone,
  },
  tabActive: { backgroundColor: colors.ink },
  tabText: { ...type.labelSm, color: colors.ink },
  tabTextActive: { color: colors.acid },
  markRead: { ...type.micro, color: colors.cobalt },
  list: { padding: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.none,
  },
  rowUnread: {
    backgroundColor: colors.bone,
    borderWidth: border.rule,
    borderColor: colors.ink,
  },
  editorialIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.none,
    borderWidth: border.rule,
    borderColor: colors.ink,
    backgroundColor: colors.acid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, marginLeft: spacing.sm },
  rowMain: { ...type.bodySm, color: colors.inkSoft },
  actor: { fontFamily: type.headlineMd.fontFamily, color: colors.ink },
  date: { ...type.micro, color: colors.muted, marginTop: 3 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    borderWidth: border.hair,
    borderColor: colors.ink,
    backgroundColor: colors.signal,
    marginLeft: spacing.xs,
  },
  deleteBtn: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.xxs,
  },
  deleteText: { fontSize: 14, color: colors.muted },
  loading: { marginTop: spacing.xxl },
});
