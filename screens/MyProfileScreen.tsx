import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import { AppHeader } from '../components/AppHeader';
import { Avatar, Rating } from '../components/common';
import { shareProfile } from '../lib/share';
import { hapticSelect } from '../lib/haptics';
import { border, colors, radius, spacing, type } from '../theme/tokens';

type Props = RootStackScreenProps<'MyProfile'>;

type ProfileTab = 'journal' | 'favoris' | 'playlists' | 'activite';

const TABS: { key: ProfileTab; label: string }[] = [
  { key: 'journal', label: 'Journal' },
  { key: 'favoris', label: 'Favoris' },
  { key: 'playlists', label: 'Playlists' },
  { key: 'activite', label: 'Activité' },
];

// Own-profile hub (E09). Everything here is the current user's real Supabase
// state (logs, wishlist, playlists, follows, notifications) surfaced through
// AppStateContext — no mock data. NOTE: there is no display_name column in the
// profiles table (see report), so only @username is shown.
export default function MyProfileScreen({ navigation }: Props) {
  const [tab, setTab] = useState<ProfileTab>('journal');
  const {
    myProfile,
    myProfileLoading,
    followerCount,
    followingCount,
    myStats,
    logs,
    logsLoading,
    wishlist,
    playlists,
    playlistsLoading,
    playlistItemCount,
    getPlaylistShowIds,
    getShowById,
    showsLoading,
    notifications,
  } = useAppState();

  const journal = useMemo(
    () =>
      [...logs]
        .sort((a, b) => b.sortKey - a.sortKey)
        .map((l) => ({
          id: l.id,
          showId: l.showId,
          title: getShowById(l.showId)?.title ?? l.showId,
          rating: l.rating,
          date: l.date,
        })),
    [logs, getShowById]
  );

  const favoris = useMemo(
    () =>
      playlists
        .filter((p) => p.isFavorites)
        .flatMap((p) => getPlaylistShowIds(p.id))
        .map((showId) => ({
          id: `fav-${showId}`,
          showId,
          title: getShowById(showId)?.title ?? showId,
        })),
    [playlists, getPlaylistShowIds, getShowById]
  );

  const publicPlaylists = useMemo(
    () =>
      playlists
        .filter((p) => p.isPublic)
        .map((p) => ({ id: p.id, name: p.name, emoji: p.emoji, count: playlistItemCount(p.id) })),
    [playlists, playlistItemCount]
  );

  const openShow = (showId: string, title: string) =>
    navigation.navigate('ShowDetail', { showId, title });

  const goToCarnet = (params: { tab?: 'journal' | 'playlists' | 'wishlist'; create?: boolean }) =>
    navigation.navigate('Main', {
      screen: 'Tabs',
      params: { screen: 'MonCarnet', params },
    });

  if (myProfileLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader title="Mon profil" variant="plain" onBack={() => navigation.goBack()} />
        <ActivityIndicator style={styles.loading} color={colors.ink} />
      </SafeAreaView>
    );
  }

  if (!myProfile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader title="Mon profil" variant="plain" onBack={() => navigation.goBack()} />
        <Text style={styles.missing}>Profil introuvable.</Text>
      </SafeAreaView>
    );
  }

  const { username, bio, isPublic } = myProfile;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title="Mon profil"
        variant="plain"
        onBack={() => navigation.goBack()}
        actions={[
          {
            icon: '↗',
            accessibilityLabel: 'Partager mon profil',
            onPress: () => {
              hapticSelect();
              shareProfile(username, bio);
            },
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Avatar name={username} size={80} />
          <Text style={styles.username}>@{username}</Text>
          {bio ? <Text style={styles.bio}>{bio}</Text> : null}
          <View style={[styles.badge, isPublic ? styles.badgePublic : styles.badgePrivate]}>
            <Text style={[styles.badgeText, isPublic ? styles.badgeTextPublic : styles.badgeTextPrivate]}>
              {isPublic ? 'Public' : 'Privé'}
            </Text>
          </View>
          <View style={styles.counts}>
            <Text style={styles.count}>
              <Text style={styles.countNum}>{followerCount}</Text> abonnés
            </Text>
            <Text style={styles.count}>
              <Text style={styles.countNum}>{followingCount}</Text> abonnements
            </Text>
          </View>
        </View>

        {/* Quick stats */}
        <View style={styles.statsGrid}>
          <Stat value={String(myStats.showsSeen)} label="Vus" />
          <Stat
            value={myStats.averageRating.toFixed(1).replace('.', ',')}
            label="Note moy."
          />
          <Stat value={myStats.topGenre} label="Genre" />
          <Stat value={String(wishlist.length)} label="Wishlist" />
          <Stat value={String(playlists.length)} label="Playlists" />
        </View>

        {/* Quick actions */}
        <View style={styles.actions}>
          <ActionBtn
            label="Modifier"
            primary
            onPress={() => navigation.navigate('EditProfile')}
          />
          <ActionBtn label="Wishlist" onPress={() => goToCarnet({ tab: 'wishlist' })} />
          <ActionBtn
            label="Créer playlist"
            onPress={() => goToCarnet({ tab: 'playlists', create: true })}
          />
          <ActionBtn
            label="Partager"
            onPress={() => {
              hapticSelect();
              shareProfile(username, bio);
            }}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((t, i) => (
            <Pressable
              key={t.key}
              style={[styles.tabBtn, i > 0 && styles.tabBtnDivider, tab === t.key && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === t.key }}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'journal' &&
          (logsLoading || showsLoading ? (
            <ActivityIndicator style={styles.loading} color={colors.ink} />
          ) : journal.length === 0 ? (
            <Empty text="Aucun spectacle noté." />
          ) : (
            <View style={styles.list}>
              {journal.map((l) => (
                <Pressable
                  key={l.id}
                  style={styles.listRow}
                  onPress={() => openShow(l.showId, l.title)}
                >
                  <View style={styles.listText}>
                    <Text style={styles.listTitle}>{l.title}</Text>
                    <Text style={styles.listSub}>{l.date}</Text>
                  </View>
                  <Rating value={l.rating} />
                </Pressable>
              ))}
            </View>
          ))}

        {tab === 'favoris' &&
          (favoris.length === 0 ? (
            <Empty text="Aucun favori." />
          ) : (
            <View style={styles.list}>
              {favoris.map((f) => (
                <Pressable
                  key={f.id}
                  style={styles.listRow}
                  onPress={() => openShow(f.showId, f.title)}
                >
                  <Text style={styles.listTitle}>{f.title}</Text>
                </Pressable>
              ))}
            </View>
          ))}

        {tab === 'playlists' &&
          (playlistsLoading ? (
            <ActivityIndicator style={styles.loading} color={colors.ink} />
          ) : publicPlaylists.length === 0 ? (
            <Empty text="Aucune playlist publique." />
          ) : (
            <View style={styles.list}>
              {publicPlaylists.map((pl) => (
                <Pressable
                  key={pl.id}
                  style={styles.listRow}
                  onPress={() =>
                    navigation.navigate('PlaylistDetail', { playlistId: pl.id, name: pl.name })
                  }
                >
                  <Text style={styles.playlistEmoji}>{pl.emoji}</Text>
                  <View style={styles.listText}>
                    <Text style={styles.listTitle}>{pl.name}</Text>
                    <Text style={styles.listSub}>
                      {pl.count} spectacle{pl.count > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </View>
          ))}

        {tab === 'activite' &&
          (notifications.length === 0 ? (
            <Empty text="Aucune activité récente." />
          ) : (
            <View style={styles.list}>
              {notifications.slice(0, 20).map((n) => (
                <View key={n.id} style={styles.listRow}>
                  <View style={styles.listText}>
                    <Text style={styles.listTitle}>
                      {n.actorUsername ? `@${n.actorUsername} ` : ''}
                      <Text style={styles.activityText}>{n.text}</Text>
                    </Text>
                    <Text style={styles.listSub}>{n.date}</Text>
                  </View>
                  {!n.read ? <View style={styles.unreadDot} /> : null}
                </View>
              ))}
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statNum} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionBtn({
  label,
  onPress,
  primary,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      style={[styles.actionBtn, primary && styles.actionBtnPrimary]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={[styles.actionBtnText, primary && styles.actionBtnTextPrimary]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Empty({ text }: { text: string }) {
  return <Text style={styles.emptyList}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: spacing.xl },
  loading: { marginTop: spacing.xl },
  missing: {
    ...type.bodyMd,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  username: {
    ...type.displayMd,
    fontSize: 26,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  bio: {
    ...type.bodySm,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  badge: {
    marginTop: spacing.sm,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  badgePublic: { backgroundColor: colors.acid },
  badgePrivate: { backgroundColor: colors.ink },
  badgeText: { ...type.micro },
  badgeTextPublic: { color: colors.onAcid },
  badgeTextPrivate: { color: colors.onInk },
  counts: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  count: { ...type.micro, color: colors.muted },
  countNum: { fontFamily: type.headlineMd.fontFamily, color: colors.ink },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    borderWidth: border.rule,
    borderColor: colors.ink,
    backgroundColor: colors.bone,
  },
  statItem: {
    width: '20%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxs,
  },
  statNum: { ...type.displayMd, fontSize: 18, color: colors.ink },
  statLabel: {
    ...type.micro,
    fontSize: 9,
    color: colors.muted,
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
  },
  actionBtn: {
    flexGrow: 1,
    minWidth: '47%',
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    backgroundColor: colors.paper,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  actionBtnPrimary: { backgroundColor: colors.signal },
  actionBtnText: { ...type.button, fontSize: 12, color: colors.ink },
  actionBtnTextPrimary: { color: colors.onSignal },
  tabRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    borderWidth: border.rule,
    borderColor: colors.ink,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  tabBtnDivider: { borderLeftWidth: border.rule, borderLeftColor: colors.ink },
  tabBtnActive: { backgroundColor: colors.ink },
  tabText: { ...type.button, fontSize: 11, color: colors.ink },
  tabTextActive: { color: colors.acid },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: border.rule,
    borderBottomColor: colors.ink,
  },
  listText: { flex: 1 },
  listTitle: { ...type.headlineMd, fontSize: 15, color: colors.ink },
  activityText: { ...type.bodySm, color: colors.inkSoft },
  listSub: { ...type.micro, color: colors.muted, marginTop: 2 },
  playlistEmoji: { fontSize: 22, width: 34 },
  chevron: { fontSize: 22, color: colors.ink },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.signal,
    marginLeft: spacing.sm,
  },
  emptyList: {
    ...type.bodySm,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
