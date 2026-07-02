import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TabScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import { Poster, Rating } from '../components/common';
import { border, colors, radius, spacing, type } from '../theme/tokens';
import { MOCK_JOURNAL, MOCK_PLAYLISTS } from '../lib/mockCarnet';
import { getShowById } from '../lib/mockShows';

type Props = TabScreenProps<'MonCarnet'>;

type SubTab = 'journal' | 'playlists' | 'wishlist';

const SUBTABS: { key: SubTab; label: string }[] = [
  { key: 'journal', label: 'Journal' },
  { key: 'playlists', label: 'Playlists' },
  { key: 'wishlist', label: 'Wishlist' },
];

export default function CarnetScreen({ navigation }: Props) {
  const [tab, setTab] = useState<SubTab>('journal');
  // Wishlist comes from the shared app state (a list of show ids); we resolve
  // each id to a show so add/remove from any screen stays in sync here.
  const { wishlist, removeFromWishlist } = useAppState();
  const wishlistShows = wishlist
    .map((showId) => getShowById(showId))
    .filter((s): s is NonNullable<typeof s> => s != null);

  const openShow = (showId: string, title: string) =>
    navigation.navigate('ShowDetail', { showId, title });

  const clearWishlist = () => wishlist.forEach(removeFromWishlist);

  // Journal: most recent first.
  const journal = [...MOCK_JOURNAL].sort((a, b) => b.sortKey - a.sortKey);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Carnet</Text>
      </View>

      {/* Segmented control — BROADSIDE framed tabs joined by shared ink walls */}
      <View style={styles.segment}>
        {SUBTABS.map((s, i) => (
          <Pressable
            key={s.key}
            style={[
              styles.segmentBtn,
              i > 0 && styles.segmentBtnDivider,
              tab === s.key && styles.segmentBtnActive,
            ]}
            onPress={() => setTab(s.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === s.key }}
          >
            <Text
              style={[
                styles.segmentText,
                tab === s.key && styles.segmentTextActive,
              ]}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'journal' && (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.rowBetween}>
            <Text style={styles.blockTitle}>Mon Journal</Text>
            <Pressable
              style={styles.addBtn}
              accessibilityRole="button"
              accessibilityLabel="Ajouter un log"
              onPress={() => {
                // Log flow (E05) not built yet.
              }}
            >
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          </View>
          {journal.map((log) => (
            <Pressable
              key={log.id}
              style={styles.timelineRow}
              onPress={() => openShow(log.showId, log.showTitle)}
            >
              <Poster style={styles.timelinePoster} label="" />
              <View style={styles.timelineText}>
                <Text style={styles.timelineTitle}>{log.showTitle}</Text>
                <Text style={styles.timelineDate}>{log.date}</Text>
              </View>
              <Rating value={log.rating} />
            </Pressable>
          ))}
        </ScrollView>
      )}

      {tab === 'playlists' && (
        <ScrollView contentContainerStyle={styles.body}>
          {MOCK_PLAYLISTS.map((pl) => (
            <Pressable
              key={pl.id}
              style={styles.playlistRow}
              onPress={() =>
                navigation.navigate('PlaylistDetail', {
                  playlistId: pl.id,
                  name: pl.name,
                })
              }
            >
              <Text style={styles.playlistEmoji}>{pl.emoji}</Text>
              <View style={styles.playlistText}>
                <View style={styles.rowInline}>
                  <Text style={styles.playlistName}>{pl.name}</Text>
                  {pl.isFavorites ? (
                    <Text style={styles.badge}>Par défaut</Text>
                  ) : null}
                </View>
                <Text style={styles.playlistMeta}>
                  {pl.itemCount} spectacle{pl.itemCount > 1 ? 's' : ''}
                  {pl.isPublic ? '' : ' · privé'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {tab === 'wishlist' &&
        (wishlistShows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Ta wishlist est vide</Text>
            <Text style={styles.emptyText}>
              Ajoute les spectacles que tu veux voir.
            </Text>
            <Pressable onPress={() => navigation.navigate('Decouverte')}>
              <Text style={styles.link}>Explorer la Découverte →</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.body}>
            {/* Dev-only helper to test the empty state; remove later. */}
            <Pressable style={styles.devClear} onPress={clearWishlist}>
              <Text style={styles.devClearText}>
                (dev) Vider la wishlist
              </Text>
            </Pressable>
            {wishlistShows.map((show) => (
              <View key={show.id} style={styles.wishRow}>
                <Pressable
                  style={styles.wishMain}
                  onPress={() => openShow(show.id, show.title)}
                >
                  <Poster style={styles.timelinePoster} label="" />
                  <View style={styles.timelineText}>
                    <Text style={styles.timelineTitle}>{show.title}</Text>
                    <Text style={styles.timelineDate}>{show.venues[0]}</Text>
                  </View>
                </Pressable>
                <Pressable
                  hitSlop={10}
                  onPress={() => removeFromWishlist(show.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Retirer ${show.title} de la wishlist`}
                >
                  <Text style={styles.delete}>✕</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    ...type.displayMd,
    color: colors.ink,
  },
  segment: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: border.rule,
    borderColor: colors.ink,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  segmentBtnDivider: {
    borderLeftWidth: border.rule,
    borderLeftColor: colors.ink,
  },
  segmentBtnActive: {
    backgroundColor: colors.ink,
  },
  segmentText: {
    ...type.button,
    fontSize: 13,
    color: colors.ink,
  },
  segmentTextActive: {
    color: colors.acid,
  },
  body: {
    padding: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  blockTitle: {
    ...type.headlineLg,
    color: colors.ink,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.none,
    borderWidth: border.rule,
    borderColor: colors.ink,
    backgroundColor: colors.signal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: colors.onSignal,
    fontSize: 24,
    lineHeight: 28,
    fontFamily: type.headlineMd.fontFamily,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: border.rule,
    borderBottomColor: colors.ink,
  },
  timelinePoster: {
    width: 44,
    height: 60,
  },
  timelineText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  timelineTitle: {
    ...type.headlineMd,
    fontSize: 16,
    color: colors.ink,
  },
  timelineDate: {
    ...type.micro,
    color: colors.muted,
    marginTop: 2,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: border.rule,
    borderBottomColor: colors.ink,
  },
  playlistEmoji: {
    fontSize: 24,
    width: 36,
  },
  playlistText: {
    flex: 1,
  },
  playlistName: {
    ...type.headlineMd,
    fontSize: 16,
    color: colors.ink,
  },
  badge: {
    ...type.micro,
    color: colors.onInk,
    backgroundColor: colors.ink,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  playlistMeta: {
    ...type.bodySm,
    color: colors.muted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: colors.ink,
  },
  wishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: border.rule,
    borderBottomColor: colors.ink,
  },
  wishMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  delete: {
    fontSize: 16,
    color: colors.signal,
    paddingLeft: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...type.headlineLg,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...type.bodyMd,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  link: {
    ...type.labelSm,
    color: colors.cobalt,
  },
  devClear: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xs,
  },
  devClearText: {
    ...type.micro,
    color: colors.signal,
  },
});
