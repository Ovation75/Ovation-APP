// Mocked user profiles for E09 Profil Utilisateur.
// Includes the current user ("me"), another public user, and a private user
// so all profile variants can be previewed.

export type ProfileStats = {
  showsSeen: number;
  averageRating: number; // 0–5
  topGenre: string;
};

export type ProfileList = {
  journal: { id: string; showId: string; title: string; rating: number; date: string }[];
  favoris: { id: string; showId: string; title: string }[];
  publicPlaylists: { id: string; name: string; itemCount: number }[];
};

export type UserProfile = {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  isMe: boolean;
  followers: number;
  following: number;
  isFollowing: boolean; // whether "me" follows this user (for the Suivre button)
  stats: ProfileStats; // only shown to self
  content: ProfileList;
};

const ME: UserProfile = {
  id: 'me',
  username: 'malo',
  bio: 'Amoureux du théâtre et des salles obscures. Toujours à la recherche de la prochaine pépite parisienne.',
  avatarUrl: null,
  isPublic: true,
  isMe: true,
  followers: 42,
  following: 88,
  isFollowing: false,
  stats: {
    showsSeen: 37,
    averageRating: 4.1,
    topGenre: 'Théâtre classique',
  },
  content: {
    journal: [
      { id: 'l1', showId: 's5', title: 'Roméo et Juliette', rating: 4.5, date: '24 juin 2026' },
      { id: 'l2', showId: 's1', title: 'Le Malade imaginaire', rating: 4, date: '12 juin 2026' },
      { id: 'l3', showId: 's8', title: 'Le Dîner de cons', rating: 3.5, date: '2 juin 2026' },
    ],
    favoris: [
      { id: 'f1', showId: 's5', title: 'Roméo et Juliette' },
      { id: 'f2', showId: 's1', title: 'Le Malade imaginaire' },
    ],
    publicPlaylists: [
      { id: 'p1', name: 'À revoir', itemCount: 4 },
      { id: 'p2', name: 'Classiques incontournables', itemCount: 8 },
    ],
  },
};

const CAMILLE: UserProfile = {
  id: 'u1',
  username: 'camille_p',
  bio: 'Critique amateur. Le rire est une chose sérieuse.',
  avatarUrl: null,
  isPublic: true,
  isMe: false,
  followers: 310,
  following: 154,
  isFollowing: true,
  stats: {
    showsSeen: 120,
    averageRating: 3.9,
    topGenre: 'Comédie',
  },
  content: {
    journal: [
      { id: 'cl1', showId: 's1', title: 'Le Malade imaginaire', rating: 4.5, date: '20 juin 2026' },
      { id: 'cl2', showId: 's8', title: 'Le Dîner de cons', rating: 4, date: '8 juin 2026' },
    ],
    favoris: [{ id: 'cf1', showId: 's8', title: 'Le Dîner de cons' }],
    publicPlaylists: [{ id: 'cp1', name: 'Comédies cultes', itemCount: 12 }],
  },
};

// Private profile: blocks 2/3 are hidden unless you're an approved follower.
const THEO: UserProfile = {
  id: 'u2',
  username: 'theo.m',
  bio: 'Profil privé.',
  avatarUrl: null,
  isPublic: false,
  isMe: false,
  followers: 27,
  following: 63,
  isFollowing: false,
  stats: {
    showsSeen: 0,
    averageRating: 0,
    topGenre: '—',
  },
  content: {
    journal: [],
    favoris: [],
    publicPlaylists: [],
  },
};

const SOFIA: UserProfile = {
  id: 'u3',
  username: 'sofia',
  bio: 'Théâtre, danse, performance. Je note tout ce que je vois.',
  avatarUrl: null,
  isPublic: true,
  isMe: false,
  followers: 64,
  following: 40,
  isFollowing: false,
  stats: {
    showsSeen: 58,
    averageRating: 4.0,
    topGenre: 'Contemporain',
  },
  content: {
    journal: [
      { id: 'sl1', showId: 's6', title: 'Huis clos', rating: 3.5, date: '18 juin 2026' },
    ],
    favoris: [{ id: 'sf1', showId: 's6', title: 'Huis clos' }],
    publicPlaylists: [{ id: 'sp1', name: 'Scènes contemporaines', itemCount: 5 }],
  },
};

export const MOCK_USERS: UserProfile[] = [ME, CAMILLE, THEO, SOFIA];

export const MY_USER_ID = ME.id;

export function getUserById(id: string): UserProfile | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}
