import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';
import { Avatar } from '../components/common';
import { border, colors, radius, spacing, type } from '../theme/tokens';
import {
  MOCK_NOTIFICATIONS,
  type NotificationItem,
  type NotificationType,
} from '../lib/mockNotifications';

type Props = RootStackScreenProps<'Notifications'>;

type Tab = 'all' | 'unread';

const ICON: Record<NotificationType, string> = {
  applause: '👏',
  comment: '💬',
  follow: '➕',
  follow_request: '🔔',
  editorial: '✨',
};

export default function NotificationsScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('all');
  const [items, setItems] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  const visible = useMemo(
    () => (tab === 'unread' ? items.filter((n) => !n.read) : items),
    [items, tab]
  );

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  const open = (n: NotificationItem) => {
    // Mark this one read, then navigate to its target.
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
    );
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
        <Pressable onPress={markAllRead} hitSlop={8}>
          <Text style={styles.markRead}>Tout marquer comme lu</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {visible.length === 0 ? (
          <Text style={styles.empty}>Aucune notification.</Text>
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
                  <Text style={{ fontSize: 18 }}>{ICON[n.type]}</Text>
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
                  {ICON[n.type]} {n.date}
                </Text>
              </View>
              {!n.read ? <View style={styles.dot} /> : null}
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
  empty: {
    ...type.bodySm,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 60,
  },
});
