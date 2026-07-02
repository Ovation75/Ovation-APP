import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TabScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import { Avatar, Poster, Rating } from '../components/common';
import { border, colors, radius, spacing, type } from '../theme/tokens';
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
  onOpenShow,
  onWishlist,
}: {
  item: ShowDiscoveryItem;
  active: boolean;
  onOpenShow: (show: FeedShow) => void;
  onWishlist: (show: FeedShow) => void;
}) {
  return (
    <View style={[styles.card, styles.discoveryCard]}>
      <Pressable onPress={() => onOpenShow(item.show)}>
        <Poster style={styles.showVisual} />
        <Text style={styles.discoveryTitle}>{item.show.title}</Text>
        <Text style={styles.venue}>{item.venue}</Text>
        <Rating value={item.communityRating} />
      </Pressable>
      <Pressable
        style={[styles.wishlistBtn, active && styles.wishlistBtnActive]}
        onPress={() => onWishlist(item.show)}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={`Ajouter ${item.show.title} à la wishlist`}
      >
        <Text
          style={[
            styles.wishlistBtnText,
            active && styles.wishlistBtnTextActive,
          ]}
        >
          {active ? '✓ Dans la wishlist' : '+ Wishlist'}
        </Text>
      </Pressable>
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
    <Pressable
      style={[styles.card, styles.editorialCard]}
      onPress={() => onOpenShow(item.show)}
    >
      <Text style={styles.editorialTag}>ÉDITO OVATION</Text>
      <Text style={styles.editorialBlurb}>{item.blurb}</Text>
      <Text style={styles.editorialShow}>{item.show.title} →</Text>
    </Pressable>
  );
}

export default function FeedScreen({ navigation }: Props) {
  // Wishlist state is shared app-wide so this button stays in sync with the
  // Fiche Spectacle and Mon Carnet.
  const { isWishlisted, toggleWishlist } = useAppState();

  const openShow = (show: FeedShow) =>
    navigation.navigate('ShowDetail', { showId: show.id, title: show.title });

  const openProfile = (user: FeedUser) =>
    navigation.navigate('Profile', {
      userId: user.id,
      username: user.username,
    });

  const onToggleWishlist = (show: FeedShow) => toggleWishlist(show.id);

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
        </Pressable>
      </View>

      <FlatList
        data={MOCK_FEED}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
