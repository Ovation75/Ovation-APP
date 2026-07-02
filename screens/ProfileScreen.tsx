import { useLayoutEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import { Avatar, Rating } from '../components/common';
import { getUserById, type UserProfile } from '../lib/mockUsers';
import { border, colors, radius, spacing, type } from '../theme/tokens';

type Props = RootStackScreenProps<'Profile'>;

type ProfileTab = 'journal' | 'favoris' | 'playlists';

const TABS: { key: ProfileTab; label: string }[] = [
  { key: 'journal', label: 'Journal' },
  { key: 'favoris', label: 'Favoris' },
  { key: 'playlists', label: 'Playlists publiques' },
];

export default function ProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const user = getUserById(userId);
  const [tab, setTab] = useState<ProfileTab>('journal');
  // Follow status is shared so it persists when navigating away and back.
  const { isFollowing, toggleFollow } = useAppState();
  const following = isFollowing(userId);

  // Show a settings gear in the header when viewing your own profile.
  useLayoutEffect(() => {
    if (user?.isMe) {
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
    }
  }, [navigation, user?.isMe]);

  if (!user) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Profil introuvable.</Text>
      </View>
    );
  }

  // Private profile viewed by a non-approved follower: hide stats + content.
  const canSeeContent = user.isMe || user.isPublic || following;

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

        {user.isMe ? (
          <Pressable
            style={styles.editBtn}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.editBtnText}>Modifier</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.followBtn, following && styles.followingBtn]}
            onPress={() => toggleFollow(userId)}
          >
            <Text
              style={[
                styles.followBtnText,
                following && styles.followingBtnText,
              ]}
            >
              {following ? 'Abonné' : 'Suivre'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Block 2 — stats (self only) */}
      {user.isMe && <StatsBlock user={user} />}

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
                  style={[
                    styles.tabText,
                    tab === t.key && styles.tabTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <ProfileContent user={user} tab={tab} navigation={navigation} />
        </>
      ) : (
        <View style={styles.private}>
          <Text style={styles.privateLock}>🔒</Text>
          <Text style={styles.privateText}>Ce profil est privé</Text>
          <Text style={styles.privateSub}>
            Abonne-toi pour voir son journal et ses playlists.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function StatsBlock({ user }: { user: UserProfile }) {
  return (
    <View style={styles.stats}>
      <View style={styles.statItem}>
        <Text style={styles.statNum}>{user.stats.showsSeen}</Text>
        <Text style={styles.statLabel}>spectacles vus</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNum}>
          {user.stats.averageRating.toFixed(1).replace('.', ',')}
        </Text>
        <Text style={styles.statLabel}>note moyenne</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNum} numberOfLines={1}>
          {user.stats.topGenre}
        </Text>
        <Text style={styles.statLabel}>genre favori</Text>
      </View>
    </View>
  );
}

function ProfileContent({
  user,
  tab,
  navigation,
}: {
  user: UserProfile;
  tab: ProfileTab;
  navigation: Props['navigation'];
}) {
  const openShow = (showId: string, title: string) =>
    navigation.navigate('ShowDetail', { showId, title });

  if (tab === 'journal') {
    if (user.content.journal.length === 0) {
      return <Text style={styles.emptyList}>Aucun spectacle noté.</Text>;
    }
    return (
      <View style={styles.list}>
        {user.content.journal.map((log) => (
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
    if (user.content.favoris.length === 0) {
      return <Text style={styles.emptyList}>Aucun favori.</Text>;
    }
    return (
      <View style={styles.list}>
        {user.content.favoris.map((f) => (
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
  if (user.content.publicPlaylists.length === 0) {
    return <Text style={styles.emptyList}>Aucune playlist publique.</Text>;
  }
  return (
    <View style={styles.list}>
      {user.content.publicPlaylists.map((pl) => (
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
  },
  missingText: { ...type.bodyMd, color: colors.muted },
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
  followBtnText: { ...type.button, fontSize: 13, color: colors.onSignal },
  followingBtnText: { color: colors.onAcid },
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
