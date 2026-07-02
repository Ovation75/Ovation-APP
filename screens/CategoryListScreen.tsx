import { useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import { Poster, Rating } from '../components/common';
import type { ShowGenre } from '../lib/shows';
import { border, colors, spacing, type } from '../theme/tokens';

// Filtered catalogue list, reached from the Découverte categories grid.
export default function CategoryListScreen({
  route,
  navigation,
}: RootStackScreenProps<'CategoryList'>) {
  const { category } = route.params;
  const { shows: allShows, showsLoading, getShowStats } = useAppState();

  useLayoutEffect(() => {
    navigation.setOptions({ title: category });
  }, [navigation, category]);

  const shows = allShows.filter((s) => s.genre === (category as ShowGenre));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {showsLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.ink} />
      ) : shows.length === 0 ? (
        <Text style={styles.empty}>Aucun spectacle dans cette catégorie.</Text>
      ) : (
        shows.map((show) => {
          const stats = getShowStats(show.id);
          return (
            <Pressable
              key={show.id}
              style={styles.row}
              onPress={() =>
                navigation.navigate('ShowDetail', {
                  showId: show.id,
                  title: show.title,
                })
              }
            >
              <Poster style={styles.poster} label="" />
              <View style={styles.text}>
                <Text style={styles.title}>{show.title}</Text>
                <Text style={styles.sub}>{show.venues[0]}</Text>
              </View>
              {stats.logCount > 0 ? <Rating value={stats.rating} /> : null}
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg },
  empty: {
    ...type.bodySm,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: border.rule,
    borderBottomColor: colors.ink,
  },
  poster: { width: 44, height: 60 },
  text: { flex: 1, marginLeft: spacing.sm },
  title: { ...type.headlineMd, fontSize: 16, color: colors.ink },
  sub: { ...type.micro, color: colors.muted, marginTop: 2 },
  loading: { marginTop: spacing.xxl },
});
