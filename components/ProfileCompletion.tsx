import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from './common';
import type {
  CompletionTarget,
  ProfileCompletion,
} from '../lib/profileCompletion';
import { hapticSelect } from '../lib/haptics';
import { border, colors, radius, spacing, type } from '../theme/tokens';

// Profile-completion surface, shared by:
//   - MyProfile (persistent card, no dismiss)
//   - Feed (post-login prompt: dismissible + primary CTA)
// Non-blocking everywhere — it's a nudge, never a gate.
export function ProfileCompletion({
  completion,
  onNavigate,
  onDismiss,
}: {
  completion: ProfileCompletion;
  onNavigate: (target: CompletionTarget) => void;
  onDismiss?: () => void;
}) {
  const { percent, todo } = completion;
  // First actionable (non-coming) item drives the primary CTA.
  const primaryTarget = todo.find((i) => !i.coming)?.target ?? 'EditProfile';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Complète ton profil</Text>
        {onDismiss ? (
          <Pressable
            onPress={() => {
              hapticSelect();
              onDismiss();
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Masquer"
          >
            <Text style={styles.dismiss}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.percent}>Profil complété à {percent}%</Text>
      <View style={styles.bar}>
        <ProgressBar percent={percent} />
      </View>

      <View style={styles.items}>
        {todo.map((item) => (
          <Pressable
            key={item.key}
            style={styles.item}
            onPress={() => {
              if (item.coming) return;
              hapticSelect();
              onNavigate(item.target);
            }}
            disabled={item.coming}
            accessibilityRole="button"
          >
            <Text style={styles.itemDot}>○</Text>
            <Text style={styles.itemLabel}>{item.label}</Text>
            {item.coming ? (
              <Text style={styles.itemComing}>Bientôt</Text>
            ) : (
              <Text style={styles.itemChevron}>›</Text>
            )}
          </Pressable>
        ))}
      </View>

      {onDismiss ? (
        <Pressable
          style={styles.cta}
          onPress={() => {
            hapticSelect();
            onNavigate(primaryTarget);
          }}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>Compléter maintenant</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bone,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { ...type.headlineMd, color: colors.ink },
  dismiss: { ...type.headlineMd, color: colors.muted },
  percent: { ...type.micro, color: colors.muted, marginTop: 2 },
  bar: { marginTop: spacing.xs },
  items: { marginTop: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  itemDot: { fontSize: 14, color: colors.signal, width: 22 },
  itemLabel: { ...type.bodyMdMedium, fontSize: 14, color: colors.ink, flex: 1 },
  itemChevron: { ...type.headlineMd, color: colors.muted },
  itemComing: { ...type.micro, fontSize: 9, color: colors.muted },
  cta: {
    marginTop: spacing.sm,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    backgroundColor: colors.signal,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  ctaText: { ...type.button, fontSize: 13, color: colors.onSignal },
});
