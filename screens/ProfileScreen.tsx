import { useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';
import { useAppState, type MyStats } from '../contexts/AppStateContext';
import { Avatar, PulsePressable, Rating } from '../components/common';
import { hapticImpact, hapticSelect } from '../lib/haptics';
import { getUserById } from '../lib/mockUsers';
import { border, colors, radius, spacing, type } from '../theme/tokens';

type Props = RootStackScreenProps<'Profile'>;

type ProfileTab = 'journal' | 'favoris' | 'playlists';

const TABS: { key: ProfileTab; label: string }[] = [
  { key: 'journal', label: 'Journal' },
  { key: 'favoris', label: 'Favoris' },
  { key: 'playlists', label: 'Playlists publiques' },
];

// Normalized content shape rendered by ProfileContent, sourced from centralized
// state for the current user and from the mock for other users.
type PContent = {
  journal: { id: string; showId: string; title: string; rating: number; date: string }[];
  favoris: { id: string; showId: string; title: string }[];
  playlists: { id: string; name: string; itemCount: number }[];
};

// Header fields, normalized across the two sources: real (current user, from
// Supabase) or mock (the three "other users" — no real multi-user data is
// seeded yet, see AppStateContext's doc comment).
type ProfileHeader = {
  username: string;
  bio: string | null;
  isPublic: boolean;
  isMe: boolean;
  followers: number;
  following: number;
};

export default function ProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const [tab, setTab] = useState<ProfileTab>('journal');
  const {
    currentUserId,
    myProfile,
    myProfileLoading,
    followerCount,
    followingCount,
    getFollowStatus,
    followUser,
    requestFollow,
    unfollowUser,
    myStats,
    logs,
    logsLoading,
    playlists,
    playlistsLoading,
    getPlaylistShowIds,
    playlistItemCount,
    getShowById,
    showsLoading,
    isBlocked,
    blockUser,
    unblockUser,
    reportContent,
  } = useAppState();

  const isMe = userId === currentUserId;
  const mockUser = !isMe ? getUserById(userId) : undefined;

  // Own profile is real (Supabase); the three "other users" stay mocked.
  // There is no generic "fetch any real user's profile" path yet — the only
  // real uuid this screen can ever be opened with today is `currentUserId`
  // itself (see AppStateContext's doc comment for the full gap list).
  const user: ProfileHeader | undefined = isMe
    ? myProfile
      ? {
          username: myProfile.username,
          bio: myProfile.bio,
          isPublic: myProfile.isPublic,
          isMe: true,
          followers: followerCount,
          following: followingCount,
        }
      : undefined
    : mockUser
    ? {
        username: mockUser.username,
        bio: mockUser.bio,
        isPublic: mockUser.isPublic,
        isMe: false,
        followers: mockUser.followers,
        following: mockUser.following,
      }
    : undefined;

  const status = getFollowStatus(userId);
  const blocked = isBlocked(userId);

  // Header actions: settings gear on your own profile, a "⋯" moderation menu
  // on someone else's.
  useLayoutEffect(() => {
    if (isMe) {
      navigation.setOptions({
        headerRight: () => (
          <Pressable
            hitSlop={12}
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Paramètres"
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </Pressable>
        ),
      });
    } else if (user) {
      navigation.setOptions({
        headerRight: () => (
          <Pressable
            hitSlop={12}
            onPress={() =>
              Alert.alert(`@${user.username}`, undefined, [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Signaler ce profil',
                  onPress: () => {
                    reportContent('profile', userId, 'Profil inapproprié');
                    Alert.alert('Merci', 'Ce profil a été signalé.');
                  },
                },
                {
                  text: isBlocked(userId) ? 'Débloquer' : "Bloquer l'utilisateur",
                  style: 'destructive',
                  onPress: () => {
                    hapticImpact();
                    isBlocked(userId) ? unblockUser(userId) : blockUser(userId);
                  },
                },
              ])
            }
            accessibilityLabel="Options"
          >
            <Text style={{ fontSize: 22 }}>⋯</Text>
          </Pressable>
        ),
      });
    }
  }, [navigation, isMe, user, userId, isBlocked, blockUser, unblockUser, reportContent]);

  // Build the content shown in the tabs from the right source.
  const content = useMemo<PContent>(() => {
    if (isMe) {
      const journal = [...logs]
        .sort((a, b) => b.sortKey - a.sortKey)
        .map((l) => {
          const show = getShowById(l.showId);
          return {
            id: l.id,
            showId: l.showId,
            title: show?.title ?? l.showId,
            rating: l.rating,
            date: l.date,
          };
        });
      const favoris = playlists
        .filter((p) => p.isFavorites)
        .flatMap((p) => getPlaylistShowIds(p.id))
        .map((showId) => ({
          id: `fav-${showId}`,
          showId,
          title: getShowById(showId)?.title ?? showId,
        }));
      const myPlaylists = playlists
        .filter((p) => p.isPublic)
        .map((p) => ({
          id: p.id,
          name: p.name,
          itemCount: playlistItemCount(p.id),
        }));
      return { journal, favoris, playlists: myPlaylists };
    }
    if (!mockUser) return { journal: [], favoris: [], playlists: [] };
    return {
      journal: mockUser.content.journal,
      favoris: mockUser.content.favoris,
      playlists: mockUser.content.publicPlaylists,
    };
  }, [isMe, mockUser, logs, playlists, getShowById, getPlaylistShowIds, playlistItemCount]);

  if (isMe && myProfileLoading) {
    return (
      <View style={styles.missing}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Profil introuvable.</Text>
      </View>
    );
  }

  // Blocked users are hidden entirely.
  if (blocked) {
    return (
      <View style={styles.missing}>
        <Text style={styles.privateLock}>🚫</Text>
        <Text style={styles.privateText}>Utilisateur bloqué</Text>
        <Pressable
          style={styles.unblockBtn}
          onPress={() => unblockUser(userId)}
        >
          <Text style={styles.unblockText}>Débloquer</Text>
        </Pressable>
      </View>
    );
  }

  // Private profile: content visible only to approved followers (E09).
  const canSeeContent = user.isMe || user.isPublic || status === 'approved';

  // Stats: computed from centralized logs for the current user.
  const stats: MyStats = user.isMe ? myStats : mockUser!.stats;

  const renderFollowButton = () => {
    if (user.isMe) {
      return (
        <Pressable
          style={styles.editBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.editBtnText}>Modifier</Text>
        </Pressable>
      );
    }
    // Public profile: instant follow / unfollow.
    if (user.isPublic) {
      const approved = status === 'approved';
      return (
        <PulsePressable
          style={[styles.followBtn, approved && styles.followingBtn]}
          onPress={() => {
            hapticSelect();
            approved ? unfollowUser(userId) : followUser(userId);
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: approved }}
        >
          <Text
            style={[styles.followBtnText, approved && styles.followingBtnText]}
          >
            {approved ? 'Abonné' : 'Suivre'}
          </Text>
        </PulsePressable>
      );
    }
    // Private profile: request -> pending -> approved.
    if (status === 'approved') {
      return (
        <PulsePressable
          style={[styles.followBtn, styles.followingBtn]}
          onPress={() => {
            hapticSelect();
            unfollowUser(userId);
          }}
          accessibilityRole="button"
        >
          <Text style={[styles.followBtnText, styles.followingBtnText]}>
            Abonné
          </Text>
        </PulsePressable>
      );
    }
    if (status === 'pending') {
      return (
        <PulsePressable
          style={[styles.followBtn, styles.pendingBtn]}
          onPress={() => {
            hapticSelect();
            unfollowUser(userId);
          }}
          accessibilityRole="button"
        >
          <Text style={[styles.followBtnText, styles.pendingBtnText]}>
            Demande envoyée
          </Text>
        </PulsePressable>
      );
    }
    return (
      <PulsePressable
        style={styles.followBtn}
        onPress={() => {
          hapticSelect();
          requestFollow(userId);
        }}
        accessibilityRole="button"
      >
        <Text style={styles.followBtnText}>Demander</Text>
      </PulsePressable>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Block 1 — header */}
      <View style={styles.header}>
        <Avatar name={user.username} size={72} />
        <Text style={styles.username}>@{user.username}</Text>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        <View style={styles.counts}>
          <Text style={styles.count}>
            <Text style={styles.countNum}>{user.followers}</Text> abonnés
          </Text>
          <Text style={styles.count}>
            <Text style={styles.countNum}>{user.following}</Text> abonnements
          </Text>
        </View>
        {renderFollowButton()}
      </View>

      {/* Block 2 — stats (self only) */}
      {user.isMe && <StatsBlock stats={stats} />}

      {/* Block 3 — content tabs */}
      {canSeeContent ? (
        <>
          <View style={styles.tabRow}>
            {TABS.map((t, i) => (
              <Pressable
                key={t.key}
                style={[
                  styles.tabBtn,
                  i > 0 && styles.tabBtnDivider,
                  tab === t.key && styles.tabBtnActive,
                ]}
                onPress={() => setTab(t.key)}
              >
                <Text
                  style={[styles.tabText, tab === t.key && styles.tabTextActive]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {isMe && (logsLoading || playlistsLoading || showsLoading) ? (
            <ActivityIndicator style={styles.contentLoading} color={colors.ink} />
          ) : (
            <ProfileContent content={content} tab={tab} navigation={navigation} />
          )}
        </>
      ) : (
        <View style={styles.private}>
          <Text style={styles.privateLock}>🔒</Text>
          <Text style={styles.privateText}>Ce profil est privé</Text>
          <Text style={styles.privateSub}>
            {status === 'pending'
              ? 'Ta demande est en attente d’approbation.'
              : 'Demande à suivre pour voir son journal et ses playlists.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function StatsBlock({ stats }: { stats: MyStats }) {
  return (
    <View style={styles.stats}>
      <View style={styles.statItem}>
        <Text style={styles.statNum}>{stats.showsSeen}</Text>
        <Text style={styles.statLabel}>spectacles vus</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNum}>
          {stats.averageRating.toFixed(1).replace('.', ',')}
        </Text>
        <Text style={styles.statLabel}>note moyenne</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNum} numberOfLines={1}>
          {stats.topGenre}
        </Text>
        <Text style={styles.statLabel}>genre favori</Text>
      </View>
    </View>
  );
}

function ProfileContent({
  content,
  tab,
  navigation,
}: {
  content: PContent;
  tab: ProfileTab;
  navigation: Props['navigation'];
}) {
  const openShow = (showId: string, title: string) =>
    navigation.navigate('ShowDetail', { showId, title });

  if (tab === 'journal') {
    if (content.journal.length === 0) {
      return <Text style={styles.emptyList}>Aucun spectacle noté.</Text>;
    }
    return (
      <View style={styles.list}>
        {content.journal.map((log) => (
          <Pressable
            key={log.id}
            style={styles.listRow}
            onPress={() => openShow(log.showId, log.title)}
          >
            <View style={styles.listText}>
              <Text style={styles.listTitle}>{log.title}</Text>
              <Text style={styles.listSub}>{log.date}</Text>
            </View>
            <Rating value={log.rating} />
          </Pressable>
        ))}
      </View>
    );
  }

  if (tab === 'favoris') {
    if (content.favoris.length === 0) {
      return <Text style={styles.emptyList}>Aucun favori.</Text>;
    }
    return (
      <View style={styles.list}>
        {content.favoris.map((f) => (
          <Pressable
            key={f.id}
            style={styles.listRow}
            onPress={() => openShow(f.showId, f.title)}
          >
            <Text style={styles.listTitle}>{f.title}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  // playlists
  if (content.playlists.length === 0) {
    return <Text style={styles.emptyList}>Aucune playlist publique.</Text>;
  }
  return (
    <View style={styles.list}>
      {content.playlists.map((pl) => (
        <Pressable
          key={pl.id}
          style={styles.listRow}
          onPress={() =>
            navigation.navigate('PlaylistDetail', {
              playlistId: pl.id,
              name: pl.name,
            })
          }
        >
          <View style={styles.listText}>
            <Text style={styles.listTitle}>{pl.name}</Text>
            <Text style={styles.listSub}>{pl.itemCount} spectacles</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: spacing.xl },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.xl,
  },
  missingText: { ...type.bodyMd, color: colors.muted },
  contentLoading: { marginTop: spacing.xl },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  username: {
    ...type.displayMd,
    fontSize: 24,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  bio: {
    ...type.bodySm,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  counts: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  count: { ...type.micro, color: colors.muted },
  countNum: { fontFamily: type.headlineMd.fontFamily, color: colors.ink },
  editBtn: {
    marginTop: spacing.md,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  editBtnText: { ...type.button, fontSize: 13, color: colors.ink },
  followBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.signal,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  followingBtn: {
    backgroundColor: colors.acid,
  },
  pendingBtn: {
    backgroundColor: colors.stock,
  },
  followBtnText: { ...type.button, fontSize: 13, color: colors.onSignal },
  followingBtnText: { color: colors.onAcid },
  pendingBtnText: { color: colors.muted },
  unblockBtn: {
    marginTop: spacing.md,
    borderWidth: border.rule,
    borderColor: colors.ink,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  unblockText: { ...type.button, fontSize: 13, color: colors.ink },
  stats: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.none,
    borderWidth: border.rule,
    borderColor: colors.ink,
    backgroundColor: colors.bone,
  },
  statItem: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xxs },
  statNum: { ...type.displayMd, fontSize: 20, color: colors.ink },
  statLabel: {
    ...type.micro,
    color: colors.muted,
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
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
  tabBtnDivider: {
    borderLeftWidth: border.rule,
    borderLeftColor: colors.ink,
  },
  tabBtnActive: { backgroundColor: colors.ink },
  tabText: { ...type.button, fontSize: 12, color: colors.ink },
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
  listSub: { ...type.micro, color: colors.muted, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.ink },
  emptyList: {
    ...type.bodySm,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  private: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: spacing.xl,
  },
  privateLock: { fontSize: 36, marginBottom: spacing.sm },
  privateText: { ...type.headlineLg, color: colors.ink },
  privateSub: {
    ...type.bodySm,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
