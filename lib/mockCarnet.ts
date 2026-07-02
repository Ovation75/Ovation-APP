// Mocked "Mon Carnet" data: Journal logs, Playlists, Wishlist.
// Shared with the Profil screen (journal / favoris / public playlists).

export type LogEntry = {
  id: string;
  showId: string;
  showTitle: string;
  rating: number; // 0–5, 0.5 increments
  date: string; // pre-formatted (e.g. "12 juin 2026")
  sortKey: number; // higher = more recent, used for ordering
};

export type Playlist = {
  id: string;
  name: string;
  emoji: string;
  itemCount: number;
  isFavorites: boolean; // Favoris: default, not deletable
  isPublic: boolean;
};

export type WishlistItem = {
  id: string;
  showId: string;
  title: string;
  venue: string;
};

// Journal — most recent first is handled by the screen via sortKey.
export const MOCK_JOURNAL: LogEntry[] = [
  {
    id: 'l1',
    showId: 's5',
    showTitle: 'Roméo et Juliette',
    rating: 4.5,
    date: '24 juin 2026',
    sortKey: 5,
  },
  {
    id: 'l2',
    showId: 's1',
    showTitle: 'Le Malade imaginaire',
    rating: 4,
    date: '12 juin 2026',
    sortKey: 4,
  },
  {
    id: 'l3',
    showId: 's8',
    showTitle: 'Le Dîner de cons',
    rating: 3.5,
    date: '2 juin 2026',
    sortKey: 3,
  },
  {
    id: 'l4',
    showId: 's7',
    showTitle: 'Un stand-up presque parfait',
    rating: 4,
    date: '20 mai 2026',
    sortKey: 2,
  },
];

export const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: 'p-fav',
    name: 'Favoris',
    emoji: '❤️',
    itemCount: 6,
    isFavorites: true,
    isPublic: true,
  },
  {
    id: 'p1',
    name: 'À revoir',
    emoji: '🔁',
    itemCount: 4,
    isFavorites: false,
    isPublic: true,
  },
  {
    id: 'p2',
    name: 'Classiques incontournables',
    emoji: '🎭',
    itemCount: 8,
    isFavorites: false,
    isPublic: true,
  },
  {
    id: 'p3',
    name: 'Soirées entre amis',
    emoji: '🍷',
    itemCount: 3,
    isFavorites: false,
    isPublic: false,
  },
];

export const MOCK_WISHLIST: WishlistItem[] = [
  { id: 'w1', showId: 's2', title: 'Cyrano de Bergerac', venue: 'Porte Saint-Martin' },
  { id: 'w2', showId: 's4', title: 'La Cantatrice chauve', venue: 'Théâtre de la Huchette' },
  { id: 'w3', showId: 's6', title: 'Huis clos', venue: 'Poche-Montparnasse' },
];
