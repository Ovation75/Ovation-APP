// Thin wrapper around expo-haptics so call sites stay one-liners and haptics
// can never crash a flow (fire-and-forget, errors swallowed — e.g. on web).
import * as Haptics from 'expo-haptics';

// Light tick — toggles (wishlist, applaudir, follow, switches).
export function hapticSelect(): void {
  Haptics.selectionAsync().catch(() => {});
}

// Success notification — completed actions (log published, playlist created).
export function hapticSuccess(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {}
  );
}

// Medium impact — destructive/heavier actions (delete log, block user).
export function hapticImpact(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
