// Mocked feed data for E02. Hardcoded sample content that matches the card
// shapes in specs/02-screens.md. Nothing here is wired to Supabase yet —
// see the Feed screen notes for what needs to be replaced with real queries.

export type FeedUser = {
  id: string;
  username: string;
  avatarUrl: string | null; // null -> render an initials placeholder
};

export type FeedShow = {
  id: string;
  title: string;
};

// Card 1 — a follower's activity: either a log (rating + optional review)
// or a lighter "added to Favorites" action.
export type CommunityActivityItem = {
  kind: 'community';
  id: string;
  user: FeedUser;
  show: FeedShow;
  date: string; // pre-formatted for now (e.g. "il y a 2 j")
} & (
  | {
      action: 'log';
      rating: number; // 0–5, 0.5 increments (see business rules)
      reviewSnippet: string | null;
    }
  | {
      action: 'favorite';
    }
);

// Card 2 — show discovery: a show surfaced to the user with a wishlist CTA.
export type ShowDiscoveryItem = {
  kind: 'discovery';
  id: string;
  show: FeedShow;
  venue: string;
  communityRating: number; // 0–5
};

// Card 3 — editorial: an Ovation-written blurb linking to a show.
export type EditorialItem = {
  kind: 'editorial';
  id: string;
  blurb: string;
  show: FeedShow;
};

export type FeedItem =
  | CommunityActivityItem
  | ShowDiscoveryItem
  | EditorialItem;

// Fixed mixed order — no ranking algorithm yet, just a representative layout.
export const MOCK_FEED: FeedItem[] = [
  {
    kind: 'community',
    id: 'c1',
    user: { id: 'u1', username: 'camille_p', avatarUrl: null },
    show: { id: 's1', title: 'Le Malade imaginaire' },
    action: 'log',
    rating: 4.5,
    reviewSnippet:
      'Une mise en scène pleine d’énergie, le public riait aux éclats du début à la fin.',
    date: 'il y a 2 j',
  },
  {
    kind: 'discovery',
    id: 'd1',
    show: { id: 's2', title: 'Cyrano de Bergerac' },
    venue: 'Théâtre de la Porte Saint-Martin',
    communityRating: 4.2,
  },
  {
    kind: 'editorial',
    id: 'e1',
    blurb:
      'Notre coup de cœur de la semaine : une relecture audacieuse d’un classique, à ne pas manquer avant la fin de la tournée.',
    show: { id: 's3', title: 'En attendant Godot' },
  },
  {
    kind: 'community',
    id: 'c2',
    user: { id: 'u2', username: 'theo.m', avatarUrl: null },
    show: { id: 's4', title: 'La Cantatrice chauve' },
    action: 'favorite',
    date: 'il y a 3 j',
  },
  {
    kind: 'discovery',
    id: 'd2',
    show: { id: 's5', title: 'Roméo et Juliette' },
    venue: 'Comédie-Française',
    communityRating: 4.7,
  },
  {
    kind: 'community',
    id: 'c3',
    user: { id: 'u3', username: 'sofia', avatarUrl: null },
    show: { id: 's6', title: 'Huis clos' },
    action: 'log',
    rating: 3.5,
    reviewSnippet: null,
    date: 'il y a 5 j',
  },
];
