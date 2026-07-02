import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerActions } from '@react-navigation/native';
import type { TabScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import { AppHeader } from '../components/AppHeader';
import { EmptyState, Poster, PressableScale, Rating } from '../components/common';
import { CATEGORIES } from '../lib/shows';
import type { Show } from '../lib/shows';
import { border, colors, radius, spacing, type } from '../theme/tokens';

type Props = TabScreenProps<'Decouverte'>;

const ROW_SIZE = 8;

function ShowCardH({
  show,
  stats,
  onPress,
}: {
  show: Show;
  stats: { rating: number; logCount: number };
  onPress: () => void;
}) {
  return (
    <PressableScale style={styles.hCard} onPress={onPress}>
      <Poster style={styles.hPoster} />
      <Text style={styles.hTitle} numberOfLines={1}>
        {show.title}
      </Text>
      <Text style={styles.hVenue} numberOfLines={1}>
        {show.venues[0]}
      </Text>
      {stats.logCount > 0 ? (
        <View style={styles.hRating}>
          <Rating value={stats.rating} />
        </View>
      ) : null}
    </PressableScale>
  );
}

export default function DiscoverScreen({ navigation }: Props) {
  const { shows, showsLoading, showsError, refreshShows, getShowStats, myProfile, unreadCount } =
    useAppState();
  const [refreshing, setRefreshing] = useState(false);

  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshShows();
    setRefreshing(false);
  };

  // The real catalogue has no editorial "trending"/"new" curation flag yet,
  // so these rows are derived client-side: trending = most logged, nouveautés
  // = most recently added to the catalogue (shows are fetched newest-first).
  const trending = useMemo(
    () =>
      [...shows]
        .sort((a, b) => getShowStats(b.id).logCount - getShowStats(a.id).logCount)
        .slice(0, ROW_SIZE),
    [shows, getShowStats]
  );
  const fresh = useMemo(() => shows.slice(0, ROW_SIZE), [shows]);

  const openShow = (show: Show) =>
    navigation.navigate('ShowDetail', { showId: show.id, title: show.title });

  const openCategory = (category: string) =>
    navigation.navigate('CategoryList', { category });

  const renderRow = (title: string, rowShows: Show[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hRow}
      >
        {rowShows.map((show) => (
          <ShowCardH
            key={show.id}
            show={show}
            stats={getShowStats(show.id)}
            onPress={() => openShow(show)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title="Découverte"
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
      {showsLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.ink} />
      ) : showsError ? (
        <EmptyState
          icon="⚠️"
          title="Erreur de chargement"
          message={showsError}
          ctaLabel="Réessayer"
          onCtaPress={() => refreshShows()}
        />
      ) : shows.length === 0 ? (
        <EmptyState
          icon="🎭"
          title="Catalogue vide"
          message="Aucun spectacle n'a encore été ajouté."
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.ink}
              colors={[colors.ink]}
            />
          }
        >
          {renderRow('Tendances', trending)}
          {renderRow('Nouveautés', fresh)}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Catégories</Text>
            <View style={styles.grid}>
              {CATEGORIES.map((category) => (
                <Pressable
                  key={category}
                  style={styles.categoryBox}
                  onPress={() => openCategory(category)}
                  accessibilityRole="button"
                >
                  <Text style={styles.categoryText}>{category}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  loading: { marginTop: spacing.xxl },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...type.labelSm,
    color: colors.ink,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  hRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  hCard: {
    width: 140,
  },
  hPoster: {
    height: 180,
    marginBottom: spacing.xs,
  },
  hTitle: {
    ...type.headlineMd,
    fontSize: 14,
    color: colors.ink,
  },
  hVenue: {
    ...type.micro,
    color: colors.muted,
    marginTop: 2,
  },
  hRating: {
    marginTop: spacing.xxs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryBox: {
    width: '47%',
    height: 88,
    borderRadius: radius.none,
    borderWidth: border.rule,
    borderColor: colors.ink,
    backgroundColor: colors.bone,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  categoryText: {
    ...type.labelSm,
    color: colors.ink,
    textAlign: 'center',
  },
});
