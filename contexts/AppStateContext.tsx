import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '../lib/supabase';
import { isUuid } from '../lib/uuid';
import { isAuthError, describeError } from '../lib/supabaseErrors';
import { formatDateFr } from '../lib/date';
import type { Show } from '../lib/shows';
import { fetchShows, fetchAllLogRatings } from '../lib/supabaseCatalogue';
import {
  NOTIF_TEXT,
  type NotificationItem,
  type NotificationType,
} from '../lib/notifications';
import { MOCK_USERS } from '../lib/mockUsers';

// ---------------------------------------------------------------------------
// Shared, app-wide state, now backed by real Supabase tables (logs,
// wishlist_items, playlists, playlist_items, follows, notifications, reports,
// blocks, shows, show_venues, profiles). auth/signout was already real; this
// is everything else.
//
// KNOWN GAP — mixed mock/real data: only the CURRENT authenticated user's own
// activity is real. There is no seeded real multi-user data yet, so:
//   - "other users" (camille_p / theo.m / sofia) stay 100% mock, sourced from
//     lib/mockUsers.ts. Their ids ('u1'/'u2'/'u3') are not valid uuids.
//   - Feed community cards and Fiche Spectacle public reviews for those users
//     stay mocked (lib/mockFeed.ts, lib/mockShows.ts) — see each file's header.
//   - Any action that targets one of those mock users (follow/block/report)
//     is guarded by `isUuid()` and kept LOCAL-ONLY (in-memory, not persisted)
//     instead of silently mixing fake writes into real tables. This is
//     intentional, not a bug — flagged wherever it applies below.
// Purely UI-local state (selected tab, text inputs, modal open/closed,
// search query) stays inside the screens, unchanged.
// ---------------------------------------------------------------------------

// ---- Logs (E05) -----------------------------------------------------------
export type Log = {
  id: string;
  showId: string;
  rating: number; // 0–5, 0.5 increments
  review?: string; // optional, 500 char max
  date: string; // pre-formatted French date, derived from created_at
  sortKey: number; // created_at as epoch ms, for ordering
};

// ---- Playlists (E06) -------------------------------------------------------
export type Playlist = {
  id: string;
  name: string;
  emoji: string;
  isFavorites: boolean;
  isPublic: boolean;
};

export type PlaylistItem = { playlistId: string; showId: string };

// ---- Follow (E09) -----------------------------------------------------------
export type FollowStatus = 'none' | 'pending' | 'approved';

// ---- Notification settings (E11) ------------------------------------------
// STILL MOCKED — there is no notification_settings table in the real schema,
// so these stay in-memory only (reset on app restart). Not part of this
// Supabase wiring pass.
export type NotificationSettings = {
  push: boolean;
  social: boolean;
  editorial: boolean;
};

// ---- User preferences (Découverte / Feed / Privacy / Notifications /
// Accessibility) --------------------------------------------------------------
// LOCAL-ONLY — there is no user_preferences table in the current schema, so
// these live in-memory and reset on app restart (same gap pattern as
// notificationSettings above). scripts/profile-preferences-schema.sql proposes
// the table + columns that would let these persist; nothing is applied yet.
export type ContentPreference = 'popular' | 'recent' | 'friends';

export type Preferences = {
  // Découverte
  preferredGenres: string[]; // ShowGenre labels (multi-select)
  preferredVenues: string[]; // venue names (multi-select)
  contentPreference: ContentPreference;
  // Feed
  feedFriendActivity: boolean;
  feedEditorial: boolean;
  feedRecommendations: boolean;
  // Privacy
  showRatings: boolean;
  showWishlist: boolean;
  // Notifications
  notifyApplause: boolean;
  notifyComments: boolean;
  notifyFollowRequests: boolean;
  notifyEditorial: boolean;
  // Accessibility
  reducedMotion: boolean;
  compactCards: boolean;
  darkMode: boolean; // placeholder — no dark theme implemented yet
};

export const DEFAULT_PREFERENCES: Preferences = {
  preferredGenres: [],
  preferredVenues: [],
  contentPreference: 'popular',
  feedFriendActivity: true,
  feedEditorial: true,
  feedRecommendations: true,
  showRatings: true,
  showWishlist: false,
  notifyApplause: true,
  notifyComments: true,
  notifyFollowRequests: true,
  notifyEditorial: false,
  reducedMotion: false,
  compactCards: false,
  darkMode: false,
};

// ---- Moderation -------------------------------------------------------------
// Mirrors the real schema exactly:
//   reports(reporter_id, target_type, target_id, reason, status)
//     target_type in ('log','profile') — NOT 'review'; a review IS a log.
//     status in ('open','resolved','dismissed')
//   blocks(user_id, blocked_user_id)
export type ReportTargetType = 'log' | 'profile';
export type ReportStatus = 'open' | 'resolved' | 'dismissed';

export type Report = {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: ReportStatus;
};

export type Block = {
  userId: string;
  blockedUserId: string;
};

// ---- Computed profile stats (E09) -----------------------------------------
export type MyStats = {
  showsSeen: number;
  averageRating: number;
  topGenre: string;
};

export type MyProfile = {
  username: string;
  bio: string | null;
  isPublic: boolean;
};

