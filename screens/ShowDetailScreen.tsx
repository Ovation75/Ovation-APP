import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import { Avatar, Pill, Poster, Rating } from '../components/common';
import { border, colors, radius, spacing, type } from '../theme/tokens';
import {
  SHOW_STATUS_LABEL,
  getReviewsForShow,
  getShowById,
} from '../lib/mockShows';

type Props = RootStackScreenProps<'ShowDetail'>;

export default function ShowDetailScreen({ route, navigation }: Props) {
  const { showId } = route.params;
  const show = getShowById(showId);
  // Wishlist state is shared so toggling here reflects in the Feed and Carnet.
  const { isWishlisted, toggleWishlist } = useAppState();
  const wishlisted = isWishlisted(showId);

  if (!show) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Spectacle introuvable.</Text>
      </View>
    );
  }

  const reviews = getReviewsForShow(show.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header visual */}
      <Poster style={styles.hero} />

      <Text style={styles.title}>{show.title}</Text>
      <View style={styles.pillRow}>
        <Pill label={show.genre} />
      </View>

      {/* Info block */}
      <View style={styles.infoBlock}>
        <Text style={styles.company}>{show.company}</Text>
        <Text style={styles.venue}>{show.venues.join(' · ')}</Text>
        <View style={styles.ratingRow}>
          <Rating value={show.communityRating} />
          <Text style={styles.logCount}>· {show.logCount} avis</Text>
        </View>
        <View style={styles.statusRow}>
          <Pill label={SHOW_STATUS_LABEL[show.status]} tone="dark" />
          {show.seen ? <Text style={styles.seen}>✓ Déjà vu</Text> : null}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, styles.actionPrimary]}
          onPress={() => {
            // Log flow (E05) not built yet.
          }}
          accessibilityRole="button"
        >
          <Text style={styles.actionPrimaryText}>
            {show.seen ? 'Modifier ma note' : 'Noter'}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.actionBtn,
            styles.actionSecondary,
            wishlisted && styles.actionSecondaryActive,
          ]}
          onPress={() => toggleWishlist(show.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: wishlisted }}
        >
          <Text style={styles.actionSecondaryText}>
            {wishlisted ? '✓ Wishlist' : '+ Wishlist'}
          </Text>
        </Pressable>
      </View>

      {/* Synopsis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Synopsis</Text>
        <Text style={styles.synopsis}>{show.synopsis}</Text>
      </View>

      {/* Reviews */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avis de la communauté</Text>
        {reviews.length === 0 ? (
          <Text style={styles.noReviews}>
            Aucun avis pour le moment. Sois le premier à noter.
          </Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.review}>
              <Pressable
                style={styles.reviewHeader}
                onPress={() =>
                  navigation.navigate('Profile', {
                    userId: r.userId,
                    username: r.username,
                  })
                }
              >
                <Avatar name={r.username} size={36} />
                <View style={styles.reviewHeaderText}>
                  <Text style={styles.reviewUser}>{r.username}</Text>
                  <Rating value={r.rating} muted />
                </View>
              </Pressable>
              <Text style={styles.reviewText}>{r.text}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  missingText: {
    ...type.bodyMd,
    color: colors.muted,
  },
  hero: {
    width: '100%',
    height: 240,
    borderRadius: radius.none,
  },
  title: {
    ...type.displayLg,
    fontSize: 40,
    lineHeight: 38,
    color: colors.ink,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  pillRow: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  infoBlock: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  company: {
    ...type.headlineMd,
    fontSize: 16,
    color: colors.ink,
  },
  venue: {
    ...type.bodySm,
    color: colors.muted,
    marginTop: spacing.xxs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  logCount: {
    ...type.micro,
    color: colors.muted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  seen: {
    ...type.labelSm,
    color: colors.cobalt,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  actionBtn: {
    flex: 1,
    minHeight: 52,
    paddingVertical: spacing.md,
    borderRadius: radius.none,
    borderWidth: border.rule,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: {
    backgroundColor: colors.signal,
  },
  actionPrimaryText: {
    ...type.button,
    color: colors.onSignal,
  },
  actionSecondary: {
    backgroundColor: colors.paper,
  },
  actionSecondaryActive: {
    backgroundColor: colors.acid,
  },
  actionSecondaryText: {
    ...type.button,
    color: colors.ink,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...type.headlineLg,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  synopsis: {
    ...type.bodyMd,
    color: colors.inkSoft,
  },
  noReviews: {
    ...type.bodySm,
    color: colors.muted,
  },
  review: {
    marginBottom: spacing.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reviewHeaderText: {
    marginLeft: spacing.sm,
  },
  reviewUser: {
    ...type.headlineMd,
    fontSize: 15,
    color: colors.ink,
  },
  reviewText: {
    ...type.bodySm,
    color: colors.inkSoft,
  },
});
