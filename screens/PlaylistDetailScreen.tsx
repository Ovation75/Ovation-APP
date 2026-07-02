import { useLayoutEffect, useState } from 'react';
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
import { useAppState } from '../contexts/AppStateContext';
import { EmptyState, Poster } from '../components/common';
import { hapticImpact, hapticSelect } from '../lib/haptics';
import { ThemedInput } from '../theme/components';
import { border, colors, radius, spacing, type } from '../theme/tokens';

type Props = RootStackScreenProps<'PlaylistDetail'>;

const NAME_MAX = 50;

export default function PlaylistDetailScreen({ route, navigation }: Props) {
  const { playlistId, name } = route.params;
  const {
    playlists,
    playlistsLoading,
    getPlaylistShowIds,
    removeShowFromPlaylist,
    addShowToPlaylist,
    isShowInPlaylist,
    renamePlaylist,
    setPlaylistVisibility,
    deletePlaylist,
    logs,
    getShowById,
    showsLoading,
  } = useAppState();

  const playlist = playlists.find((p) => p.id === playlistId);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(playlist?.name ?? '');
  const [renameBusy, setRenameBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: playlist?.name ?? name ?? 'Playlist' });
  }, [navigation, playlist?.name, name]);

  if (playlistsLoading) {
    return (
      <View style={styles.missing}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  // Playlists belonging to other users (viewed from their profile) aren't in
  // the current user's centralized state — show a light read-only view.
  if (!playlist) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingTitle}>{name ?? 'Playlist'}</Text>
        <Text style={styles.missingText}>
          Playlist publique — aperçu indisponible dans la démo.
        </Text>
      </View>
    );
  }

  const showIds = getPlaylistShowIds(playlist.id);
  const shows = showIds
    .map((id) => getShowById(id))
    .filter((s): s is NonNullable<typeof s> => s != null);

  // Logged shows not already in this playlist (only logged shows are addable).
  const addableShows = logs
    .map((l) => getShowById(l.showId))
    .filter((s): s is NonNullable<typeof s> => s != null)
    .filter((s) => !isShowInPlaylist(playlist.id, s.id));

  const openMenu = () => {
    const options: {
      text: string;
      style?: 'cancel' | 'destructive';
      onPress?: () => void;
    }[] = [
      {
        text: 'Renommer',
        onPress: () => {
          setRenameValue(playlist.name);
          setRenameOpen(true);
        },
      },
      {
        text: playlist.isPublic ? 'Rendre privée' : 'Rendre publique',
        onPress: async () => {
          const { error } = await setPlaylistVisibility(playlist.id, !playlist.isPublic);
          if (error) Alert.alert('Erreur', error);
        },
      },
    ];
    // Favoris is non-deletable.
    if (!playlist.isFavorites) {
      options.push({
        text: 'Supprimer la playlist',
        style: 'destructive',
        onPress: confirmDelete,
      });
    }
    options.push({ text: 'Annuler', style: 'cancel' });
    Alert.alert(playlist.name, undefined, options);
  };

  const confirmDelete = () =>
    Alert.alert(
      'Supprimer la playlist',
      `« ${playlist.name} » sera définitivement supprimée.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            hapticImpact();
            const { error } = await deletePlaylist(playlist.id);
            if (error) {
              Alert.alert('Erreur', error);
              return;
            }
            navigation.goBack();
          },
        },
      ]
    );

  const saveRename = async () => {
    if (!renameValue.trim() || renameBusy) return;
    setRenameBusy(true);
    const { error } = await renamePlaylist(playlist.id, renameValue);
    setRenameBusy(false);
    if (error) {
      Alert.alert('Erreur', error);
      return;
    }
    setRenameOpen(false);
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>{playlist.emoji}</Text>
          <View style={styles.headerText}>
            <Text style={styles.name}>{playlist.name}</Text>
            <Text style={styles.meta}>
              {shows.length} spectacle{shows.length > 1 ? 's' : ''} ·{' '}
              {playlist.isPublic ? 'Publique' : 'Privée'}
            </Text>
          </View>
          <Pressable hitSlop={10} onPress={openMenu} accessibilityLabel="Options">
            <Text style={styles.more}>⋯</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.addBtn}
          onPress={() => setAddOpen(true)}
          accessibilityRole="button"
        >
          <Text style={styles.addBtnText}>+ Ajouter un spectacle</Text>
        </Pressable>

        {showsLoading ? (
          <ActivityIndicator style={styles.loading} color={colors.ink} />
        ) : shows.length === 0 ? (
          <EmptyState
            icon={playlist.emoji}
            title="Playlist vide"
            message="Ajoute des spectacles déjà notés pour la remplir."
            ctaLabel="Ajouter un spectacle"
            onCtaPress={() => setAddOpen(true)}
          />
        ) : (
          shows.map((show) => (
            <View key={show.id} style={styles.row}>
              <Pressable
                style={styles.rowMain}
                onPress={() =>
                  navigation.navigate('ShowDetail', {
                    showId: show.id,
                    title: show.title,
                  })
                }
              >
                <Poster style={styles.poster} label="" />
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{show.title}</Text>
                  <Text style={styles.rowSub}>{show.venues[0]}</Text>
                </View>
              </Pressable>
              <Pressable
                hitSlop={14}
                onPress={() => {
                  hapticSelect();
                  removeShowFromPlaylist(playlist.id, show.id);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Retirer ${show.title}`}
              >
                <Text style={styles.remove}>✕</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* Rename modal */}
      <Modal visible={renameOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Renommer la playlist</Text>
            <ThemedInput
              value={renameValue}
              onChangeText={(t) => setRenameValue(t.slice(0, NAME_MAX))}
              maxLength={NAME_MAX}
              autoFocus
              placeholder="Nom de la playlist"
            />
            <View style={styles.dialogActions}>
              <Pressable
                style={styles.dialogBtn}
                onPress={() => setRenameOpen(false)}
                disabled={renameBusy}
              >
                <Text style={styles.dialogBtnText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.dialogBtn,
                  styles.dialogBtnPrimary,
                  renameBusy && styles.dialogBtnDisabled,
                ]}
                onPress={saveRename}
                disabled={renameBusy}
                accessibilityState={{ busy: renameBusy }}
              >
                {renameBusy ? (
                  <ActivityIndicator size="small" color={colors.onSignal} />
                ) : (
                  <Text style={styles.dialogBtnPrimaryText}>Enregistrer</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add-show modal */}
      <Modal visible={addOpen} transparent animationType="slide">
        <Pressable style={styles.sheetBackdrop} onPress={() => setAddOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Ajouter un spectacle</Text>
            {addableShows.length === 0 ? (
              <Text style={styles.sheetHint}>
                Tous tes spectacles notés sont déjà dans cette playlist.
              </Text>
            ) : (
              <ScrollView style={styles.sheetList}>
                {addableShows.map((s) => (
                  <Pressable
                    key={s.id}
                    style={styles.sheetRow}
                    onPress={() => {
                      hapticSelect();
                      addShowToPlaylist(playlist.id, s.id);
                    }}
                  >
                    <Poster style={styles.sheetPoster} label="" />
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{s.title}</Text>
                      <Text style={styles.rowSub}>{s.venues[0]}</Text>
                    </View>
                    <Text style={styles.sheetPlus}>+</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <Pressable
              style={styles.sheetClose}
              onPress={() => setAddOpen(false)}
            >
              <Text style={styles.sheetCloseText}>Terminé</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  missing: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  missingTitle: {
    ...type.headlineLg,
    color: colors.ink,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  missingText: { ...type.bodySm, color: colors.muted, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emoji: { fontSize: 34, width: 48 },
  headerText: { flex: 1 },
  name: { ...type.displayMd, fontSize: 24, color: colors.ink },
  meta: { ...type.micro, color: colors.muted, marginTop: 2 },
  more: { fontSize: 24, color: colors.ink, paddingHorizontal: spacing.xs },
  addBtn: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    backgroundColor: colors.bone,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addBtnText: { ...type.button, fontSize: 13, color: colors.ink },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: border.rule,
    borderBottomColor: colors.ink,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  poster: { width: 44, height: 60 },
  rowText: { flex: 1, marginLeft: spacing.sm },
  rowTitle: { ...type.headlineMd, fontSize: 16, color: colors.ink },
  rowSub: { ...type.micro, color: colors.muted, marginTop: 2 },
  remove: { fontSize: 16, color: colors.signal, paddingLeft: spacing.sm },

  // Rename dialog
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
    ...type.headlineMd,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
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
  dialogBtnPrimaryText: { ...type.button, fontSize: 13, color: colors.onSignal },
  dialogBtnDisabled: { opacity: 0.5 },
  loading: { marginTop: spacing.xl },

  // Add-show sheet
  sheetBackdrop: {
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
  sheetHint: { ...type.bodyMd, color: colors.muted, marginBottom: spacing.md },
  sheetList: { marginBottom: spacing.sm },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: border.hair,
    borderBottomColor: colors.stock,
  },
  sheetPoster: { width: 40, height: 54 },
  sheetPlus: { ...type.headlineLg, color: colors.cobalt },
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