type AppState = {
  // ---- Session --------------------------------------------------------
  currentUserId: string | null;
  sessionLoading: boolean;
  // Flips true when a query hits an auth/JWT error; App.tsx watches this to
  // force-sign-out and redirect to Login (distinct from a deliberate
  // Déconnexion in Settings, which already navigates itself).
  sessionExpired: boolean;

  // ---- My profile (E09) ------------------------------------------------
  myProfile: MyProfile | null;
  myProfileLoading: boolean;
  followerCount: number;
  followingCount: number;
  // Persists profile edits (username/bio/is_public — the only editable columns
  // that exist on the profiles table) and updates local state optimistically.
  updateMyProfile: (fields: MyProfile) => Promise<{ error: string | null }>;

  // ---- Show catalogue (E08) --------------------------------------------
  shows: Show[];
  showsLoading: boolean;
  showsError: string | null;
  getShowById: (showId: string) => Show | undefined;
  refreshShows: () => Promise<void>;
  getShowStats: (showId: string) => { rating: number; logCount: number };

  // ---- Wishlist (E07) ----------------------------------------------------
  wishlist: string[];
  wishlistLoading: boolean;
  isWishlisted: (showId: string) => boolean;
  addToWishlist: (showId: string) => Promise<void>;
  removeFromWishlist: (showId: string) => Promise<void>;
  toggleWishlist: (showId: string) => Promise<void>;
  canWishlist: (showId: string) => boolean;

  // ---- Logs (E05) ----
  logs: Log[];
  logsLoading: boolean;
  getLogForShow: (showId: string) => Log | undefined;
  isLogged: (showId: string) => boolean;
  addOrUpdateLog: (
    showId: string,
    rating: number,
    review?: string
  ) => Promise<{ error: string | null }>;
  removeLog: (showId: string) => Promise<{ error: string | null }>;
  myStats: MyStats;

  // ---- Playlists (E06) ----
  playlists: Playlist[]; // Favoris first
  playlistItems: PlaylistItem[];
  playlistsLoading: boolean;
  getPlaylistShowIds: (playlistId: string) => string[];
  playlistItemCount: (playlistId: string) => number;
  isShowInPlaylist: (playlistId: string, showId: string) => boolean;
  createPlaylist: (
    name: string,
    emoji: string,
    isPublic: boolean
  ) => Promise<{ id: string | null; error: string | null }>;
  renamePlaylist: (
    playlistId: string,
    name: string
  ) => Promise<{ error: string | null }>;
  setPlaylistVisibility: (
    playlistId: string,
    isPublic: boolean
  ) => Promise<{ error: string | null }>;
  deletePlaylist: (playlistId: string) => Promise<{ error: string | null }>;
  addShowToPlaylist: (playlistId: string, showId: string) => Promise<void>;
  removeShowFromPlaylist: (playlistId: string, showId: string) => Promise<void>;

  // ---- Follow (E09) ----
  following: string[];
  followsLoading: boolean;
  isFollowing: (userId: string) => boolean;
  getFollowStatus: (userId: string) => FollowStatus;
  followUser: (userId: string) => Promise<void>; // instant (public profiles)
  requestFollow: (userId: string) => Promise<void>; // pending (private profiles)
  unfollowUser: (userId: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<void>;

  // ---- Notifications (E10) ----
  notifications: NotificationItem[];
  notificationsLoading: boolean;
  unreadCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  // ---- Notification settings (E11, still mocked — no table) ----
  notificationSettings: NotificationSettings;
  setNotificationSetting: (
    key: keyof NotificationSettings,
    value: boolean
  ) => void;

  // ---- User preferences (local-only — see Preferences type note) ----
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) => void;

  // ---- Profile-completion prompt (session-local dismiss) ----
  // The post-login Feed prompt sets this so it stays hidden for the rest of the
  // session. Not persisted (no profile_completion_dismissed column yet — see
  // scripts/profile-preferences-schema.sql), so it reappears on next launch.
  profileCompletionDismissed: boolean;
  dismissProfileCompletion: () => void;

  // ---- Applause on reviews (still mocked — no applause table in schema) ----
  getApplause: (reviewId: string, base: number) => number;
  hasApplauded: (reviewId: string) => boolean;
  toggleApplause: (reviewId: string, reviewOwnerId?: string, showId?: string) => void;

  // ---- Moderation ----
  blockedUsers: string[];
  isBlocked: (userId: string) => boolean;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  reports: Report[];
  isReported: (targetType: ReportTargetType, targetId: string) => boolean;
  reportContent: (
    targetType: ReportTargetType,
    targetId: string,
    reason: string
  ) => Promise<void>;
};

const AppStateContext = createContext<AppState | null>(null);

// Seed local-only follow status for the still-mocked "other users" so the
// demo doesn't regress visually (camille_p already shown as followed). Never
// touches Supabase — see the module doc comment above.
const INITIAL_LOCAL_FOLLOW: Record<string, FollowStatus> = Object.fromEntries(
  MOCK_USERS.filter((u) => u.isFollowing).map((u) => [u.id, 'approved'])
);

// ---- Raw DB row shapes (internal) ------------------------------------------
type LogRow = {
  id: string;
  show_id: string;
  rating: number;
  review: string | null;
  created_at: string;
};
type PlaylistRow = {
  id: string;
  name: string;
  emoji: string | null;
  is_favorites: boolean;
  is_public: boolean;
};
type PlaylistItemRow = { playlist_id: string; show_id: string };
type FollowRow = { followed_id: string; status: FollowStatus };
type NotificationRow = {
  id: string;
  type: NotificationType;
  ref_id: string | null;
  actor_id: string | null;
  read_at: string | null;
  created_at: string;
};
type BlockRow = { blocked_user_id: string };

