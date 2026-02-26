create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_family_created
  on public.audit_logs(family_id, created_at desc);
create index if not exists idx_audit_logs_event_created
  on public.audit_logs(event_type, created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_select_same_family" on public.audit_logs;
create policy "audit_logs_select_same_family"
on public.audit_logs
for select
to authenticated
using (
  family_id is not null
  and exists (
    select 1
    from public.family_members my_fm
    join public.profiles my_p on my_p.id = my_fm.profile_id
    where my_fm.family_id = audit_logs.family_id
      and my_p.auth_user_id = auth.uid()
  )
);
