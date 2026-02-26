create extension if not exists pgcrypto;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  display_name text not null check (char_length(trim(display_name)) between 2 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('ADMIN', 'MEMBER')),
  created_at timestamptz not null default now(),
  primary key (family_id, profile_id)
);

create index if not exists idx_profiles_auth_user_id on public.profiles(auth_user_id);
create index if not exists idx_family_members_profile on public.family_members(profile_id);
create index if not exists idx_family_members_family on public.family_members(family_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_families_updated_at on public.families;
create trigger trg_families_updated_at
before update on public.families
for each row
execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.family_members enable row level security;

drop policy if exists "families_select_member_only" on public.families;
create policy "families_select_member_only"
on public.families
for select
to authenticated
using (
  exists (
    select 1
    from public.family_members fm
    join public.profiles p on p.id = fm.profile_id
    where fm.family_id = families.id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth_user_id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth_user_id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

drop policy if exists "family_members_select_same_family" on public.family_members;
create policy "family_members_select_same_family"
on public.family_members
for select
to authenticated
using (
  exists (
    select 1
    from public.family_members my_fm
    join public.profiles my_p on my_p.id = my_fm.profile_id
    where my_fm.family_id = family_members.family_id
      and my_p.auth_user_id = auth.uid()
  )
);