function toLog(row: LogRow): Log {
  const created = new Date(row.created_at);
  return {
    id: row.id,
    showId: row.show_id,
    rating: row.rating,
    review: row.review ?? undefined,
    date: formatDateFr(created),
    sortKey: created.getTime(),
  };
}

function toPlaylist(row: PlaylistRow): Playlist {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji ?? '🎭',
    isFavorites: row.is_favorites,
    isPublic: row.is_public,
  };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  // ---- Session --------------------------------------------------------
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setCurrentUserId(data.session?.user.id ?? null);
      setSessionLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user.id ?? null);
      setSessionLoading(false);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Any Supabase call in this provider funnels its error through here. On an
  // auth/JWT error we force a sign-out and flip `sessionExpired`; App.tsx
  // watches that flag to reset navigation to Login.
  const handleError = useCallback(
    (error: { message?: string; code?: string } | null, fallback: string): string | null => {
      if (!error) return null;
      if (isAuthError(error)) {
        setSessionExpired(true);
        supabase.auth.signOut().catch(() => {});
      }
      return describeError(error, fallback);
    },
    []
  );

  // ---- My profile -------------------------------------------------------
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
  const [myProfileLoading, setMyProfileLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const refreshMyProfile = useCallback(async (uid: string) => {
    setMyProfileLoading(true);
    const [{ data: profile, error: profileError }, followers, followingRes] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('username, bio, is_public')
          .eq('id', uid)
          .maybeSingle(),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('followed_id', uid)
          .eq('status', 'approved'),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', uid)
          .eq('status', 'approved'),
      ]);
    handleError(profileError, 'Impossible de charger le profil.');
    setMyProfile(
      profile
        ? { username: profile.username, bio: profile.bio, isPublic: profile.is_public }
        : null
    );
    setFollowerCount(followers.count ?? 0);
    setFollowingCount(followingRes.count ?? 0);
    setMyProfileLoading(false);
  }, [handleError]);

  // Only writes the columns that exist on `profiles` (username, bio, is_public).
  // display_name / avatar have no column and are intentionally not persisted.
  const updateMyProfile = useCallback(
    async (fields: MyProfile) => {
      if (!currentUserId) return { error: 'Non connecté.' };
      const { error } = await supabase
        .from('profiles')
        .update({
          username: fields.username,
          bio: fields.bio,
          is_public: fields.isPublic,
        })
        .eq('id', currentUserId);
      const msg = handleError(error, 'Impossible de mettre à jour le profil.');
      if (msg) return { error: msg };
      setMyProfile(fields);
      return { error: null };
    },
    [currentUserId, handleError]
  );

  // ---- Show catalogue -----------------------------------------------------
  const [shows, setShows] = useState<Show[]>([]);
  const [showsLoading, setShowsLoading] = useState(true);
  const [showsError, setShowsError] = useState<string | null>(null);
  const [communityRatings, setCommunityRatings] = useState<
    { show_id: string; rating: number; user_id: string }[]
  >([]);

  const refreshShows = useCallback(async () => {
    setShowsLoading(true);
    setShowsError(null);
    const { shows: fetched, error } = await fetchShows();
    if (error) setShowsError(error);
    setShows(fetched);
    setShowsLoading(false);
  }, []);

  const refreshCommunityRatings = useCallback(async () => {
    const { ratings, error } = await fetchAllLogRatings();
    if (!error) setCommunityRatings(ratings);
  }, []);

  const showsById = useMemo(() => new Map(shows.map((s) => [s.id, s])), [shows]);
  const getShowById = useCallback(
    (showId: string) => showsById.get(showId),
    [showsById]
  );

  // Declared here (ahead of Logs/getShowStats below, which needs it) rather
  // than in the Moderation section further down.
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [localBlockedMockIds, setLocalBlockedMockIds] = useState<string[]>([]);
  const blockedUsers = useMemo(
    () => [...blocks.map((b) => b.blockedUserId), ...localBlockedMockIds],
    [blocks, localBlockedMockIds]
  );

  // ---- Logs -----------------------------------------------------------
  const [logs, setLogs] = useState<Log[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const refreshLogs = useCallback(
    async (uid: string) => {
      setLogsLoading(true);
      const { data, error } = await supabase
        .from('logs')
        .select('id, show_id, rating, review, created_at')
        .eq('user_id', uid);
      handleError(error, 'Impossible de charger ton journal.');
      setLogs((data as LogRow[] | null)?.map(toLog) ?? []);
      setLogsLoading(false);
    },
    [handleError]
  );

  const getLogForShow = useCallback(
    (showId: string) => logs.find((l) => l.showId === showId),
    [logs]
  );
  const isLogged = useCallback(
    (showId: string) => logs.some((l) => l.showId === showId),
    [logs]
  );

  // ---- Wishlist -------------------------------------------------------
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);

  const refreshWishlist = useCallback(
    async (uid: string) => {
      setWishlistLoading(true);
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('show_id')
        .eq('user_id', uid);
      handleError(error, 'Impossible de charger la wishlist.');
      setWishlist((data as { show_id: string }[] | null)?.map((r) => r.show_id) ?? []);
      setWishlistLoading(false);
    },
    [handleError]
  );

  const canWishlist = useCallback(
    (showId: string) => {
      // wishlist_items.show_id is uuid-typed with no matching row for the
      // still-mocked Feed content (lib/mockFeed.ts references old mock show
      // ids) — never attempt to wishlist those, it would just fail server-side.
      if (!isUuid(showId)) return false;
      if (isLogged(showId)) return false;
      const show = getShowById(showId);
      if (show?.status === 'finished') return false;
      return true;
    },
    [isLogged, getShowById]
  );

  const isWishlisted = useCallback(
    (showId: string) => wishlist.includes(showId),
    [wishlist]
  );

  const addToWishlist = useCallback(
    async (showId: string) => {
      if (!currentUserId || !canWishlist(showId) || wishlist.includes(showId)) return;
      setWishlist((prev) => [...prev, showId]);
      const { error } = await supabase
        .from('wishlist_items')
        .upsert(
          { user_id: currentUserId, show_id: showId },
          { onConflict: 'user_id,show_id', ignoreDuplicates: true }
        );
      const msg = handleError(error, "Impossible d'ajouter à la wishlist.");
      if (msg) {
        setWishlist((prev) => prev.filter((id) => id !== showId));
      }
    },
    [currentUserId, canWishlist, wishlist, handleError]
  );

  const removeFromWishlist = useCallback(
    async (showId: string) => {
      if (!currentUserId) return;
      const had = wishlist.includes(showId);
      setWishlist((prev) => prev.filter((id) => id !== showId));
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', currentUserId)
        .eq('show_id', showId);
      const msg = handleError(error, 'Impossible de retirer de la wishlist.');
      if (msg && had) {
        setWishlist((prev) => (prev.includes(showId) ? prev : [...prev, showId]));
      }
    },
    [currentUserId, wishlist, handleError]
  );

  const toggleWishlist = useCallback(
    async (showId: string) => {
      if (wishlist.includes(showId)) await removeFromWishlist(showId);
      else await addToWishlist(showId);
    },
    [wishlist, addToWishlist, removeFromWishlist]
  );

  // ---- Playlists ------------------------------------------------------
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);

  // Favoris is auto-created client-side the first time we see a user with no
  // is_favorites playlist yet, rather than via a DB trigger — simplest given
  // I can't apply a migration to a project I only have the pasted schema for.
  // A trigger on profile creation would be more robust against races across
  // multiple devices; documented here as the deliberate simplification.
  const refreshPlaylists = useCallback(
    async (uid: string) => {
      setPlaylistsLoading(true);
      const { data, error } = await supabase
        .from('playlists')
        .select('id, name, emoji, is_favorites, is_public')
        .eq('user_id', uid)
        .order('created_at', { ascending: true });
      handleError(error, 'Impossible de charger les playlists.');
      let rows = (data as PlaylistRow[] | null) ?? [];

      if (!rows.some((p) => p.is_favorites)) {
        const { data: created, error: createError } = await supabase
          .from('playlists')
          .insert({
            user_id: uid,
            name: 'Favoris',
            emoji: '❤️',
            is_favorites: true,
            is_public: true,
          })
          .select('id, name, emoji, is_favorites, is_public')
          .single();
        handleError(createError, 'Impossible de créer la playlist Favoris.');
        if (created) rows = [created as PlaylistRow, ...rows];
      }

      setPlaylists(rows.map(toPlaylist));

      const ids = rows.map((p) => p.id);
      if (ids.length > 0) {
        const { data: items, error: itemsError } = await supabase
          .from('playlist_items')
          .select('playlist_id, show_id')
          .in('playlist_id', ids);
        handleError(itemsError, 'Impossible de charger le contenu des playlists.');
        setPlaylistItems(
          (items as PlaylistItemRow[] | null)?.map((i) => ({
            playlistId: i.playlist_id,
            showId: i.show_id,
          })) ?? []
        );
      } else {
        setPlaylistItems([]);
      }
      setPlaylistsLoading(false);
    },
    [handleError]
  );

  const orderedPlaylists = useMemo(
    () =>
      [...playlists].sort((a, b) => {
        if (a.isFavorites) return -1;
        if (b.isFavorites) return 1;
        return 0;
      }),
    [playlists]
  );

  const getPlaylistShowIds = useCallback(
    (playlistId: string) =>
      playlistItems.filter((i) => i.playlistId === playlistId).map((i) => i.showId),
    [playlistItems]
  );
  const playlistItemCount = useCallback(
    (playlistId: string) =>
      playlistItems.filter((i) => i.playlistId === playlistId).length,
    [playlistItems]
  );
  const isShowInPlaylist = useCallback(
    (playlistId: string, showId: string) =>
      playlistItems.some((i) => i.playlistId === playlistId && i.showId === showId),
    [playlistItems]
  );

  const createPlaylist = useCallback(
    async (name: string, emoji: string, isPublic: boolean) => {
      if (!currentUserId) return { id: null, error: 'Non connecté.' };
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: currentUserId,
          name: name.trim(),
          emoji,
          is_favorites: false,
          is_public: isPublic,
        })
        .select('id, name, emoji, is_favorites, is_public')
        .single();
      const msg = handleError(error, 'Impossible de créer la playlist.');
      if (msg || !data) return { id: null, error: msg ?? 'Erreur inconnue.' };
      setPlaylists((prev) => [...prev, toPlaylist(data as PlaylistRow)]);
      return { id: data.id, error: null };
    },
    [currentUserId, handleError]
  );

  const renamePlaylist = useCallback(
    async (playlistId: string, name: string) => {
      const trimmed = name.trim();
      const { error } = await supabase
        .from('playlists')
        .update({ name: trimmed })
        .eq('id', playlistId)
        .eq('is_favorites', false); // defense-in-depth: Favoris name is fixed
      const msg = handleError(error, 'Impossible de renommer la playlist.');
      if (!msg) {
        setPlaylists((prev) =>
          prev.map((p) => (p.id === playlistId ? { ...p, name: trimmed } : p))
        );
      }
      return { error: msg };
    },
    [handleError]
  );

  const setPlaylistVisibility = useCallback(
    async (playlistId: string, isPublic: boolean) => {
      const { error } = await supabase
        .from('playlists')
        .update({ is_public: isPublic })
        .eq('id', playlistId);
      const msg = handleError(error, 'Impossible de changer la visibilité.');
      if (!msg) {
        setPlaylists((prev) =>
          prev.map((p) => (p.id === playlistId ? { ...p, isPublic } : p))
        );
      }
      return { error: msg };
    },
    [handleError]
  );

  const deletePlaylist = useCallback(
    async (playlistId: string) => {
      // `on delete cascade` on playlist_items.playlist_id handles item cleanup.
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)
        .eq('is_favorites', false); // Favoris is non-deletable
      const msg = handleError(error, 'Impossible de supprimer la playlist.');
      if (!msg) {
        setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
        setPlaylistItems((prev) => prev.filter((i) => i.playlistId !== playlistId));
      }
      return { error: msg };
    },
    [handleError]
  );

  const addShowToPlaylist = useCallback(
    async (playlistId: string, showId: string) => {
      if (playlistItems.some((i) => i.playlistId === playlistId && i.showId === showId))
        return;
      setPlaylistItems((prev) => [...prev, { playlistId, showId }]);
      const { error } = await supabase
        .from('playlist_items')
        .upsert(
          { playlist_id: playlistId, show_id: showId },
          { onConflict: 'playlist_id,show_id', ignoreDuplicates: true }
        );
      const msg = handleError(error, "Impossible d'ajouter à la playlist.");
      if (msg) {
        setPlaylistItems((prev) =>
          prev.filter((i) => !(i.playlistId === playlistId && i.showId === showId))
        );
      }
    },
    [playlistItems, handleError]
  );

  const removeShowFromPlaylist = useCallback(
    async (playlistId: string, showId: string) => {
      setPlaylistItems((prev) =>
        prev.filter((i) => !(i.playlistId === playlistId && i.showId === showId))
      );
      const { error } = await supabase
        .from('playlist_items')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('show_id', showId);
      const msg = handleError(error, 'Impossible de retirer de la playlist.');
      if (msg) {
        setPlaylistItems((prev) =>
          prev.some((i) => i.playlistId === playlistId && i.showId === showId)
            ? prev
            : [...prev, { playlistId, showId }]
        );
      }
    },
    [handleError]
  );

  // ---- Logs actions (after playlists, since removeLog cleans playlist_items) --
  const addOrUpdateLog = useCallback(
    async (showId: string, rating: number, review?: string) => {
      if (!currentUserId) return { error: 'Non connecté.' };
      const trimmed = review?.trim() ? review.trim() : null;
      const { data, error } = await supabase
        .from('logs')
        .upsert(
          { user_id: currentUserId, show_id: showId, rating, review: trimmed },
          { onConflict: 'user_id,show_id' }
        )
        .select('id, show_id, rating, review, created_at')
        .single();
      const msg = handleError(error, "Impossible d'enregistrer ta note.");
      if (msg || !data) return { error: msg ?? 'Erreur inconnue.' };

      const newLog = toLog(data as LogRow);
      setLogs((prev) => {
        const exists = prev.some((l) => l.showId === showId);
        return exists
          ? prev.map((l) => (l.showId === showId ? newLog : l))
          : [newLog, ...prev];
      });
      // Logging a wishlisted show auto-removes it from the wishlist (E07).
      await removeFromWishlist(showId);
      await refreshCommunityRatings();
      return { error: null };
    },
    [currentUserId, handleError, removeFromWishlist, refreshCommunityRatings]
  );

  const removeLog = useCallback(
    async (showId: string) => {
      if (!currentUserId) return { error: 'Non connecté.' };
      const { error } = await supabase
        .from('logs')
        .delete()
        .eq('user_id', currentUserId)
        .eq('show_id', showId);
      const msg = handleError(error, "Impossible de supprimer ton avis.");
      if (msg) return { error: msg };

      setLogs((prev) => prev.filter((l) => l.showId !== showId));
      // Playlists only hold logged shows (app rule, not DB-enforced) — drop
      // this show from every one of the user's playlists too.
      const myPlaylistIds = playlists.map((p) => p.id);
      if (myPlaylistIds.length > 0) {
        await supabase
          .from('playlist_items')
          .delete()
          .eq('show_id', showId)
          .in('playlist_id', myPlaylistIds);
      }
      setPlaylistItems((prev) => prev.filter((i) => i.showId !== showId));
      await refreshCommunityRatings();
      return { error: null };
    },
    [currentUserId, handleError, playlists, refreshCommunityRatings]
  );

  const myStats = useMemo<MyStats>(() => {
    const showsSeen = logs.length;
    const averageRating =
      showsSeen === 0 ? 0 : logs.reduce((sum, l) => sum + l.rating, 0) / showsSeen;
    const genreCounts = new Map<string, number>();
    for (const l of logs) {
      const g = getShowById(l.showId)?.genre;
      if (g) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    }
    let topGenre = '—';
    let max = 0;
    for (const [g, c] of genreCounts) {
      if (c > max) {
        max = c;
        topGenre = g;
      }
    }
    return { showsSeen, averageRating, topGenre };
  }, [logs, getShowById]);

  const getShowStats = useCallback(
    (showId: string) => {
      const ratings = communityRatings
        .filter((r) => r.show_id === showId && !blockedUsers.includes(r.user_id))
        .map((r) => r.rating);
      const logCount = ratings.length;
      const rating =
        logCount === 0
          ? 0
          : Math.round((ratings.reduce((s, r) => s + r, 0) / logCount) * 10) / 10;
      return { rating, logCount };
    },
    [communityRatings, blockedUsers]
  );

  // ---- Follow -----------------------------------------------------------
  const [followStatus, setFollowStatus] = useState<Record<string, FollowStatus>>({});
  const [localFollowStatus, setLocalFollowStatus] =
    useState<Record<string, FollowStatus>>(INITIAL_LOCAL_FOLLOW);
  const [followsLoading, setFollowsLoading] = useState(true);

  const refreshFollows = useCallback(
    async (uid: string) => {
      setFollowsLoading(true);
      const { data, error } = await supabase
        .from('follows')
        .select('followed_id, status')
        .eq('follower_id', uid);
      handleError(error, 'Impossible de charger les abonnements.');
      const map: Record<string, FollowStatus> = {};
      for (const row of (data as FollowRow[] | null) ?? []) {
        map[row.followed_id] = row.status;
      }
      setFollowStatus(map);
      setFollowsLoading(false);
    },
    [handleError]
  );

  const getFollowStatus = useCallback(
    (userId: string): FollowStatus =>
      isUuid(userId) ? followStatus[userId] ?? 'none' : localFollowStatus[userId] ?? 'none',
    [followStatus, localFollowStatus]
  );
  const isFollowing = useCallback(
    (userId: string) => getFollowStatus(userId) === 'approved',
    [getFollowStatus]
  );
  const following = useMemo(
    () => [
      ...Object.entries(followStatus).filter(([, s]) => s === 'approved').map(([id]) => id),
      ...Object.entries(localFollowStatus).filter(([, s]) => s === 'approved').map(([id]) => id),
    ],
    [followStatus, localFollowStatus]
  );

  // Best-effort notification insert for a real (uuid) target — never blocks
  // or surfaces errors to the caller, since it's a side effect of another
  // action that already succeeded.
  const notifyUser = useCallback(
    async (
      targetUserId: string,
      type: NotificationType,
      refId: string | null
    ) => {
      if (!currentUserId || !isUuid(targetUserId) || targetUserId === currentUserId) return;
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        type,
        ref_id: refId,
        actor_id: currentUserId,
      });
    },
    [currentUserId]
  );

  const followUser = useCallback(
    async (userId: string) => {
      if (!currentUserId) return;
      if (!isUuid(userId)) {
        // Mock target — no real profiles row to attach a follow row to.
        setLocalFollowStatus((prev) => ({ ...prev, [userId]: 'approved' }));
        return;
      }
      setFollowStatus((prev) => ({ ...prev, [userId]: 'approved' }));
      const { error } = await supabase
        .from('follows')
        .upsert(
          { follower_id: currentUserId, followed_id: userId, status: 'approved' },
          { onConflict: 'follower_id,followed_id' }
        );
      const msg = handleError(error, 'Impossible de suivre ce profil.');
      if (msg) {
        setFollowStatus((prev) => ({ ...prev, [userId]: 'none' }));
        return;
      }
      await notifyUser(userId, 'new_follower', null);
    },
    [currentUserId, handleError, notifyUser]
  );

  const requestFollow = useCallback(
    async (userId: string) => {
      if (!currentUserId) return;
      if (!isUuid(userId)) {
        setLocalFollowStatus((prev) => ({ ...prev, [userId]: 'pending' }));
        return;
      }
      setFollowStatus((prev) => ({ ...prev, [userId]: 'pending' }));
      const { error } = await supabase
        .from('follows')
        .upsert(
          { follower_id: currentUserId, followed_id: userId, status: 'pending' },
          { onConflict: 'follower_id,followed_id' }
        );
      const msg = handleError(error, 'Impossible d’envoyer la demande.');
      if (msg) {
        setFollowStatus((prev) => ({ ...prev, [userId]: 'none' }));
        return;
      }
      await notifyUser(userId, 'follow_request', null);
    },
    [currentUserId, handleError, notifyUser]
  );

  const unfollowUser = useCallback(
    async (userId: string) => {
      if (!currentUserId) return;
      if (!isUuid(userId)) {
        setLocalFollowStatus((prev) => ({ ...prev, [userId]: 'none' }));
        return;
      }
      const prevStatus = followStatus[userId];
      setFollowStatus((prev) => ({ ...prev, [userId]: 'none' }));
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('followed_id', userId);
      const msg = handleError(error, 'Impossible de se désabonner.');
      if (msg && prevStatus) {
        setFollowStatus((prev) => ({ ...prev, [userId]: prevStatus }));
      }
    },
    [currentUserId, followStatus, handleError]
  );

  const toggleFollow = useCallback(
    async (userId: string) => {
      if (getFollowStatus(userId) === 'approved') await unfollowUser(userId);
      else await followUser(userId);
    },
    [getFollowStatus, unfollowUser, followUser]
  );

  // ---- Notifications ------------------------------------------------------
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const refreshNotifications = useCallback(
    async (uid: string) => {
      setNotificationsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, ref_id, actor_id, read_at, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      handleError(error, 'Impossible de charger les notifications.');
      const rows = (data as NotificationRow[] | null) ?? [];

      const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((id): id is string => !!id))];
      const actorNames: Record<string, string> = {};
      if (actorIds.length > 0) {
        const { data: actors } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', actorIds);
        for (const a of (actors as { id: string; username: string }[] | null) ?? []) {
          actorNames[a.id] = a.username;
        }
      }

      const items: NotificationItem[] = rows.map((row) => {
        const actorUsername = row.actor_id ? actorNames[row.actor_id] ?? null : null;
        const isFollowType = row.type === 'follow_request' || row.type === 'new_follower';
        const target: NotificationItem['target'] = isFollowType && row.actor_id
          ? { screen: 'Profile', userId: row.actor_id, username: actorUsername ?? '' }
          : { screen: 'ShowDetail', showId: row.ref_id ?? '' };
        return {
          id: row.id,
          type: row.type,
          actorId: row.actor_id,
          actorUsername,
          target,
          text: NOTIF_TEXT[row.type],
          date: formatDateFr(new Date(row.created_at)),
          read: row.read_at != null,
        };
      });
      setNotifications(items);
      setNotificationsLoading(false);
    },
    [handleError]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);
    },
    []
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (!currentUserId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', currentUserId)
      .is('read_at', null);
  }, [currentUserId]);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  }, []);

  // ---- Notification settings (still local-only) ----------------------------
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({ push: true, social: true, editorial: false });
  const setNotificationSetting = useCallback(
    (key: keyof NotificationSettings, value: boolean) => {
      setNotificationSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ---- User preferences (local-only) --------------------------------------
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const setPreference = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ---- Profile-completion prompt dismiss (session-local) ------------------
  const [profileCompletionDismissed, setProfileCompletionDismissed] =
    useState(false);
  const dismissProfileCompletion = useCallback(
    () => setProfileCompletionDismissed(true),
    []
  );

  // ---- Applause (still local-only — no applause table in the schema) -------
  const [applauded, setApplauded] = useState<string[]>([]);
  const getApplause = useCallback(
    (reviewId: string, base: number) => base + (applauded.includes(reviewId) ? 1 : 0),
    [applauded]
  );
  const hasApplauded = useCallback(
    (reviewId: string) => applauded.includes(reviewId),
    [applauded]
  );
  // reviewOwnerId/showId are optional so existing call sites (mock reviews,
  // always non-uuid owners) keep working without changes; when both are given
  // and the owner is a real user, a real `applause` notification is fired.
  const toggleApplause = useCallback(
    (reviewId: string, reviewOwnerId?: string, showId?: string) => {
      // Side effect kept out of the setState updater (which React/StrictMode
      // may invoke more than once) — read current membership directly.
      const applauding = !applauded.includes(reviewId);
      if (applauding && reviewOwnerId && showId) {
        notifyUser(reviewOwnerId, 'applause', showId);
      }
      setApplauded((prev) =>
        applauding ? [...prev, reviewId] : prev.filter((id) => id !== reviewId)
      );
    },
    [applauded, notifyUser]
  );

  // ---- Moderation -----------------------------------------------------
  // `blocks`/`localBlockedMockIds`/`blockedUsers` are declared earlier (right
  // after the show catalogue section) since getShowStats needs `blockedUsers`
  // to exclude blocked users' ratings from the community average.
  const [reports, setReports] = useState<Report[]>([]);

  const refreshBlocks = useCallback(
    async (uid: string) => {
      const { data, error } = await supabase
        .from('blocks')
        .select('blocked_user_id')
        .eq('user_id', uid);
      handleError(error, 'Impossible de charger les utilisateurs bloqués.');
      setBlocks(
        (data as BlockRow[] | null)?.map((r) => ({
          userId: uid,
          blockedUserId: r.blocked_user_id,
        })) ?? []
      );
    },
    [handleError]
  );

  const isBlocked = useCallback(
    (userId: string) => blockedUsers.includes(userId),
    [blockedUsers]
  );

  const blockUser = useCallback(
    async (userId: string) => {
      if (!currentUserId) return;
      if (!isUuid(userId)) {
        setLocalBlockedMockIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
        return;
      }
      setBlocks((prev) =>
        prev.some((b) => b.blockedUserId === userId)
          ? prev
          : [...prev, { userId: currentUserId, blockedUserId: userId }]
      );
      const { error } = await supabase
        .from('blocks')
        .upsert(
          { user_id: currentUserId, blocked_user_id: userId },
          { onConflict: 'user_id,blocked_user_id', ignoreDuplicates: true }
        );
      const msg = handleError(error, "Impossible de bloquer l'utilisateur.");
      if (msg) {
        setBlocks((prev) => prev.filter((b) => b.blockedUserId !== userId));
      }
    },
    [currentUserId, handleError]
  );

  const unblockUser = useCallback(
    async (userId: string) => {
      if (!currentUserId) return;
      if (!isUuid(userId)) {
        setLocalBlockedMockIds((prev) => prev.filter((id) => id !== userId));
        return;
      }
      setBlocks((prev) => prev.filter((b) => b.blockedUserId !== userId));
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('user_id', currentUserId)
        .eq('blocked_user_id', userId);
      handleError(error, 'Impossible de débloquer.');
    },
    [currentUserId, handleError]
  );

  // Reports have no read-back UI (nothing renders `isReported`'s result yet),
  // so this is a session-local append-only log; real (uuid) targets are also
  // persisted server-side. Mock targets (e.g. mock review ids like "r1") are
  // NOT valid uuids and can't be inserted into the uuid-typed target_id
  // column — kept local-only, same gap pattern as follows/blocks above.
  const isReported = useCallback(
    (targetType: ReportTargetType, targetId: string) =>
      reports.some((r) => r.targetType === targetType && r.targetId === targetId),
    [reports]
  );

  const reportContent = useCallback(
    async (targetType: ReportTargetType, targetId: string, reason: string) => {
      if (!currentUserId || isReported(targetType, targetId)) return;
      setReports((prev) => [
        ...prev,
        {
          id: `rep-${Date.now()}`,
          reporterId: currentUserId,
          targetType,
          targetId,
          reason,
          status: 'open',
        },
      ]);
      if (isUuid(targetId)) {
        await supabase.from('reports').insert({
          reporter_id: currentUserId,
          target_type: targetType,
          target_id: targetId,
          reason,
          status: 'open',
        });
      }
    },
    [currentUserId, isReported]
  );

  // ---- Initial load, gated on the session resolving to a real user --------
  useEffect(() => {
    if (!currentUserId) return;
    refreshMyProfile(currentUserId);
    refreshShows();
    refreshCommunityRatings();
    refreshLogs(currentUserId);
    refreshWishlist(currentUserId);
    refreshPlaylists(currentUserId);
    refreshFollows(currentUserId);
    refreshNotifications(currentUserId);
    refreshBlocks(currentUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const value = useMemo<AppState>(
    () => ({
      currentUserId,
      sessionLoading,
      sessionExpired,
      myProfile,
      myProfileLoading,
      followerCount,
      followingCount,
      updateMyProfile,
      shows,
      showsLoading,
      showsError,
      getShowById,
      refreshShows,
      getShowStats,
      wishlist,
      wishlistLoading,
      isWishlisted,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      canWishlist,
      logs,
      logsLoading,
      getLogForShow,
      isLogged,
      addOrUpdateLog,
      removeLog,
      myStats,
      playlists: orderedPlaylists,
      playlistItems,
      playlistsLoading,
      getPlaylistShowIds,
      playlistItemCount,
      isShowInPlaylist,
      createPlaylist,
      renamePlaylist,
      setPlaylistVisibility,
      deletePlaylist,
      addShowToPlaylist,
      removeShowFromPlaylist,
      following,
      followsLoading,
      isFollowing,
      getFollowStatus,
      followUser,
      requestFollow,
      unfollowUser,
      toggleFollow,
      notifications,
      notificationsLoading,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      notificationSettings,
      setNotificationSetting,
      preferences,
      setPreference,
      profileCompletionDismissed,
      dismissProfileCompletion,
      getApplause,
      hasApplauded,
      toggleApplause,
      blockedUsers,
      isBlocked,
      blockUser,
      unblockUser,
      reports,
      isReported,
      reportContent,
    }),
    [
      currentUserId,
      sessionLoading,
      sessionExpired,
      myProfile,
      myProfileLoading,
      followerCount,
      followingCount,
      updateMyProfile,
      shows,
      showsLoading,
      showsError,
      getShowById,
      refreshShows,
      getShowStats,
      wishlist,
      wishlistLoading,
      isWishlisted,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      canWishlist,
      logs,
      logsLoading,
      getLogForShow,
      isLogged,
      addOrUpdateLog,
      removeLog,
      myStats,
      orderedPlaylists,
      playlistItems,
      playlistsLoading,
      getPlaylistShowIds,
      playlistItemCount,
      isShowInPlaylist,
      createPlaylist,
      renamePlaylist,
      setPlaylistVisibility,
      deletePlaylist,
      addShowToPlaylist,
      removeShowFromPlaylist,
      following,
      followsLoading,
      isFollowing,
      getFollowStatus,
      followUser,
      requestFollow,
      unfollowUser,
      toggleFollow,
      notifications,
      notificationsLoading,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      notificationSettings,
      setNotificationSetting,
      preferences,
      setPreference,
      profileCompletionDismissed,
      dismissProfileCompletion,
      getApplause,
      hasApplauded,
      toggleApplause,
      blockedUsers,
      isBlocked,
      blockUser,
      unblockUser,
      reports,
      isReported,
      reportContent,
    ]
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return ctx;
}

// Base applause counts per mocked review — applause has no backing table
// (see the module doc comment), kept exactly as before.
export const BASE_APPLAUSE: Record<string, number> = {
  r1: 12,
  r2: 5,
  r3: 20,
  r4: 8,
};

export { MOCK_REVIEWS } from '../lib/mockShows';
