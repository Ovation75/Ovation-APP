-- ============================================================================
-- PROPOSED schema for user preferences + optional profile fields
-- ----------------------------------------------------------------------------
-- STATUS: PROPOSAL ONLY — NOT APPLIED. Nothing in the app runs this file, and
-- it has NOT been executed against any Supabase project. Review it, adjust it,
-- then run it yourself if/when you want these preferences to persist.
--
-- WHY: today the Preferences screen (Découverte / Feed / Privacy / Notifications
-- / Accessibility) stores everything LOCAL-ONLY in AppStateContext.preferences,
-- so it resets on every app restart. The `user_preferences` table below gives it
-- a durable home, one row per user. The optional `profiles` columns cover a few
-- fields the UI already hints at but the current schema lacks (display_name, a
-- free-form preferences blob, a dismissed-flag for the profile-completion nudge).
--
-- SAFETY: every statement is additive and idempotent (IF NOT EXISTS). It creates
-- one new table and (optionally) adds nullable columns with defaults to
-- `profiles`. It never drops or rewrites existing data. RLS restricts every row
-- to its owner.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. user_preferences — one row per user, mirrors AppStateContext.Preferences.
-- ----------------------------------------------------------------------------
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,

  -- Découverte
  preferred_genres   text[]  not null default '{}',
  preferred_venues   text[]  not null default '{}',
  -- 'popular' | 'recent' | 'friends'
  content_preference text    not null default 'popular'
    check (content_preference in ('popular', 'recent', 'friends')),

  -- Feed
  feed_friend_activity  boolean not null default true,
  feed_editorial        boolean not null default true,
  feed_recommendations  boolean not null default true,

  -- Privacy (profile visibility itself stays on profiles.is_public)
  show_ratings   boolean not null default true,
  show_wishlist  boolean not null default false,

  -- Notifications (fine-grained; the global push channel stays elsewhere)
  notify_applause        boolean not null default true,
  notify_comments        boolean not null default true,
  notify_follow_requests boolean not null default true,
  notify_editorial       boolean not null default false,

  -- Accessibility
  reduced_motion boolean not null default false,
  compact_cards  boolean not null default false,
  dark_mode      boolean not null default false,

  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh on write.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 2. RLS — a user can only see and edit their own preferences row.
-- ----------------------------------------------------------------------------
alter table public.user_preferences enable row level security;

drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own"
  on public.user_preferences
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own"
  on public.user_preferences
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own"
  on public.user_preferences
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "user_preferences_delete_own" on public.user_preferences;
create policy "user_preferences_delete_own"
  on public.user_preferences
  for delete
  to authenticated
  using (user_id = (select auth.uid()));


-- ----------------------------------------------------------------------------
-- 3. OPTIONAL profiles columns — the UI hints at these but the table lacks them.
--    All nullable / defaulted, so existing rows are unaffected. Uncomment to add.
-- ----------------------------------------------------------------------------
-- display_name: a human name shown alongside @username (EditProfile references
-- this as a placeholder today; there is no column yet).
-- alter table public.profiles
--   add column if not exists display_name text;

-- preferences: a free-form JSON blob for lightweight settings you don't want to
-- model as columns. Redundant with user_preferences above — pick ONE approach
-- (typed table OR json blob), not both.
-- alter table public.profiles
--   add column if not exists preferences jsonb not null default '{}'::jsonb;

-- profile_completion_dismissed: lets the app remember the user dismissed the
-- "complete your profile" nudge so it never reappears.
-- alter table public.profiles
--   add column if not exists profile_completion_dismissed boolean not null default false;
