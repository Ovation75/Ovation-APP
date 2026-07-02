// Canonical show catalogue types, decoupled from both the mock seed data and
// the exact Supabase column encoding. `lib/supabaseCatalogue.ts` maps the
// real `shows`/`show_venues` tables onto this shape at fetch time, so the
// rest of the app (Search filters, category chips, status pills) never has
// to know about DB-side slugs like `theatre_classique` or `ongoing`.

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

export const CATEGORIES: ShowGenre[] = [
  'Théâtre classique',
  'Contemporain',
  'Comédie',
  'Stand-up',
];

export type Show = {
  id: string;
  title: string;
  genre: ShowGenre;
  // The real `shows` table has no artist/troupe column (schema mismatch vs.
  // the original mock data) — undefined for anything fetched from Supabase.
  company?: string;
  venues: string[];
  synopsis: string;
  status: ShowStatus;
  imageUrl?: string;
};
