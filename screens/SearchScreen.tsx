import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, DrawerActions } from '@react-navigation/native';
import type { TabScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import { AppHeader } from '../components/AppHeader';
import { Avatar, EmptyState, Poster } from '../components/common';
import {
  CATEGORIES,
  SHOW_STATUS_LABEL,
  type ShowGenre,
  type ShowStatus,
} from '../lib/shows';
import { MOCK_USERS } from '../lib/mockUsers';
import { normalizeText } from '../lib/text';
import { border, colors, radius, spacing, type } from '../theme/tokens';
import { ThemedInput } from '../theme/components';

type Props = TabScreenProps<'Recherche'>;

const RECENT_SEARCHES = ['Molière', 'Comédie-Française', 'stand-up'];

type Filter = 'shows' | 'people';

type Result =
  | { type: 'show'; id: string; title: string; subtitle: string }
  | { type: 'person'; id: string; username: string };

// Advanced filters (E04) — only apply to show results.
type AdvancedFilters = {
  genres: ShowGenre[];
  minRating: number; // 0 = off
  status: ShowStatus | null;
};

const NO_FILTERS: AdvancedFilters = { genres: [], minRating: 0, status: null };

const MIN_RATING_OPTIONS = [3, 3.5, 4, 4.5];
const STATUS_OPTIONS: ShowStatus[] = ['now', 'touring', 'finished'];

function countActive(f: AdvancedFilters): number {
  return f.genres.length + (f.minRating > 0 ? 1 : 0) + (f.status ? 1 : 0);
}

export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<Filter, boolean>>({
    shows: true,
    people: true,
  });
  const [advanced, setAdvanced] = useState<AdvancedFilters>(NO_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);
  // Community rating is computed from all logs, so the ★-minimum filter uses
  // the same numbers displayed on the Fiche Spectacle.
  const { shows, showsLoading, getShowStats, myProfile, unreadCount } = useAppState();

  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());

  // Auto-focus the keyboard whenever the tab gains focus.
  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }, [])
  );

  const toggle = (f: Filter) =>
    setFilters((prev) => {
      const next = { ...prev, [f]: !prev[f] };
      // Never allow both off — fall back to both on.
      if (!next.shows && !next.people) return { shows: true, people: true };
      return next;
    });

  const toggleGenre = (g: ShowGenre) =>
    setAdvanced((prev) => ({
      ...prev,
      genres: prev.genres.includes(g)
        ? prev.genres.filter((x) => x !== g)
        : [...prev.genres, g],
    }));

  const activeCount = countActive(advanced);

  const results = useMemo<Result[]>(() => {
    // Normalize the query so search is case- and accent-insensitive
    // (e.g. "moliere" matches "Molière").
    const q = normalizeText(query);
    // With active advanced filters, browse the catalogue even without text.
    if (!q && activeCount === 0) return [];
    const out: Result[] = [];
    if (filters.shows) {
      for (const s of shows) {
        // Match against title, company (artist/troupe) and venues.
        const haystack = normalizeText(
          `${s.title} ${s.company ?? ''} ${s.venues.join(' ')}`
        );
        if (q && !haystack.includes(q)) continue;
        // Advanced filters stack on top of text search (shows only).
        if (advanced.genres.length > 0 && !advanced.genres.includes(s.genre))
          continue;
        if (
          advanced.minRating > 0 &&
          getShowStats(s.id).rating < advanced.minRating
        )
          continue;
        if (advanced.status && s.status !== advanced.status) continue;
        out.push({
          type: 'show',
          id: s.id,
          title: s.title,
          subtitle: s.venues[0],
        });
      }
    }
    // People results only make sense with a text query.
    if (filters.people && q) {
      for (const u of MOCK_USERS) {
        if (normalizeText(u.username).includes(q)) {
          out.push({ type: 'person', id: u.id, username: u.username });
        }
      }
    }
    return out;
  }, [query, filters, advanced, activeCount, getShowStats, shows]);

  const openResult = (r: Result) => {
    if (r.type === 'show') {
      navigation.navigate('ShowDetail', { showId: r.id, title: r.title });
    } else {
      navigation.navigate('Profile', { userId: r.id, username: r.username });
    }
  };

  const hasQuery = query.trim().length > 0;

  const renderBody = () => {
    // Empty state: recent searches.
    if (!hasQuery && activeCount === 0) {
      return (
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>Recherches récentes</Text>
          {RECENT_SEARCHES.map((s) => (
            <Pressable
              key={s}
              style={styles.recentRow}
              onPress={() => setQuery(s)}
            >
              <Text style={styles.recentIcon}>🕘</Text>
              <Text style={styles.recentText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      );
    }

    if (showsLoading && filters.shows) {
      return <ActivityIndicator style={styles.loading} color={colors.ink} />;
    }

    // Zero results.
    if (results.length === 0) {
      return (
        <EmptyState
          icon="🔍"
          title="Aucun résultat"
          message={
            hasQuery
              ? `Rien ne correspond à « ${query.trim()} »${
                  activeCount > 0 ? ' avec ces filtres' : ''
                }.`
              : 'Aucun spectacle ne correspond à ces filtres.'
          }
          ctaLabel={activeCount > 0 ? 'Effacer les filtres' : 'Découvrir le catalogue'}
          onCtaPress={
            activeCount > 0
              ? () => setAdvanced(NO_FILTERS)
              : () =>
                  navigation.navigate('Main', {
                    screen: 'Tabs',
                    params: { screen: 'Decouverte' },
                  })
          }
        />
      );
    }

    return (
      <FlatList
        data={results}
        keyExtractor={(r) => `${r.type}-${r.id}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.body}
        renderItem={({ item }) => (
          <Pressable style={styles.resultRow} onPress={() => openResult(item)}>
            {item.type === 'show' ? (
              <>
                <Poster style={styles.resultPoster} label="" />
                <View style={styles.resultText}>
                  <Text style={styles.resultTitle}>{item.title}</Text>
                  <Text style={styles.resultSub}>{item.subtitle}</Text>
                </View>
              </>
            ) : (
              <>
                <Avatar name={item.username} size={44} />
                <View style={styles.resultText}>
                  <Text style={styles.resultTitle}>@{item.username}</Text>
                  <Text style={styles.resultSub}>Profil</Text>
                </View>
              </>
            )}
          </Pressable>
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title="Recherche"
        onOpenDrawer={openDrawer}
        avatarName={myProfile?.username ?? '?'}
        actions={[
          {
            icon: '🔔',
            accessibilityLabel: 'Notifications',
            badge: unreadCount,
            onPress: () => navigation.navigate('Notifications'),
          },
        ]}
      />
      <View style={styles.searchWrap}>
        <ThemedInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="RECHERCHER UN SPECTACLE OU UNE PERSONNE"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Champ de recherche"
        />
      </View>

      <View style={styles.filterRow}>
        {(['shows', 'people'] as Filter[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterBtn, filters[f] && styles.filterBtnActive]}
            onPress={() => toggle(f)}
            accessibilityRole="button"
            accessibilityState={{ selected: filters[f] }}
          >
            <Text
              style={[
                styles.filterText,
                filters[f] && styles.filterTextActive,
              ]}
            >
              {f === 'shows' ? 'Spectacles' : 'Personnes'}
            </Text>
          </Pressable>
        ))}
        {/* Advanced filters trigger — badge shows how many are active. */}
        <Pressable
          style={[styles.filterBtn, activeCount > 0 && styles.filterBtnCobalt]}
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Filtres avancés, ${activeCount} actifs`}
        >
          <Text
            style={[
              styles.filterText,
              activeCount > 0 && styles.filterTextOnCobalt,
            ]}
          >
            Filtres{activeCount > 0 ? ` · ${activeCount}` : ''}
          </Text>
        </Pressable>
      </View>

      {renderBody()}

      {/* Advanced filters sheet (E04) */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setSheetOpen(false)}
        >
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filtres</Text>
              {activeCount > 0 ? (
                <Pressable
                  hitSlop={8}
                  onPress={() => setAdvanced(NO_FILTERS)}
                  accessibilityRole="button"
                >
                  <Text style={styles.clearAll}>Tout effacer</Text>
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.sheetSection}>Genre</Text>
            <View style={styles.chipWrap}>
              {CATEGORIES.map((g) => {
                const on = advanced.genres.includes(g);
                return (
                  <Pressable
                    key={g}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() => toggleGenre(g)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>
                      {g}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sheetSection}>Note minimum</Text>
            <View style={styles.chipWrap}>
              {MIN_RATING_OPTIONS.map((r) => {
                const on = advanced.minRating === r;
                return (
                  <Pressable
                    key={r}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() =>
                      setAdvanced((prev) => ({
                        ...prev,
                        minRating: on ? 0 : r,
                      }))
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>
                      ★ {r.toFixed(1).replace('.', ',')}+
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sheetSection}>Statut</Text>
            <View style={styles.chipWrap}>
              {STATUS_OPTIONS.map((s) => {
                const on = advanced.status === s;
                return (
                  <Pressable
                    key={s}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() =>
                      setAdvanced((prev) => ({
                        ...prev,
                        status: on ? null : s,
                      }))
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>
                      {SHOW_STATUS_LABEL[s]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={styles.sheetClose}
              onPress={() => setSheetOpen(false)}
              accessibilityRole="button"
            >
              <Text style={styles.sheetCloseText}>
                Voir les résultats{activeCount > 0 ? ` (${activeCount} filtres)` : ''}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  searchWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  // Filter pills — chip anatomy (full radius, mono label).
  filterBtn: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.full,
    backgroundColor: colors.bone,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  filterBtnActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterBtnCobalt: {
    backgroundColor: colors.cobalt,
    borderColor: colors.ink,
  },
  filterText: {
    ...type.labelSm,
    color: colors.ink,
  },
  filterTextActive: {
    color: colors.acid,
  },
  filterTextOnCobalt: {
    color: colors.onCobalt,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  sectionLabel: {
    ...type.labelSm,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  loading: { marginTop: spacing.xxl },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  recentIcon: {
    fontSize: 15,
    marginRight: spacing.sm,
  },
  recentText: {
    ...type.bodyMd,
    color: colors.ink,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: border.rule,
    borderBottomColor: colors.ink,
  },
  resultPoster: {
    width: 44,
    height: 60,
  },
  resultText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  resultTitle: {
    ...type.headlineMd,
    fontSize: 16,
    color: colors.ink,
  },
  resultSub: {
    ...type.micro,
    color: colors.muted,
    marginTop: 2,
  },

  // Filters sheet
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
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    ...type.headlineLg,
    fontSize: 20,
    color: colors.ink,
  },
  clearAll: {
    ...type.labelSm,
    color: colors.signal,
  },
  sheetSection: {
    ...type.labelSm,
    color: colors.ink,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.full,
    backgroundColor: colors.bone,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  chipOn: {
    backgroundColor: colors.ink,
  },
  chipText: {
    ...type.labelSm,
    color: colors.ink,
  },
  chipTextOn: {
    color: colors.acid,
  },
  sheetClose: {
    marginTop: spacing.lg,
    minHeight: 52,
    borderWidth: border.rule,
    borderColor: colors.ink,
    backgroundColor: colors.signal,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseText: {
    ...type.button,
    fontSize: 13,
    color: colors.onSignal,
  },
});
