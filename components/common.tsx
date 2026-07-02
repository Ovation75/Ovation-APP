import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { border, colors, fonts, radius, spacing, type } from '../theme/tokens';

// Compact rating: one star glyph + numeric value with a French comma.
// Numeric/technical content uses the mono voice per BROADSIDE.
// Visual only — the full 10-icon rating interface lives in the log flow (E05).
export function Rating({ value, muted }: { value: number; muted?: boolean }) {
  return (
    <Text style={[styles.rating, muted && styles.ratingMuted]}>
      ★ {value.toFixed(1).replace('.', ',')}
    </Text>
  );
}

// Initials avatar as a hard ink-framed square (icon-tile anatomy), the
// Archivo Black initial printed on ink.
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initial = (name.trim().charAt(0) || '?').toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.44 }]}>
        {initial}
      </Text>
    </View>
  );
}

// "Poster" placeholder used wherever a show visual would go — a stock panel
// inside a 2px ink frame with a mono label.
export function Poster({
  label = 'Affiche',
  style,
}: {
  label?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.poster, style]}>
      <Text style={styles.posterText}>{label}</Text>
    </View>
  );
}

// Chip/badge: full pill, mono uppercase label. `dark` inverts to ink fill.
export function Pill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'dark';
}) {
  return (
    <View style={[styles.pill, tone === 'dark' && styles.pillDark]}>
      <Text style={[styles.pillText, tone === 'dark' && styles.pillTextDark]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rating: {
    fontFamily: fonts.monoBold,
    fontSize: 14,
    letterSpacing: 0.5,
    color: colors.ink,
  },
  ratingMuted: {
    color: colors.muted,
  },
  avatar: {
    backgroundColor: colors.ink,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: type.displayMd.fontFamily,
    color: colors.onInk,
  },
  poster: {
    backgroundColor: colors.stock,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterText: {
    ...type.micro,
    color: colors.muted,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bone,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  pillDark: {
    backgroundColor: colors.ink,
  },
  pillText: {
    ...type.labelSm,
    color: colors.ink,
  },
  pillTextDark: {
    color: colors.onInk,
  },
});
