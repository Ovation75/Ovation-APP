import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TabScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import {
  Avatar,
  Poster,
  PressableScale,
  PulsePressable,
  Rating,
} from '../components/common';
import { hapticSelect } from '../lib/haptics';
import { shuffle } from '../lib/shuffle';
import { border, colors, fonts, radius, spacing, type } from '../theme/tokens';
import {
  MOCK_FEED,
  type CommunityActivityItem,
  type EditorialItem,
  type FeedItem,
  type FeedShow,
  type FeedUser,
  type ShowDiscoveryItem,
} from '../lib/mockFeed';

type Props = TabScreenProps<'Feed'>;

function CommunityCard({
  item,
  onOpenShow,
  onOpenProfile,
}: {
  item: CommunityActivityItem;
  onOpenShow: (show: FeedShow) => void;
  onOpenProfile: (user: FeedUser) => void;
}) {
  return (
    <View style={styles.card}>
      <Pressable
        style={styles.communityHeader}
        onPress={() => onOpenProfile(item.user)}
        accessibilityRole="button"
        accessibilityLabel={`Profil de ${item.user.username}`}
      >
        <Avatar name={item.user.username} />
        <View style={styles.communityHeaderText}>
          <Text style={styles.username}>{item.user.username}</Text>
          <Text style={styles.metaDate}>{item.date}</Text>
        </View>
      </Pressable>

      {item.action === 'log' ? (
        <>
          <Pressable onPress={() => onOpenShow(item.show)}>
            <Text style={styles.activityLine}>
              a noté <Text style={styles.showTitle}>{item.show.title}</Text>
            </Text>
          </Pressable>
          <Rating value={item.rating} />
          {item.reviewSnippet ? (
            <Text style={styles.review} numberOfLines={3}>
              {item.reviewSnippet}
            </Text>
          ) : null}
        </>
      ) : (
        <Pressable onPress={() => onOpenShow(item.show)}>
          <Text style={styles.activityLine}>
            a ajouté <Text style={styles.showTitle}>{item.show.title}</Text> à
            ses Favoris
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function DiscoveryCard({
  item,
  active,
  logged,
  finished,
  stats,
  onOpenShow,
  onWishlist,
}: {
  item: ShowDiscoveryItem;
  active: boolean;
  logged: boolean;
  finished: boolean;
  stats: { rating: number; logCount: number };
  onOpenShow: (show: FeedShow) => void;
  onWishlist: (show: FeedShow) => void;
}) {
  // Wishlist rules (E07): logged shows read "Déjà vu", finished shows disable.
  const disabled = logged || finished;
  const label = logged
    ? '✓ Déjà vu'
    : finished
    ? 'Terminé'
    : active
    ? '✓ Dans la wishlist'
    : '+ Wishlist';
  return (
    <View style={[styles.card, styles.discoveryCard]}>
      <PressableScale onPress={() => onOpenShow(item.show)}>
        <Poster style={styles.showVisual} />
        <Text style={styles.discoveryTitle}>{item.show.title}</Text>
        <Text style={styles.venue}>{item.venue}</Text>
        {stats.logCount > 0 ? (
          <Rating value={stats.rating} />
        ) : (
          <Text style={styles.noRating}>Aucun avis</Text>
        )}
      </PressableScale>
      <PulsePressable
        style={[
          styles.wishlistBtn,
          active && !disabled && styles.wishlistBtnActive,
          disabled && styles.wishlistBtnDisabled,
        ]}
        onPress={() => !disabled && onWishlist(item.show)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ selected: active, disabled }}
        accessibilityLabel={`Ajouter ${item.show.title} à la wishlist`}
      >
        <Text
          style={[
            styles.wishlistBtnText,
            active && !disabled && styles.wishlistBtnTextActive,
          ]}
        >
          {label}
        </Text>
      </PulsePressable>
    </View>
  );
}

function EditorialCard({
  item,
  onOpenShow,
}: {
  item: EditorialItem;
  onOpenShow: (show: FeedShow) => void;
}) {
  return (
    <PressableScale
      style={[styles.card, styles.editorialCard]}
      onPress={() => onOpenShow(item.show)}
    >
      <Text style={styles.editorialTag}>ÉDITO OVATION</Text>
      <Text style={styles.editorialBlurb}>{item.blurb}</Text>
      <Text style={styles.editorialShow}>{item.show.title} →</Text>
    </PressableScale>
  );
}

export default function FeedScreen({ navigation }: Props) {
  // Wishlist + logs are shared app-wide (real Supabase data) so this stays in
  // sync with the Fiche Spectacle and Mon Carnet. MOCK_FEED itself (community
  // activity from camille_p/theo.m/sofia + discovery/editorial cards) is
  // still 100% mock — no real multi-user data is seeded yet — and its show
  // ids ('s2', 's5'...) predate the real catalogue, so they won't resolve to
  // a real show; tapping one shows "Spectacle introuvable" rather than
  // crashing. See AppStateContext's module doc comment for the full gap list.
  const {
    isWishlisted,
    toggleWishlist,
    isLogged,
    isBlocked,
    logs,
    unreadCount,
    getShowStats,
    getShowById,
    currentUserId,
    refreshShows,
  } = useAppState();

  // Pull-to-refresh: re-shuffles the still-mocked community/discovery/
  // editorial stream (no real ranked query exists for it yet) AND refetches
  // the real show catalogue, so both halves of this mixed screen refresh.
  const [baseFeed, setBaseFeed] = useState<FeedItem[]>(MOCK_FEED);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshShows();
    setBaseFeed(shuffle(MOCK_FEED));
    setRefreshing(false);
  };

  // Feed = the mocked stream (minus blocked users) with the current user's most
  // recent log prepended as their own community activity (E05 wiring).
  const feed = useMemo<FeedItem[]>(() => {
    const base = baseFeed.filter(
      (i) => i.kind !== 'community' || !isBlocked(i.user.id)
    );
    const latest = [...logs].sort((a, b) => b.sortKey - a.sortKey)[0];
    const show = latest ? getShowById(latest.showId) : undefined;
    if (latest && show && currentUserId) {
      const myCard: CommunityActivityItem = {
        kind: 'community',
        id: `me-${latest.id}`,
        user: { id: currentUserId, username: 'malo', avatarUrl: null },
        show: { id: show.id, title: show.title },
        action: 'log',
        rating: latest.rating,
        reviewSnippet: latest.review ?? null,
        date: latest.date,
      };
      return [myCard, ...base];
    }
    return base;
  }, [baseFeed, logs, isBlocked, getShowById, currentUserId]);

  const openShow = (show: FeedShow) =>
    navigation.navigate('ShowDetail', { showId: show.id, title: show.title });

  const openProfile = (user: FeedUser) =>
    navigation.navigate('Profile', {
      userId: user.id,
      username: user.username,
    });

  const onToggleWishlist = (show: FeedShow) => {
    hapticSelect();
    toggleWishlist(show.id);
  };

  const renderItem = ({ item }: { item: FeedItem }) => {
    switch (item.kind) {
      case 'community':
        return (
          <CommunityCard
            item={item}
            onOpenShow={openShow}
            onOpenProfile={openProfile}
          />
        );
      case 'discovery':
        return (
          <DiscoveryCard
            item={item}
            active={isWishlisted(item.show.id)}
            logged={isLogged(item.show.id)}
            finished={getShowById(item.show.id)?.status === 'finished'}
            stats={getShowStats(item.show.id)}
            onOpenShow={openShow}
            onWishlist={onToggleWishlist}
          />
        );
      case 'editorial':
        return <EditorialCard item={item} onOpenShow={openShow} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>Ovation</Text>
        <Pressable
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => navigation.navigate('Notifications')}
        >
          <Text style={styles.bell}>🔔</Text>
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <FlatList
        data={feed}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.ink}
            colors={[colors.ink]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: border.rule,
    borderBottomColor: colors.ink,
  },
  logo: {
    ...type.displayMd,
    fontSize: 28,
    color: colors.ink,
  },
  bell: {
    fontSize: 20,
  },
  listContent: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.bone,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  communityHeaderText: {
    marginLeft: spacing.sm,
  },
  username: {
    ...type.headlineMd,
    fontSize: 15,
    color: colors.ink,
  },
  metaDate: {
    ...type.micro,
    color: colors.muted,
    marginTop: 2,
  },
  activityLine: {
    ...type.bodyMd,
    fontSize: 15,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  showTitle: {
    ...type.bodyMdMedium,
    fontFamily: type.headlineMd.fontFamily,
    color: colors.ink,
  },
  review: {
    ...type.bodySm,
    marginTop: spacing.xs,
    color: colors.inkSoft,
  },
  discoveryCard: {
    backgroundColor: colors.bone,
  },
  showVisual: {
    height: 140,
    marginBottom: spacing.sm,
  },
  discoveryTitle: {
    ...type.headlineLg,
    fontSize: 20,
    color: colors.ink,
  },
  venue: {
    ...type.bodySm,
    color: colors.muted,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  noRating: {
    ...type.micro,
    color: colors.muted,
  },
  wishlistBtn: {
    marginTop: spacing.sm,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.paper,
  },
  wishlistBtnActive: {
    backgroundColor: colors.acid,
  },
  wishlistBtnDisabled: {
    backgroundColor: colors.stock,
    opacity: 0.6,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: radius.full,
    backgroundColor: colors.signal,
    borderWidth: border.hair,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.monoBold,
    fontSize: 9,
    color: colors.onSignal,
  },
  wishlistBtnText: {
    ...type.button,
    fontSize: 13,
    color: colors.ink,
  },
  wishlistBtnTextActive: {
    color: colors.onAcid,
  },
  editorialCard: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  editorialTag: {
    ...type.labelSm,
    color: colors.acid,
    marginBottom: spacing.xs,
  },
  editorialBlurb: {
    ...type.bodyMd,
    color: colors.onInk,
    marginBottom: spacing.sm,
  },
  editorialShow: {
    ...type.button,
    fontSize: 14,
    color: colors.acid,
  },
});
