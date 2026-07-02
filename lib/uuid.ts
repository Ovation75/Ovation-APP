// Distinguishes real Supabase rows (uuid primary keys) from leftover mock seed
// ids ('u1', 's3', 'p-fav'...). Several "other users" in the app are still
// mocked (see lib/mockUsers.ts) since no real multi-user data is seeded yet —
// this guard is how the app avoids sending those non-uuid ids to Postgres
// uuid-typed columns (which would throw a type-cast error).
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}
