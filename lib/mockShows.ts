// Mocked public reviews shown on the Fiche Spectacle (E08).
//
// Still 100% mock (the review authors u1/u2/u3 are mock users — no real
// multi-user log data is seeded yet), but `showId` now references real
// catalogue rows via DEMO_SHOW_IDS. Once scripts/seed-catalogue.sql has been
// run, `getReviewsForShow(realShowId)` returns these reviews on the matching
// real ShowDetail instead of an empty list.
//
// NOTE: the community rating/log-count shown on ShowDetail is computed
// separately from the real `logs` table (AppStateContext.getShowStats), so a
// seeded show can display these mock reviews yet still read "Aucun avis" until
// a real user logs it. Delete this file once reviews are sourced from `logs`.
import { DEMO_SHOW_IDS } from './demoCatalogueIds';

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
    showId: DEMO_SHOW_IDS.malade,
    userId: 'u1',
    username: 'camille_p',
    rating: 4.5,
    text: 'Une mise en scène pleine d’énergie, le public riait aux éclats du début à la fin. Les comédiens sont impeccables.',
  },
  {
    id: 'r2',
    showId: DEMO_SHOW_IDS.malade,
    userId: 'u3',
    username: 'sofia',
    rating: 4,
    text: 'Très bon moment, quelques longueurs au 2e acte mais l’ensemble reste réjouissant.',
  },
  {
    id: 'r3',
    showId: DEMO_SHOW_IDS.romeo,
    userId: 'u2',
    username: 'theo.m',
    rating: 5,
    text: 'Bouleversant. La scénographie épurée sert magnifiquement le texte.',
  },
  {
    id: 'r4',
    showId: DEMO_SHOW_IDS.romeo,
    userId: 'u1',
    username: 'camille_p',
    rating: 4.5,
    text: 'Un grand classique servi par une troupe au sommet. À voir absolument.',
  },
];

export function getReviewsForShow(showId: string): Review[] {
  return MOCK_REVIEWS.filter((r) => r.showId === showId);
}
