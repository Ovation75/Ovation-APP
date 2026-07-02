import { StyleSheet, Text, View } from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';
import { colors, spacing, type } from '../theme/tokens';

// Placeholder for the filtered catalogue list (reached from Découverte categories).
export default function CategoryListScreen({
  route,
}: RootStackScreenProps<'CategoryList'>) {
  const { category } = route.params;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Liste filtrée — À venir</Text>
      <Text style={styles.sub}>{category}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  text: { ...type.displayMd, fontSize: 24, color: colors.ink, textAlign: 'center' },
  sub: { ...type.labelSm, marginTop: spacing.sm, color: colors.muted },
});
