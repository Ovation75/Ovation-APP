import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TabScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import { EmptyState, Poster, PressableScale, Rating } from '../components/common';
import { hapticSelect, hapticSuccess } from '../lib/haptics';
import { ThemedInput } from '../theme/components';
import { border, colors, radius, spacing, type } from '../theme/tokens';

const NAME_MAX = 50;
const EMOJI_CHOICES = ['🎭', '🔁', '❤️', '🍷', '⭐', '🎬', '🎪', '🎩'];

type Props = TabScreenProps<'MonCarnet'>;

type SubTab = 'journal' | 'playlists' | 'wishlist';

const SUBTABS: { key: SubTab; label: string }[] = [
  { key: 'journal', label: 'Journal' },
  { key: 'playlists', label: 'Playlists' },
  { key: 'wishlist', label: 'Wishlist' },
];

export default function CarnetScreen({ navigation }: Props) {
  const [tab, setTab] = useState<SubTab>('journal');
  // Journal, playlists and wishlist all come from shared app state so any
  // add/remove/log from another screen stays in sync here.
  const {
    wishlist,
    wishlistLoading,
    removeFromWishlist,
    logs,
    logsLoading,
    playlists,
    playlistsLoading,
    playlistItemCount,
    createPlaylist,
    getShowById,
    showsLoading,
  } = useAppState();

  // Create-playlist modal (local form state only).
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [plName, setPlName] = useState('');
  const [plEmoji, setPlEmoji] = useState(EMOJI_CHOICES[0]);
  const [plPublic, setPlPublic] = useState(true);

  const submitCreate = async () => {
    if (!plName.trim() || creating) return;
    setCreating(true);
    setCreateError(null);
    const { error } = await createPlaylist(plName, plEmoji, plPublic);
    setCreating(false);
    if (error) {
      setCreateError(error);
      return;
    }
    hapticSuccess();
    setPlName('');
    setPlEmoji(EMOJI_CHOICES[0]);
    setPlPublic(true);
    setCreateOpen(false);
  };
  const wishlistShows = wishlist
    .map((showId) => getShowById(showId))
    .filter((s): s is NonNullable<typeof s> => s != null);

  const openShow = (showId: string, title: string) =>
    navigation.navigate('ShowDetail', { showId, title });

  const clearWishlist = () => wishlist.forEach(removeFromWishlist);

  // Journal: resolve each log to its show, most recent first.
  const journal = [...logs]
    .sort((a, b) => b.sortKey - a.sortKey)
    .map((log) => ({ log, show: getShowById(log.showId) }))
    .filter((row): row is { log: typeof row.log; show: NonNullable<typeof row.show> } => row.show != null);

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
              accessibilityLabel="Noter un spectacle"
              onPress={() => navigation.navigate('LogFlow')}
            >
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          </View>
          {logsLoading || showsLoading ? (
            <ActivityIndicator style={styles.loading} color={colors.ink} />
          ) : journal.length === 0 ? (
            <EmptyState
              icon="📖"
              title="Ton journal est vide"
              message="Note ton premier spectacle pour démarrer ton carnet."
              ctaLabel="Noter un spectacle"
              onCtaPress={() => navigation.navigate('LogFlow')}
            />
          ) : (
            journal.map(({ log, show }) => (
              <PressableScale
                key={log.id}
                style={styles.timelineRow}
                onPress={() => openShow(show.id, show.title)}
              >
                <Poster style={styles.timelinePoster} label="" />
                <View style={styles.timelineText}>
                  <Text style={styles.timelineTitle}>{show.title}</Text>
                  <Text style={styles.timelineDate}>{log.date}</Text>
                </View>
                <Rating value={log.rating} />
              </PressableScale>
            ))
          )}
        </ScrollView>
      )}

      {tab === 'playlists' && (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.rowBetween}>
            <Text style={styles.blockTitle}>Mes Playlists</Text>
            <Pressable
              style={styles.addBtn}
              accessibilityRole="button"
              accessibilityLabel="Créer une playlist"
              onPress={() => setCreateOpen(true)}
            >
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          </View>
          {playlistsLoading ? (
            <ActivityIndicator style={styles.loading} color={colors.ink} />
          ) : null}
          {playlists.map((pl) => {
            const count = playlistItemCount(pl.id);
            return (
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
                    {count} spectacle{count > 1 ? 's' : ''}
                    {pl.isPublic ? '' : ' · privé'}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {tab === 'wishlist' &&
        (wishlistLoading || showsLoading ? (
          <ActivityIndicator style={styles.loading} color={colors.ink} />
        ) : wishlistShows.length === 0 ? (
          <EmptyState
            icon="🎟️"
            title="Ta wishlist est vide"
            message="Ajoute les spectacles que tu veux voir."
            ctaLabel="Explorer la Découverte"
            onCtaPress={() => navigation.navigate('Decouverte')}
          />
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
                  hitSlop={14}
                  onPress={() => {
                    hapticSelect();
                    removeFromWishlist(show.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Retirer ${show.title} de la wishlist`}
                >
                  <Text style={styles.delete}>✕</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ))}

      {/* Create-playlist modal (E06) */}
      <Modal visible={createOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Nouvelle playlist</Text>

            <Text style={styles.fieldLabel}>Nom</Text>
            <ThemedInput
              value={plName}
              onChangeText={(t) => setPlName(t.slice(0, NAME_MAX))}
              maxLength={NAME_MAX}
              placeholder="Nom de la playlist"
              autoFocus
            />
            <Text style={styles.charCount}>{NAME_MAX - plName.length} caractères restants</Text>

            <Text style={styles.fieldLabel}>Emoji</Text>
            <View style={styles.emojiRow}>
              {EMOJI_CHOICES.map((e) => (
                <Pressable
                  key={e}
                  style={[styles.emojiBtn, plEmoji === e && styles.emojiBtnActive]}
                  onPress={() => setPlEmoji(e)}
                >
                  <Text style={styles.emojiChar}>{e}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Visibilité</Text>
            <View style={styles.visRow}>
              {([true, false] as const).map((v) => (
                <Pressable
                  key={String(v)}
                  style={[styles.visBtn, plPublic === v && styles.visBtnActive]}
                  onPress={() => setPlPublic(v)}
                >
                  <Text
                    style={[
                      styles.visText,
                      plPublic === v && styles.visTextActive,
                    ]}
                  >
                    {v ? 'Publique' : 'Privée'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {createError ? (
              <Text style={styles.createError}>{createError}</Text>
            ) : null}
            <View style={styles.dialogActions}>
              <Pressable
                style={styles.dialogBtn}
                onPress={() => {
                  setCreateError(null);
                  setCreateOpen(false);
                }}
              >
                <Text style={styles.dialogBtnText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.dialogBtn,
                  styles.dialogBtnPrimary,
                  (!plName.trim() || creating) && styles.dialogBtnDisabled,
                ]}
                onPress={submitCreate}
                disabled={!plName.trim() || creating}
                accessibilityState={{ busy: creating }}
              >
                {creating ? (
                  <ActivityIndicator size="small" color={colors.onSignal} />
                ) : (
                  <Text style={styles.dialogBtnPrimaryText}>Créer</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    width: 44,
    height: 44,
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
  devClear: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xs,
  },
  devClearText: {
    ...type.micro,
    color: colors.signal,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,10,10,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  dialog: {
    width: '100%',
    backgroundColor: colors.paper,
    borderWidth: border.rule,
    borderColor: colors.ink,
    padding: spacing.lg,
  },
  dialogTitle: {
    ...type.headlineLg,
    fontSize: 20,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...type.labelSm,
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  charCount: {
    ...type.micro,
    color: colors.muted,
    marginTop: spacing.xxs,
    alignSelf: 'flex-end',
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderWidth: border.rule,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bone,
  },
  emojiBtnActive: {
    backgroundColor: colors.acid,
  },
  emojiChar: { fontSize: 22 },
  visRow: { flexDirection: 'row', borderWidth: border.rule, borderColor: colors.ink },
  visBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.paper,
  },
  visBtnActive: { backgroundColor: colors.ink },
  visText: { ...type.button, fontSize: 13, color: colors.ink },
  visTextActive: { color: colors.acid },
  dialogActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  dialogBtn: {
    flex: 1,
    borderWidth: border.rule,
    borderColor: colors.ink,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.paper,
  },
  dialogBtnText: { ...type.button, fontSize: 13, color: colors.ink },
  dialogBtnPrimary: { backgroundColor: colors.signal },
  dialogBtnDisabled: { opacity: 0.4 },
  dialogBtnPrimaryText: { ...type.button, fontSize: 13, color: colors.onSignal },
  createError: {
    ...type.bodySmMedium,
    color: colors.signal,
    marginTop: spacing.sm,
  },
  loading: {
    marginTop: spacing.xl,
  },
});
