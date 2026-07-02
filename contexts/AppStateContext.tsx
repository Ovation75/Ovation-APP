import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { MOCK_WISHLIST } from '../lib/mockCarnet';
import { MOCK_USERS } from '../lib/mockUsers';

// Shared, app-wide interactive state that several screens read/write the same
// underlying data for. Previously each screen kept its own local copy, so a
// change in one screen (e.g. removing a show from the Wishlist in Mon Carnet)
// never propagated to the Feed or the Fiche Spectacle. Everything is still
// mocked — no Supabase — but now there is a single source of truth in memory.
type AppState = {
  // ---- Wishlist: show ids the current user has added ----
  wishlist: string[];
  isWishlisted: (showId: string) => boolean;
  addToWishlist: (showId: string) => void;
  removeFromWishlist: (showId: string) => void;
  toggleWishlist: (showId: string) => void;

  // ---- Follow: user ids the current user follows ----
  following: string[];
  isFollowing: (userId: string) => boolean;
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  toggleFollow: (userId: string) => void;
};

const AppStateContext = createContext<AppState | null>(null);

// Seed from the existing mock data so the initial UI is unchanged.
const INITIAL_WISHLIST = MOCK_WISHLIST.map((w) => w.showId);
const INITIAL_FOLLOWING = MOCK_USERS.filter((u) => u.isFollowing).map((u) => u.id);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>(INITIAL_WISHLIST);
  const [following, setFollowing] = useState<string[]>(INITIAL_FOLLOWING);

  const addToWishlist = useCallback((showId: string) => {
    setWishlist((prev) => (prev.includes(showId) ? prev : [...prev, showId]));
  }, []);

  const removeFromWishlist = useCallback((showId: string) => {
    setWishlist((prev) => prev.filter((id) => id !== showId));
  }, []);

  const toggleWishlist = useCallback((showId: string) => {
    setWishlist((prev) =>
      prev.includes(showId)
        ? prev.filter((id) => id !== showId)
        : [...prev, showId]
    );
  }, []);

  const isWishlisted = useCallback(
    (showId: string) => wishlist.includes(showId),
    [wishlist]
  );

  const followUser = useCallback((userId: string) => {
    setFollowing((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
  }, []);

  const unfollowUser = useCallback((userId: string) => {
    setFollowing((prev) => prev.filter((id) => id !== userId));
  }, []);

  const toggleFollow = useCallback((userId: string) => {
    setFollowing((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const isFollowing = useCallback(
    (userId: string) => following.includes(userId),
    [following]
  );

  const value = useMemo<AppState>(
    () => ({
      wishlist,
      isWishlisted,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      following,
      isFollowing,
      followUser,
      unfollowUser,
      toggleFollow,
    }),
    [
      wishlist,
      isWishlisted,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      following,
      isFollowing,
      followUser,
      unfollowUser,
      toggleFollow,
    ]
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return ctx;
}
