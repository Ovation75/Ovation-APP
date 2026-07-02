// Shared error handling for Supabase calls: detect session/JWT problems (so
// the caller can force a sign-out and let the app-level listener redirect to
// Login) and turn Postgres/PostgREST errors into short French messages.
// Structurally typed (not imported from supabase-js) since it covers both
// PostgrestError and AuthError shapes, which both carry message/code.
type SupaError = { message?: string; code?: string } | null;

export function isAuthError(error: SupaError): boolean {
  if (!error) return false;
  const msg = (error.message ?? '').toLowerCase();
  const code = 'code' in error ? error.code : undefined;
  return (
    code === 'PGRST301' || // JWT expired (PostgREST)
    code === '401' ||
    msg.includes('jwt') ||
    msg.includes('token is expired') ||
    msg.includes('invalid claim') ||
    msg.includes('not authenticated')
  );
}

export function describeError(error: SupaError, fallback: string): string {
  if (!error) return fallback;
  if (isAuthError(error)) return 'Session expirée. Reconnecte-toi.';
  return error.message || fallback;
}
