import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { TabScreenProps } from '../navigation/types';
import { Avatar, Poster } from '../components/common';
import { MOCK_SHOWS } from '../lib/mockShows';
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

export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<Filter, boolean>>({
    shows: true,
    people: true,
  });
  const inputRef = useRef<TextInput>(null);

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

  const results = useMemo<Result[]>(() => {
    // Normalize the query so search is case- and accent-insensitive
    // (e.g. "moliere" matches "Molière").
    const q = normalizeText(query);
    if (!q) return [];
    const out: Result[] = [];
    if (filters.shows) {
      for (const s of MOCK_SHOWS) {
        // Match against title, company (artist/troupe) and venues.
        const haystack = normalizeText(
          `${s.title} ${s.company} ${s.venues.join(' ')}`
        );
        if (haystack.includes(q)) {
          out.push({
            type: 'show',
            id: s.id,
            title: s.title,
            subtitle: s.venues[0],
          });
        }
      }
    }
    if (filters.people) {
      for (const u of MOCK_USERS) {
        if (normalizeText(u.username).includes(q)) {
          out.push({ type: 'person', id: u.id, username: u.username });
        }
      }
    }
    return out;
  }, [query, filters]);

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
    if (!hasQuery) {
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

    // Zero results.
    if (results.length === 0) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Aucun résultat</Text>
          <Text style={styles.emptyText}>
            Rien ne correspond à « {query.trim()} ».
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Main', { screen: 'Decouverte' })}
          >
            <Text style={styles.link}>Découvrir le catalogue →</Text>
          </Pressable>
        </View>
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
      </View>

      {renderBody()}
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
  filterText: {
    ...type.labelSm,
    color: colors.ink,
  },
  filterTextActive: {
    color: colors.acid,
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
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
});
