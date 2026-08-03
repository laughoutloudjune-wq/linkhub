create table public.profile_members (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor',
  created_at timestamptz not null default now(),
  primary key (profile_id, user_id)
);

alter table public.profile_members enable row level security;

-- SECURITY DEFINER wrapper: policies on profile_members cannot reference
-- profile_members directly in a subquery (Postgres rejects that as
-- "infinite recursion detected in policy"). Routing the membership check
-- through a definer function bypasses RLS inside the function body, so the
-- lookup runs once instead of recursively re-triggering the same policy.
create or replace function public.is_profile_member(pid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profile_members where profile_id = pid and user_id = auth.uid());
$$;

create policy "member can read own membership rows" on public.profile_members
  for select using (public.is_profile_member(profile_id));

create policy "user can insert own membership row" on public.profile_members
  for insert with check (auth.uid() = user_id);

-- backfill: make the existing owner(s) a member of their own profile
insert into public.profile_members (profile_id, user_id, role)
select id, id, 'owner' from public.profiles
on conflict do nothing;

-- profiles: replace owner-only checks with membership checks
drop policy "owner can update own profile" on public.profiles;
drop policy "owner can delete own profile" on public.profiles;

create policy "member can update profile" on public.profiles
  for update using (public.is_profile_member(id));
create policy "member can delete profile" on public.profiles
  for delete using (public.is_profile_member(id));

-- links: replace owner-only checks with membership checks
drop policy "active links are publicly readable" on public.links;
drop policy "owner can insert own links" on public.links;
drop policy "owner can update own links" on public.links;
drop policy "owner can delete own links" on public.links;

create policy "active links are publicly readable" on public.links
  for select using (active = true or public.is_profile_member(profile_id));
create policy "member can insert links" on public.links
  for insert with check (public.is_profile_member(profile_id));
create policy "member can update links" on public.links
  for update using (public.is_profile_member(profile_id));
create policy "member can delete links" on public.links
  for delete using (public.is_profile_member(profile_id));

-- click_events / page_view_events: replace owner-only checks with membership checks
drop policy "owner can read own click events" on public.click_events;
drop policy "owner can delete own click events" on public.click_events;
create policy "member can read click events" on public.click_events
  for select using (public.is_profile_member(profile_id));
create policy "member can delete click events" on public.click_events
  for delete using (public.is_profile_member(profile_id));

drop policy "owner can read own page views" on public.page_view_events;
drop policy "owner can delete own page views" on public.page_view_events;
create policy "member can read page views" on public.page_view_events
  for select using (public.is_profile_member(profile_id));
create policy "member can delete page views" on public.page_view_events
  for delete using (public.is_profile_member(profile_id));
