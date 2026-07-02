import { useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';
import {
  useAppState,
  BASE_APPLAUSE,
} from '../contexts/AppStateContext';
import {
  Avatar,
  Pill,
  Poster,
  PulsePressable,
  Rating,
} from '../components/common';
import { HeaderIconButton } from '../components/AppHeader';
import { hapticImpact, hapticSelect } from '../lib/haptics';
import { shareReview, shareShow } from '../lib/share';
import { border, colors, radius, spacing, type } from '../theme/tokens';
import { SHOW_STATUS_LABEL } from '../lib/shows';
import { getReviewsForShow } from '../lib/mockShows';

type Props = RootStackScreenProps<'ShowDetail'>;

export default function ShowDetailScreen({ route, navigation }: Props) {
  const { showId } = route.params;
  const {
    getShowById,
    showsLoading,
    showsError,
    currentUserId,
    isWishlisted,
    toggleWishlist,
    canWishlist,
    isLogged,
    getLogForShow,
    playlists,
    isShowInPlaylist,
    addShowToPlaylist,
    removeShowFromPlaylist,
    getApplause,
    hasApplauded,
    toggleApplause,
    isBlocked,
    blockUser,
    reportContent,
    getShowStats,
  } = useAppState();
  const show = getShowById(showId);

  const [playlistModal, setPlaylistModal] = useState(false);

  const logged = isLogged(showId);
  const wishlisted = isWishlisted(showId);
  const myLog = getLogForShow(showId);

  // Public reviews: still 100% mock (see AppStateContext's doc comment) —
  // MOCK_REVIEWS is keyed to old mock show ids, so this will always be empty
  // against a real (uuid) show id until real multi-user log data exists.
  // Drop blocked users, drop the current user (shown as a dedicated "Ton
  // avis" card), then sort by applause (popularity).
  const reviews = useMemo(() => {
    if (!show) return [];
    return getReviewsForShow(show.id)
      .filter((r) => r.userId !== currentUserId && !isBlocked(r.userId))
      .sort(
        (a, b) =>
          getApplause(b.id, BASE_APPLAUSE[b.id] ?? 0) -
          getApplause(a.id, BASE_APPLAUSE[a.id] ?? 0)
      );
  }, [show, isBlocked, getApplause, currentUserId]);

  // Share action in the native header (reuses the shared HeaderIconButton).
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        show ? (
          <HeaderIconButton
            icon="↗"
            accessibilityLabel="Partager le spectacle"
            onPress={() => shareShow(show.title, show.venues[0])}
          />
        ) : undefined,
    });
  }, [navigation, show]);

  if (showsLoading) {
    return (
      <View style={styles.missing}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (!show) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>
          {showsError ?? 'Spectacle introuvable.'}
        </Text>
      </View>
    );
  }

  const openLogFlow = () => navigation.navigate('LogFlow', { showId: show.id });

  // Community rating + log count, computed from all logs (seeded + mine).
  const stats = getShowStats(show.id);

  const reviewActions = (
    userId: string,
    username: string,
    contentId: string,
    rating: number,
    text: string
  ) =>
    Alert.alert(username, undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Partager cet avis',
        onPress: () => shareReview(`@${username}`, show!.title, rating, text),
      },
      {
        text: 'Signaler cet avis',
        onPress: () => {
          // A review IS a log in the real schema — target_type 'log'. This
          // particular id is still a mock review id (not a real log's uuid),
          // so the report is tracked locally only (see reportContent).
          reportContent('log', contentId, 'Contenu inapproprié');
          Alert.alert('Merci', 'Cet avis a été signalé à notre équipe.');
        },
      },
      {
        text: "Bloquer l'utilisateur",
        style: 'destructive',
        onPress: () => {
          hapticImpact();
          blockUser(userId);
          Alert.alert('Utilisateur bloqué', `Tu ne verras plus @${username}.`);
        },
      },
    ]);

  // ---- Wishlist button state (E07) ----
  const finished = show.status === 'finished';
  let wishlistLabel: string;
  let wishlistDisabled = false;
  if (logged) {
    wishlistLabel = '✓ Déjà vu';
    wishlistDisabled = true;
  } else if (finished) {
    wishlistLabel = 'Terminé';
    wishlistDisabled = true;
  } else {
    wishlistLabel = wishlisted ? '✓ Wishlist' : '+ Wishlist';
  }

  return (
    <>
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
            {stats.logCount > 0 ? (
              <>
                <Rating value={stats.rating} />
                <Text style={styles.logCount}>
                  · {stats.logCount} avis
                </Text>
              </>
            ) : (
              <Text style={styles.logCount}>Aucun avis pour le moment</Text>
            )}
          </View>
          <View style={styles.statusRow}>
            <Pill label={SHOW_STATUS_LABEL[show.status]} tone="dark" />
            {logged ? <Text style={styles.seen}>✓ Déjà vu</Text> : null}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, styles.actionPrimary]}
            onPress={openLogFlow}
            accessibilityRole="button"
          >
            <Text style={styles.actionPrimaryText}>
              {logged ? 'Modifier ma note' : 'Noter'}
            </Text>
          </Pressable>
          <PulsePressable
            style={[
              styles.actionBtn,
              styles.actionSecondary,
              wishlisted && !wishlistDisabled && styles.actionSecondaryActive,
              wishlistDisabled && styles.actionDisabled,
            ]}
            onPress={() => {
              if (wishlistDisabled) return;
              hapticSelect();
              toggleWishlist(show.id);
            }}
            disabled={wishlistDisabled}
            accessibilityRole="button"
            accessibilityLabel={wishlistLabel}
            accessibilityState={{ selected: wishlisted, disabled: wishlistDisabled }}
          >
            <Text style={styles.actionSecondaryText}>{wishlistLabel}</Text>
          </PulsePressable>
        </View>

        <View style={styles.secondaryActions}>
          <Pressable
            style={[styles.playlistAction, styles.secondaryFlex]}
            onPress={() => setPlaylistModal(true)}
            accessibilityRole="button"
          >
            <Text style={styles.playlistActionText}>+ Playlist</Text>
          </Pressable>
          <Pressable
            style={styles.playlistAction}
            onPress={() => shareShow(show.title, show.venues[0])}
            accessibilityRole="button"
            accessibilityLabel={`Partager ${show.title}`}
          >
            <Text style={styles.playlistActionText}>↗ Partager</Text>
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

          {/* Current user's own review, styled distinctly. */}
          {myLog ? (
            <View style={[styles.review, styles.myReview]}>
              <View style={styles.reviewHeader}>
                <Avatar name="malo" size={36} />
                <View style={styles.reviewHeaderText}>
                  <Text style={styles.reviewUser}>Ton avis</Text>
                  <Rating value={myLog.rating} muted />
                </View>
                <Pressable
                  hitSlop={12}
                  onPress={() =>
                    shareReview('J’ai', show.title, myLog.rating, myLog.review)
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Partager mon avis"
                >
                  <Text style={styles.editLink}>↗ Partager</Text>
                </Pressable>
                <Pressable
                  hitSlop={12}
                  onPress={openLogFlow}
                  accessibilityRole="button"
                  style={styles.editLinkSpacing}
                >
                  <Text style={styles.editLink}>Modifier</Text>
                </Pressable>
              </View>
              {myLog.review ? (
                <Text style={styles.reviewText}>{myLog.review}</Text>
              ) : (
                <Text style={styles.reviewTextMuted}>
                  Tu as noté ce spectacle sans écrire d'avis.
                </Text>
              )}
            </View>
          ) : null}

          {reviews.length === 0 && !myLog ? (
            <Text style={styles.noReviews}>
              Aucun avis pour le moment. Sois le premier à noter.
            </Text>
          ) : (
            reviews.map((r) => {
              const count = getApplause(r.id, BASE_APPLAUSE[r.id] ?? 0);
              const applauded = hasApplauded(r.id);
              return (
                <View key={r.id} style={styles.review}>
                  <View style={styles.reviewHeader}>
                    <Pressable
                      style={styles.reviewHeaderMain}
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
                    <Pressable
                      hitSlop={12}
                      onPress={() =>
                        reviewActions(r.userId, r.username, r.id, r.rating, r.text)
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Options de l'avis"
                    >
                      <Text style={styles.more}>⋯</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.reviewText}>{r.text}</Text>
                  <PulsePressable
                    style={[styles.applaud, applauded && styles.applaudActive]}
                    onPress={() => {
                      hapticSelect();
                      // reviewOwnerId/showId let a real notification fire if
                      // the review owner is ever a real (uuid) user — a no-op
                      // today since reviews are still mock users only.
                      toggleApplause(r.id, r.userId, show.id);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Applaudir l'avis de ${r.username}`}
                    accessibilityState={{ selected: applauded }}
                  >
                    <Text
                      style={[
                        styles.applaudText,
                        applauded && styles.applaudTextActive,
                      ]}
                    >
                      👏 {count}
                    </Text>
                  </PulsePressable>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add-to-playlist modal (E06) */}
      <Modal
        visible={playlistModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPlaylistModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPlaylistModal(false)}
        >
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Ajouter à une playlist</Text>
            {!logged ? (
              <>
                <Text style={styles.sheetHint}>Note ce spectacle d'abord</Text>
                <Pressable
                  style={styles.sheetPrimary}
                  onPress={() => {
                    setPlaylistModal(false);
                    openLogFlow();
                  }}
                >
                  <Text style={styles.sheetPrimaryText}>Noter maintenant</Text>
                </Pressable>
              </>
            ) : (
              <ScrollView style={styles.sheetList}>
                {playlists.map((pl) => {
                  const inList = isShowInPlaylist(pl.id, show.id);
                  return (
                    <Pressable
                      key={pl.id}
                      style={styles.sheetRow}
                      onPress={() => {
                        hapticSelect();
                        inList
                          ? removeShowFromPlaylist(pl.id, show.id)
                          : addShowToPlaylist(pl.id, show.id);
                      }}
                    >
                      <Text style={styles.sheetEmoji}>{pl.emoji}</Text>
                      <Text style={styles.sheetName}>{pl.name}</Text>
                      <Text
                        style={[
                          styles.sheetCheck,
                          inList && styles.sheetCheckOn,
                        ]}
                      >
                        {inList ? '✓' : '+'}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            <Pressable
              style={styles.sheetClose}
              onPress={() => setPlaylistModal(false)}
            >
              <Text style={styles.sheetCloseText}>Fermer</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  actionDisabled: {
    backgroundColor: colors.stock,
    opacity: 0.6,
  },
  actionSecondaryText: {
    ...type.button,
    color: colors.ink,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  secondaryFlex: { flex: 1 },
  playlistAction: {
    minHeight: 44,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    backgroundColor: colors.bone,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistActionText: { ...type.button, fontSize: 13, color: colors.ink },
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
  myReview: {
    borderWidth: border.rule,
    borderColor: colors.ink,
    backgroundColor: colors.bone,
    padding: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reviewHeaderMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewHeaderText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  reviewUser: {
    ...type.headlineMd,
    fontSize: 15,
    color: colors.ink,
  },
  editLink: { ...type.labelSm, color: colors.cobalt },
  editLinkSpacing: { marginLeft: spacing.md },
  more: { fontSize: 20, color: colors.ink, paddingHorizontal: spacing.xs },
  reviewText: {
    ...type.bodySm,
    color: colors.inkSoft,
  },
  reviewTextMuted: {
    ...type.bodySm,
    color: colors.muted,
    fontStyle: 'italic',
  },
  applaud: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    borderWidth: border.hair,
    borderColor: colors.ink,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.bone,
  },
  applaudActive: { backgroundColor: colors.acid },
  applaudText: { ...type.micro, color: colors.ink },
  applaudTextActive: { color: colors.onAcid },

  // Modal / bottom sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,10,10,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.paper,
    borderTopWidth: border.rule,
    borderColor: colors.ink,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  sheetTitle: {
    ...type.headlineLg,
    fontSize: 20,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  sheetHint: {
    ...type.bodyMd,
    color: colors.inkSoft,
    marginBottom: spacing.md,
  },
  sheetPrimary: {
    backgroundColor: colors.signal,
    borderWidth: border.rule,
    borderColor: colors.ink,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  sheetPrimaryText: { ...type.button, color: colors.onSignal },
  sheetList: { marginBottom: spacing.sm },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: border.hair,
    borderBottomColor: colors.stock,
  },
  sheetEmoji: { fontSize: 22, width: 34 },
  sheetName: { ...type.headlineMd, fontSize: 16, color: colors.ink, flex: 1 },
  sheetCheck: { ...type.headlineMd, fontSize: 18, color: colors.muted },
  sheetCheckOn: { color: colors.cobalt },
  sheetClose: {
    marginTop: spacing.sm,
    borderWidth: border.rule,
    borderColor: colors.ink,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.paper,
  },
  sheetCloseText: { ...type.button, fontSize: 13, color: colors.ink },
});
