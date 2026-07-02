// Display shape for notifications, decoupled from the real `notifications`
// table's compact row shape (id, user_id, type, ref_id, actor_id, read_at,
// created_at). AppStateContext resolves rows into this shape (batch-fetching
// actor usernames) so NotificationsScreen/FeedScreen don't need to know about
// the underlying columns.
//
// NOTE: matches the real DB check constraint exactly —
// type in ('applause','follow_request','new_follower','editorial').
// The earlier mock had extra types ('comment', 'follow') that don't exist in
// the real schema and have been dropped.
export type NotificationType =
  | 'applause'
  | 'follow_request'
  | 'new_follower'
  | 'editorial';

export type NotificationItem = {
  id: string;
  type: NotificationType;
  actorId: string | null;
  actorUsername: string | null;
  target:
    | { screen: 'Profile'; userId: string; username: string }
    | { screen: 'ShowDetail'; showId: string; title?: string };
  text: string;
  date: string;
  read: boolean;
};

// Static French phrase per type — the real table has no text column, so the
// client renders copy from `type` (+ actor username, prefixed by the caller).
export const NOTIF_TEXT: Record<NotificationType, string> = {
  applause: 'a applaudi ton avis',
  follow_request: 'souhaite te suivre',
  new_follower: 'a commencé à te suivre',
  editorial: 'La reco de la semaine.',
};

export const NOTIF_ICON: Record<NotificationType, string> = {
  applause: '👏',
  follow_request: '🔔',
  new_follower: '➕',
  editorial: '✨',
};
