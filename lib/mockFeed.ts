// Mocked feed data for E02. Hardcoded sample content that matches the card
// shapes in specs/02-screens.md. Still mock (no real multi-user activity is
// seeded yet), but the `show` ids now reference real catalogue rows via
// DEMO_SHOW_IDS — so once scripts/seed-catalogue.sql has been run, tapping a
// card opens a real ShowDetail instead of "Spectacle introuvable".

import { DEMO_SHOW_IDS } from './demoCatalogueIds';

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
  // communityRating removed — computed via AppStateContext.getShowStats.
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
    show: { id: DEMO_SHOW_IDS.malade, title: 'Le Malade imaginaire' },
    action: 'log',
    rating: 4.5,
    reviewSnippet:
      'Une mise en scène pleine d’énergie, le public riait aux éclats du début à la fin.',
    date: 'il y a 2 j',
  },
  {
    kind: 'discovery',
    id: 'd1',
    show: { id: DEMO_SHOW_IDS.cyrano, title: 'Cyrano de Bergerac' },
    venue: 'Théâtre de la Porte Saint-Martin',
  },
  {
    kind: 'editorial',
    id: 'e1',
    blurb:
      'Notre coup de cœur de la semaine : une relecture audacieuse d’un classique, à ne pas manquer avant la fin de la tournée.',
    show: { id: DEMO_SHOW_IDS.godot, title: 'En attendant Godot' },
  },
  {
    kind: 'community',
    id: 'c2',
    user: { id: 'u2', username: 'theo.m', avatarUrl: null },
    show: { id: DEMO_SHOW_IDS.cantatrice, title: 'La Cantatrice chauve' },
    action: 'favorite',
    date: 'il y a 3 j',
  },
  {
    kind: 'discovery',
    id: 'd2',
    show: { id: DEMO_SHOW_IDS.romeo, title: 'Roméo et Juliette' },
    venue: 'Comédie-Française',
  },
  {
    kind: 'community',
    id: 'c3',
    user: { id: 'u3', username: 'sofia', avatarUrl: null },
    show: { id: DEMO_SHOW_IDS.huisClos, title: 'Huis clos' },
    action: 'log',
    rating: 3.5,
    reviewSnippet: null,
    date: 'il y a 5 j',
  },
];
