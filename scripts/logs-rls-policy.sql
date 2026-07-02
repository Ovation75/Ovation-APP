-- ============================================================================
-- RLS policies for public.logs
-- ----------------------------------------------------------------------------
-- Goal: every authenticated user can READ all logs (needed so the app can
-- compute community rating + log count per show — AppStateContext.getShowStats
-- aggregates the whole `logs` table). WRITES stay restricted to the caller's
-- own rows (user_id = auth.uid()).
--
-- Review, then run yourself. Safe to re-run: each policy is dropped first.
-- `(select auth.uid())` is wrapped in a subselect so Postgres evaluates it once
-- per statement instead of once per row (Supabase's recommended pattern).
-- ============================================================================

alter table public.logs enable row level security;

-- READ: any authenticated user can read every log row.
drop policy if exists "logs_select_authenticated" on public.logs;
create policy "logs_select_authenticated"
  on public.logs
  for select
  to authenticated
  using (true);

-- INSERT: only rows you own.
drop policy if exists "logs_insert_own" on public.logs;
create policy "logs_insert_own"
  on public.logs
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- UPDATE: only rows you own (and you can't reassign a row to someone else).
drop policy if exists "logs_update_own" on public.logs;
create policy "logs_update_own"
  on public.logs
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- DELETE: only rows you own.
drop policy if exists "logs_delete_own" on public.logs;
create policy "logs_delete_own"
  on public.logs
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
