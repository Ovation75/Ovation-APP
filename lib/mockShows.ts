// Mocked show catalogue, shared across Feed, Découverte, Recherche, Carnet,
// Fiche Spectacle and Profil. Nothing here is wired to Supabase yet.

export type ShowStatus = 'now' | 'touring' | 'finished';

export const SHOW_STATUS_LABEL: Record<ShowStatus, string> = {
  now: 'En ce moment à Paris',
  touring: 'En tournée',
  finished: 'Terminé',
};

export type ShowGenre =
  | 'Théâtre classique'
  | 'Contemporain'
  | 'Comédie'
  | 'Stand-up';

export type Show = {
  id: string;
  title: string;
  genre: ShowGenre;
  company: string; // artist / troupe
  venues: string[]; // may play several venues
  synopsis: string;
  communityRating: number; // 0–5, 0.5 increments
  logCount: number;
  status: ShowStatus;
  seen: boolean; // whether the current (mock) user has logged it -> "Déjà vu"
};

export const MOCK_SHOWS: Show[] = [
  {
    id: 's1',
    title: 'Le Malade imaginaire',
    genre: 'Théâtre classique',
    company: 'Compagnie du Grand Siècle',
    venues: ['Théâtre du Palais-Royal'],
    synopsis:
      "Argan, obsédé par sa santé, se croit accablé de mille maux. Entouré de médecins peu scrupuleux et d'une servante à l'esprit vif, il veut marier sa fille à un médecin. Une comédie-ballet où Molière rit de la médecine de son temps et de nos propres peurs.",
    communityRating: 4.5,
    logCount: 128,
    status: 'now',
    seen: true,
  },
  {
    id: 's2',
    title: 'Cyrano de Bergerac',
    genre: 'Théâtre classique',
    company: 'Théâtre en Seine',
    venues: ['Théâtre de la Porte Saint-Martin', 'Espace Cardin'],
    synopsis:
      "Poète au panache flamboyant et au nez proéminent, Cyrano aime en secret la belle Roxane. Il prête sa plume et son esprit au fade Christian pour la séduire. Un chef-d'œuvre de tirades et d'émotion, entre bravoure et renoncement.",
    communityRating: 4.2,
    logCount: 96,
    status: 'touring',
    seen: false,
  },
  {
    id: 's3',
    title: 'En attendant Godot',
    genre: 'Contemporain',
    company: 'Collectif Absurde',
    venues: ['Théâtre de la Bastille'],
    synopsis:
      "Sur une route déserte, Vladimir et Estragon attendent un certain Godot qui ne vient jamais. Entre jeux de langage et silences, Beckett signe une méditation drôle et vertigineuse sur l'attente et le sens de l'existence.",
    communityRating: 3.9,
    logCount: 54,
    status: 'finished',
    seen: false,
  },
  {
    id: 's4',
    title: 'La Cantatrice chauve',
    genre: 'Contemporain',
    company: 'Théâtre de la Huchette',
    venues: ['Théâtre de la Huchette'],
    synopsis:
      "Deux couples anglais échangent des banalités qui dérapent vers le non-sens le plus total. Ionesco fait exploser le langage et la logique dans cette 'anti-pièce' devenue culte.",
    communityRating: 4.0,
    logCount: 71,
    status: 'now',
    seen: false,
  },
  {
    id: 's5',
    title: 'Roméo et Juliette',
    genre: 'Théâtre classique',
    company: 'Comédie-Française',
    venues: ['Comédie-Française'],
    synopsis:
      "À Vérone, deux familles ennemies. Roméo et Juliette s'aiment envers et contre tous. Une tragédie de la passion et du destin, portée par une mise en scène épurée.",
    communityRating: 4.7,
    logCount: 203,
    status: 'now',
    seen: true,
  },
  {
    id: 's6',
    title: 'Huis clos',
    genre: 'Contemporain',
    company: 'Compagnie des Miroirs',
    venues: ['Théâtre de Poche-Montparnasse'],
    synopsis:
      "Trois personnages se retrouvent enfermés ensemble pour l'éternité. 'L'enfer, c'est les autres' : Sartre dissèque le regard d'autrui dans un huis clos implacable.",
    communityRating: 3.5,
    logCount: 42,
    status: 'touring',
    seen: false,
  },
  {
    id: 's7',
    title: 'Un stand-up presque parfait',
    genre: 'Stand-up',
    company: 'Léa Fontaine',
    venues: ['Le Point Virgule'],
    synopsis:
      "Une heure de vannes affûtées sur la vie parisienne, les applis de rencontre et la famille. Léa Fontaine confirme qu'elle est l'une des voix montantes du stand-up.",
    communityRating: 4.3,
    logCount: 88,
    status: 'now',
    seen: false,
  },
  {
    id: 's8',
    title: 'Le Dîner de cons',
    genre: 'Comédie',
    company: 'Théâtre des Variétés',
    venues: ['Théâtre des Variétés'],
    synopsis:
      "Chaque semaine, des amis organisent un dîner où chacun amène un 'con'. Mais ce soir, le con pourrait bien renverser la partie. Une mécanique comique implacable.",
    communityRating: 4.1,
    logCount: 150,
    status: 'now',
    seen: false,
  },
  {
    id: 's9',
    title: 'Dom Juan',
    genre: 'Théâtre classique',
    company: 'Molière',
    venues: ['Théâtre du Vieux-Colombier'],
    synopsis:
      "Libertin insatiable et provocateur, Dom Juan brave le ciel, les femmes et les conventions, entraînant son valet Sganarelle dans une fuite en avant vertigineuse. Molière signe une comédie sombre où l'insolence défie jusqu'au surnaturel.",
    communityRating: 4.4,
    logCount: 64,
    status: 'now',
    seen: false,
  },
];

export function getShowById(id: string): Show | undefined {
  return MOCK_SHOWS.find((s) => s.id === id);
}

// Curated lists for Découverte (fixed order, no ranking yet).
export const TRENDING_IDS = ['s5', 's1', 's8', 's7'];
export const NEW_IDS = ['s4', 's2', 's6'];

export const TRENDING_SHOWS: Show[] = TRENDING_IDS.map(
  (id) => getShowById(id)!
);
export const NEW_SHOWS: Show[] = NEW_IDS.map((id) => getShowById(id)!);

export const CATEGORIES: ShowGenre[] = [
  'Théâtre classique',
  'Contemporain',
  'Comédie',
  'Stand-up',
];

// ---- Reviews (for Fiche Spectacle) ----
export type Review = {
  id: string;
  showId: string;
  userId: string;
  username: string;
  rating: number;
  text: string;
};

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    showId: 's1',
    userId: 'u1',
    username: 'camille_p',
    rating: 4.5,
    text: 'Une mise en scène pleine d’énergie, le public riait aux éclats du début à la fin. Les comédiens sont impeccables.',
  },
  {
    id: 'r2',
    showId: 's1',
    userId: 'u3',
    username: 'sofia',
    rating: 4,
    text: 'Très bon moment, quelques longueurs au 2e acte mais l’ensemble reste réjouissant.',
  },
  {
    id: 'r3',
    showId: 's5',
    userId: 'u2',
    username: 'theo.m',
    rating: 5,
    text: 'Bouleversant. La scénographie épurée sert magnifiquement le texte.',
  },
  {
    id: 'r4',
    showId: 's5',
    userId: 'u1',
    username: 'camille_p',
    rating: 4.5,
    text: 'Un grand classique servi par une troupe au sommet. À voir absolument.',
  },
];

export function getReviewsForShow(showId: string): Review[] {
  return MOCK_REVIEWS.filter((r) => r.showId === showId);
}
