import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Avatar } from './common';
import { border, colors, radius, spacing, type } from '../theme/tokens';

// ---------------------------------------------------------------------------
// Shared app chrome (E00). Two pieces:
//   - HeaderIconButton: a square, ink-framed tap target for a single glyph
//     action (bell, gear, share, back…), with an optional unread-count badge.
//   - AppHeader: the in-body top bar used by the tab screens — left slot
//     (drawer avatar OR back button), a title/subtitle, and a right cluster
//     of actions plus an optional avatar shortcut.
// Both lean on theme/tokens so they stay on-brand (hard 2px ink, mono labels).
// ---------------------------------------------------------------------------

export type HeaderAction = {
  icon: string; // emoji/glyph
  onPress: () => void;
  accessibilityLabel: string;
  badge?: number; // optional unread-style count
};

export function HeaderIconButton({
  icon,
  onPress,
  accessibilityLabel,
  badge,
  style,
}: {
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
  badge?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      hitSlop={8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed, style]}
    >
      <Text style={styles.iconGlyph}>{icon}</Text>
      {badge && badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  // Left slot. `onOpenDrawer` renders the profile/avatar button that opens the
  // drawer (top-level screens). `onBack` renders a back chevron and takes
  // precedence (pushed screens). `avatarName` labels the drawer avatar.
  onOpenDrawer?: () => void;
  onBack?: () => void;
  avatarName?: string;
  // Right cluster: icon actions, then an optional avatar shortcut.
  actions?: HeaderAction[];
  avatarShortcut?: { name: string; onPress: () => void };
  // `display` uses the big Archivo title (tab screens); `plain` uses a smaller
  // bold title (pushed screens).
  variant?: 'display' | 'plain';
};

export function AppHeader({
  title,
  subtitle,
  onOpenDrawer,
  onBack,
  avatarName,
  actions,
  avatarShortcut,
  variant = 'display',
}: AppHeaderProps) {
  let left: ReactNode = null;
  if (onBack) {
    left = (
      <HeaderIconButton
        icon="‹"
        onPress={onBack}
        accessibilityLabel="Retour"
        style={styles.backBtn}
      />
    );
  } else if (onOpenDrawer) {
    left = (
      <Pressable
        hitSlop={8}
        onPress={onOpenDrawer}
        accessibilityRole="button"
        accessibilityLabel="Ouvrir le menu"
        style={({ pressed }) => [styles.avatarBtn, pressed && styles.iconBtnPressed]}
      >
        <Avatar name={avatarName ?? '?'} size={38} />
      </Pressable>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.side}>{left}</View>

      <View style={styles.titleWrap}>
        <Text
          style={variant === 'display' ? styles.titleDisplay : styles.titlePlain}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.side, styles.sideRight]}>
        {actions?.map((a) => (
          <HeaderIconButton
            key={a.accessibilityLabel}
            icon={a.icon}
            onPress={a.onPress}
            accessibilityLabel={a.accessibilityLabel}
            badge={a.badge}
          />
        ))}
        {avatarShortcut ? (
          <Pressable
            hitSlop={8}
            onPress={avatarShortcut.onPress}
            accessibilityRole="button"
            accessibilityLabel="Mon profil"
            style={({ pressed }) => [styles.avatarBtn, pressed && styles.iconBtnPressed]}
          >
            <Avatar name={avatarShortcut.name} size={34} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 56,
    backgroundColor: colors.paper,
    borderBottomWidth: border.rule,
    borderBottomColor: colors.ink,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 44,
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  titleWrap: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  titleDisplay: {
    ...type.displayMd,
    fontSize: 26,
    color: colors.ink,
  },
  titlePlain: {
    ...type.headlineLg,
    color: colors.ink,
  },
  subtitle: {
    ...type.micro,
    color: colors.muted,
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.none,
  },
  iconBtnPressed: {
    opacity: 0.5,
  },
  backBtn: {
    marginLeft: -spacing.xxs,
  },
  iconGlyph: {
    fontSize: 22,
    color: colors.ink,
  },
  avatarBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: radius.full,
    backgroundColor: colors.signal,
    borderWidth: border.hair,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...type.micro,
    fontSize: 9,
    letterSpacing: 0,
    color: colors.onSignal,
  },
});
