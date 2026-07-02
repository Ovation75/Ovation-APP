import { StyleSheet, Text, View } from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';
import { colors, spacing, type } from '../theme/tokens';

// Placeholder for a single playlist's contents (E06).
export default function PlaylistDetailScreen({
  route,
}: RootStackScreenProps<'PlaylistDetail'>) {
  const { name } = route.params;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Playlist — À venir</Text>
      {name ? <Text style={styles.sub}>{name}</Text> : null}
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
