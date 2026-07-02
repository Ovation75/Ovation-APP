import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { hapticSelect } from '../lib/haptics';
import { border, colors, radius, spacing, type } from '../theme/tokens';

// ---------------------------------------------------------------------------
// Shared settings-style UI, used by Settings / Preferences / Blocked Users /
// Reports Sent so every "grouped card of rows" screen looks identical
// (BROADSIDE hard ink rules, mono section labels, icons + chevrons).
// ---------------------------------------------------------------------------

// A titled group: mono uppercase label, an ink-framed bone card, and an
// optional footer note beneath.
export function Section({
  title,
  footer,
  children,
}: {
  title?: string;
  footer?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      <View style={styles.card}>{children}</View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

// A single row. `chevron` shows a "›" affordance for navigation rows; `right`
// overrides the trailing slot (e.g. a Switch); `value` prints muted text.
export function Row({
  icon,
  label,
  value,
  onPress,
  right,
  danger,
  chevron,
  last,
}: {
  icon?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
  chevron?: boolean;
  last?: boolean;
}) {
  const trailing =
    right ??
    (chevron ? (
      <View style={styles.trailing}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <Text style={styles.chevron}>›</Text>
      </View>
    ) : value ? (
      <Text style={styles.rowValue}>{value}</Text>
    ) : null);

  return (
    <Pressable
      style={[styles.row, last && styles.rowLast]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {icon ? <Text style={styles.rowIcon}>{icon}</Text> : null}
      <Text style={[styles.rowLabel, danger && styles.danger]} numberOfLines={1}>
        {label}
      </Text>
      {trailing}
    </Pressable>
  );
}

// Row with a right-aligned Switch and optional description line beneath.
export function SwitchRow({
  icon,
  label,
  description,
  value,
  onValueChange,
  last,
}: {
  icon?: string;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, styles.switchRow, last && styles.rowLast]}>
      {icon ? <Text style={styles.rowIcon}>{icon}</Text> : null}
      <View style={styles.switchText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? (
          <Text style={styles.rowDescription}>{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          hapticSelect();
          onValueChange(v);
        }}
        trackColor={{ false: colors.stock, true: colors.acid }}
        thumbColor={colors.ink}
        ios_backgroundColor={colors.stock}
      />
    </View>
  );
}

// Selectable chip (multi-select) — pill, ink-framed, acid fill when active.
export function SelectChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipActive]}
      onPress={() => {
        hapticSelect();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// Segmented single-choice control (e.g. content preference).
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[
              styles.segmentBtn,
              i > 0 && styles.segmentBtnDivider,
              active && styles.segmentBtnActive,
            ]}
            onPress={() => {
              hapticSelect();
              onChange(opt.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const settingsStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { paddingVertical: spacing.lg, paddingBottom: spacing.xxl },
});

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    ...type.labelSm,
    color: colors.muted,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.bone,
    marginHorizontal: spacing.md,
    borderRadius: radius.none,
    borderWidth: border.rule,
    borderColor: colors.ink,
    paddingHorizontal: spacing.md,
  },
  footer: {
    ...type.micro,
    color: colors.muted,
    letterSpacing: 0,
    textTransform: 'none',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: border.hair,
    borderBottomColor: colors.stock,
    minHeight: 52,
  },
  rowLast: { borderBottomWidth: 0 },
  switchRow: { justifyContent: 'space-between' },
  switchText: { flex: 1, paddingRight: spacing.sm },
  rowIcon: { fontSize: 17, width: 28 },
  rowLabel: { ...type.bodyMdMedium, fontSize: 15, color: colors.ink, flex: 1 },
  rowDescription: {
    ...type.bodySm,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  rowValue: { ...type.bodySm, color: colors.muted },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  chevron: { ...type.headlineMd, color: colors.muted, marginLeft: spacing.xxs },
  danger: { color: colors.signal },
  chip: {
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.full,
    backgroundColor: colors.bone,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipActive: { backgroundColor: colors.acid },
  chipText: { ...type.bodySmMedium, fontSize: 13, color: colors.ink },
  chipTextActive: { color: colors.onAcid },
  segment: { flexDirection: 'row', borderWidth: border.rule, borderColor: colors.ink },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  segmentBtnDivider: { borderLeftWidth: border.rule, borderLeftColor: colors.ink },
  segmentBtnActive: { backgroundColor: colors.ink },
  segmentText: { ...type.button, fontSize: 12, color: colors.ink },
  segmentTextActive: { color: colors.acid },
});
