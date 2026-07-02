import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
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

// Shared empty-state pattern: icon + title + message + optional CTA. Used by
// Wishlist, Journal, Search, Notifications, Playlist detail… so every "rien
// ici" moment looks the same.
export function EmptyState({
  icon,
  title,
  message,
  ctaLabel,
  onCtaPress,
}: {
  icon: string;
  title: string;
  message?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBox}>
        <Text style={styles.emptyIcon}>{icon}</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
      {ctaLabel && onCtaPress ? (
        <Pressable
          style={styles.emptyCta}
          onPress={onCtaPress}
          accessibilityRole="button"
        >
          <Text style={styles.emptyCtaText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// Card press feedback: subtle scale-down while pressed. Drop-in Pressable
// replacement for tappable cards/rows.
export function PressableScale({
  children,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: Omit<PressableProps, 'children' | 'style'> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={(e) => {
        Animated.timing(scale, {
          toValue: 0.97,
          duration: 80,
          useNativeDriver: true,
        }).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }).start();
        onPressOut?.(e);
      }}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// Toggle pulse feedback: quick scale pop on every press. For wishlist / log /
// applaudir style toggles where state flips in place.
export function PulsePressable({
  children,
  style,
  onPress,
  ...rest
}: Omit<PressableProps, 'children' | 'style'> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={(e) => {
        scale.setValue(1);
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.12,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
        ]).start();
        onPress?.(e);
      }}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// Status badge (full pill, mono uppercase). Covers the profile visibility and
// follow-request states used across profiles, cards and settings.
export function StatusBadge({
  status,
  label,
}: {
  status: 'public' | 'private' | 'pending';
  label?: string;
}) {
  const text =
    label ??
    (status === 'public' ? 'Public' : status === 'private' ? 'Privé' : 'En attente');
  return (
    <View style={[styles.statusBadge, styles[`statusBadge_${status}`]]}>
      <Text style={[styles.statusBadgeText, styles[`statusBadgeText_${status}`]]}>
        {text}
      </Text>
    </View>
  );
}

// Thin progress bar: stock track + acid fill inside a hard ink frame. `percent`
// is clamped 0–100.
export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${clamped}%` }]} />
    </View>
  );
}

// Shimmering placeholder block for async/loading content. Loops opacity so a
// loading profile/settings screen reads as "loading" rather than empty.
export function Skeleton({
  width = '100%',
  height = 16,
  radius: r = radius.none,
  style,
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[styles.skeleton, { width, height, borderRadius: r, opacity }, style]}
    />
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
  emptyWrap: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    backgroundColor: colors.bone,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    ...type.headlineLg,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptyMessage: {
    ...type.bodyMd,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyCta: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    backgroundColor: colors.signal,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  emptyCtaText: {
    ...type.button,
    fontSize: 13,
    color: colors.onSignal,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  statusBadge_public: { backgroundColor: colors.acid },
  statusBadge_private: { backgroundColor: colors.ink },
  statusBadge_pending: { backgroundColor: colors.bone },
  statusBadgeText: { ...type.micro },
  statusBadgeText_public: { color: colors.onAcid },
  statusBadgeText_private: { color: colors.onInk },
  statusBadgeText_pending: { color: colors.ink },
  progressTrack: {
    height: 12,
    backgroundColor: colors.stock,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.acid,
  },
  skeleton: {
    backgroundColor: colors.stock,
  },
});
