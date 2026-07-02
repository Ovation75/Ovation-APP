import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TabScreenProps } from '../navigation/types';
import { Poster } from '../components/common';
import { border, colors, radius, spacing, type } from '../theme/tokens';
import {
  CATEGORIES,
  NEW_SHOWS,
  TRENDING_SHOWS,
  type Show,
} from '../lib/mockShows';

type Props = TabScreenProps<'Decouverte'>;

function ShowCardH({
  show,
  onPress,
}: {
  show: Show;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.hCard} onPress={onPress}>
      <Poster style={styles.hPoster} />
      <Text style={styles.hTitle} numberOfLines={1}>
        {show.title}
      </Text>
      <Text style={styles.hVenue} numberOfLines={1}>
        {show.venues[0]}
      </Text>
    </Pressable>
  );
}

export default function DiscoverScreen({ navigation }: Props) {
  const openShow = (show: Show) =>
    navigation.navigate('ShowDetail', { showId: show.id, title: show.title });

  const openCategory = (category: string) =>
    navigation.navigate('CategoryList', { category });

  const renderRow = (title: string, shows: Show[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hRow}
      >
        {shows.map((show) => (
          <ShowCardH
            key={show.id}
            show={show}
            onPress={() => openShow(show)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Découverte</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderRow('Tendances', TRENDING_SHOWS)}
        {renderRow('Nouveautés', NEW_SHOWS)}

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
    borderBottomWidth: border.rule,
    borderBottomColor: colors.ink,
  },
  headerTitle: {
    ...type.displayMd,
    color: colors.ink,
  },
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
