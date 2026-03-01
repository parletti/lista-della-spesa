create table if not exists public.shopping_presence_sessions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  ended_reason text check (ended_reason in ('MANUAL', 'SIGNOUT')),
  created_at timestamptz not null default now()
);

create index if not exists idx_presence_sessions_family_started
  on public.shopping_presence_sessions(family_id, started_at desc);

create index if not exists idx_presence_sessions_profile_started
  on public.shopping_presence_sessions(profile_id, started_at desc);

create index if not exists idx_presence_sessions_family_active
  on public.shopping_presence_sessions(family_id, profile_id)
  where ended_at is null;

alter table public.shopping_presence_sessions enable row level security;

drop policy if exists "presence_sessions_select_same_family" on public.shopping_presence_sessions;
create policy "presence_sessions_select_same_family"
on public.shopping_presence_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.family_members my_fm
    join public.profiles my_p on my_p.id = my_fm.profile_id
    where my_fm.family_id = shopping_presence_sessions.family_id
      and my_p.auth_user_id = auth.uid()
  )
);

drop policy if exists "presence_sessions_insert_own_family" on public.shopping_presence_sessions;
create policy "presence_sessions_insert_own_family"
on public.shopping_presence_sessions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.family_members my_fm
    join public.profiles my_p on my_p.id = my_fm.profile_id
    where my_fm.family_id = shopping_presence_sessions.family_id
      and my_p.id = shopping_presence_sessions.profile_id
      and my_p.auth_user_id = auth.uid()
  )
);

drop policy if exists "presence_sessions_update_own_family" on public.shopping_presence_sessions;
create policy "presence_sessions_update_own_family"
on public.shopping_presence_sessions
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles my_p
    where my_p.id = shopping_presence_sessions.profile_id
      and my_p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.family_members my_fm
    join public.profiles my_p on my_p.id = my_fm.profile_id
    where my_fm.family_id = shopping_presence_sessions.family_id
      and my_p.id = shopping_presence_sessions.profile_id
      and my_p.auth_user_id = auth.uid()
  )
);

create or replace function public.get_active_shopping_presence_sessions(p_family_id uuid)
returns table (
  id uuid,
  profile_id uuid,
  started_at timestamptz,
  display_name text,
  minutes_active integer
)
language sql
stable
security invoker
as $$
  select
    s.id,
    s.profile_id,
    s.started_at,
    p.display_name,
    greatest(1, floor(extract(epoch from (now() - s.started_at)) / 60)::int) as minutes_active
  from public.shopping_presence_sessions s
  join public.profiles p on p.id = s.profile_id
  where s.family_id = p_family_id
    and s.ended_at is null
    and s.started_at >= now() - interval '60 minutes'
  order by s.started_at desc;
$$;
