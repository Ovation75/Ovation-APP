// Adapter between the real Supabase `shows` / `show_venues` tables and the
// app-facing `Show` shape (lib/shows.ts). All DB-encoding knowledge (genre
// slugs, status slugs) lives here so the rest of the app only ever sees the
// French display labels it already used with the mock catalogue.
import { supabase } from './supabase';
import { describeError } from './supabaseErrors';
import type { Show, ShowGenre, ShowStatus } from './shows';

// DB check constraint: genre in ('theatre_classique','contemporain','comedie','stand_up')
type DbGenre = 'theatre_classique' | 'contemporain' | 'comedie' | 'stand_up';
const GENRE_DB_TO_APP: Record<DbGenre, ShowGenre> = {
  theatre_classique: 'Théâtre classique',
  contemporain: 'Contemporain',
  comedie: 'Comédie',
  stand_up: 'Stand-up',
};
const GENRE_APP_TO_DB: Record<ShowGenre, DbGenre> = {
  'Théâtre classique': 'theatre_classique',
  Contemporain: 'contemporain',
  Comédie: 'comedie',
  'Stand-up': 'stand_up',
};

// DB check constraint: status in ('ongoing','touring','finished')
type DbStatus = 'ongoing' | 'touring' | 'finished';
const STATUS_DB_TO_APP: Record<DbStatus, ShowStatus> = {
  ongoing: 'now',
  touring: 'touring',
  finished: 'finished',
};
const STATUS_APP_TO_DB: Record<ShowStatus, DbStatus> = {
  now: 'ongoing',
  touring: 'touring',
  finished: 'finished',
};

export function genreToDb(genre: ShowGenre): DbGenre {
  return GENRE_APP_TO_DB[genre];
}

export function statusToDb(status: ShowStatus): DbStatus {
  return STATUS_APP_TO_DB[status];
}

type ShowRow = {
  id: string;
  title: string;
  genre: string;
  synopsis: string | null;
  status: string;
  image_url: string | null;
  show_venues: { venue_name: string }[] | null;
};

function mapRow(row: ShowRow): Show {
  return {
    id: row.id,
    title: row.title,
    // Unknown/legacy genre values fall back to the raw string cast as-is
    // rather than throwing, so one bad row doesn't break the whole catalogue.
    genre: (GENRE_DB_TO_APP as Record<string, ShowGenre>)[row.genre] ??
      (row.genre as ShowGenre),
    venues: (row.show_venues ?? []).map((v) => v.venue_name),
    synopsis: row.synopsis ?? '',
    status:
      (STATUS_DB_TO_APP as Record<string, ShowStatus>)[row.status] ??
      (row.status as ShowStatus),
    imageUrl: row.image_url ?? undefined,
    // company: intentionally omitted — no column in the real schema.
  };
}

export async function fetchShows(): Promise<{
  shows: Show[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('shows')
    .select('id, title, genre, synopsis, status, image_url, show_venues(venue_name)')
    .order('created_at', { ascending: false });

  if (error) {
    return { shows: [], error: describeError(error, 'Impossible de charger le catalogue.') };
  }
  return { shows: (data as ShowRow[]).map(mapRow), error: null };
}

// Community rating + log count are computed client-side from every row in
// `logs` (see AppStateContext.getShowStats) rather than a Postgres RPC —
// simplest option for MVP scale. This depends on `logs` being readable
// beyond just the current user's own rows; if the real RLS SELECT policy on
// `logs` is restricted to `user_id = auth.uid()`, this will only ever surface
// the current user's own rating until that policy is opened up for reads.
export async function fetchAllLogRatings(): Promise<{
  ratings: { show_id: string; rating: number; user_id: string }[];
  error: string | null;
}> {
  // user_id is kept so AppStateContext.getShowStats can exclude blocked
  // users' ratings from the community average, matching the old mocked
  // behaviour (blocking someone hides their rating contribution too).
  const { data, error } = await supabase
    .from('logs')
    .select('show_id, rating, user_id');
  if (error) {
    return {
      ratings: [],
      error: describeError(error, 'Impossible de charger les notes de la communauté.'),
    };
  }
  return { ratings: data ?? [], error: null };
}
