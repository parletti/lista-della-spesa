create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index if not exists idx_invites_family_id on public.invites(family_id);
create index if not exists idx_invites_token_hash on public.invites(token_hash);
create index if not exists idx_invites_expires_at on public.invites(expires_at);

alter table public.invites enable row level security;

drop policy if exists "invites_select_same_family" on public.invites;
create policy "invites_select_same_family"
on public.invites
for select
to authenticated
using (
  exists (
    select 1
    from public.family_members my_fm
    join public.profiles my_p on my_p.id = my_fm.profile_id
    where my_fm.family_id = invites.family_id
      and my_p.auth_user_id = auth.uid()
  )
);

drop policy if exists "invites_insert_admin_only" on public.invites;
create policy "invites_insert_admin_only"
on public.invites
for insert
to authenticated
with check (
  exists (
    select 1
    from public.family_members my_fm
    join public.profiles my_p on my_p.id = my_fm.profile_id
    where my_fm.family_id = invites.family_id
      and my_fm.role = 'ADMIN'
      and my_p.auth_user_id = auth.uid()
  )
);

drop policy if exists "invites_update_admin_only" on public.invites;
create policy "invites_update_admin_only"
on public.invites
for update
to authenticated
using (
  exists (
    select 1
    from public.family_members my_fm
    join public.profiles my_p on my_p.id = my_fm.profile_id
    where my_fm.family_id = invites.family_id
      and my_fm.role = 'ADMIN'
      and my_p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.family_members my_fm
    join public.profiles my_p on my_p.id = my_fm.profile_id
    where my_fm.family_id = invites.family_id
      and my_fm.role = 'ADMIN'
      and my_p.auth_user_id = auth.uid()
  )
);
