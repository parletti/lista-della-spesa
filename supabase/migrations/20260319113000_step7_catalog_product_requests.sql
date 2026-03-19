create table if not exists public.catalog_product_requests (
  id uuid primary key default gen_random_uuid(),
  normalized_text text not null unique,
  raw_text_last_seen text not null,
  request_count integer not null default 1 check (request_count > 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  status text not null default 'OPEN' check (status in ('OPEN', 'ADDED', 'IGNORED')),
  added_product_id uuid references public.products_catalog(id) on delete set null
);

alter table public.catalog_product_requests enable row level security;

create or replace function public.register_catalog_product_request(
  p_normalized_text text,
  p_raw_text text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_normalized_text is null or btrim(p_normalized_text) = '' then
    return;
  end if;

  insert into public.catalog_product_requests (
    normalized_text,
    raw_text_last_seen,
    request_count,
    first_seen_at,
    last_seen_at,
    status
  )
  values (
    btrim(p_normalized_text),
    coalesce(nullif(btrim(p_raw_text), ''), btrim(p_normalized_text)),
    1,
    now(),
    now(),
    'OPEN'
  )
  on conflict (normalized_text) do update
  set
    raw_text_last_seen = excluded.raw_text_last_seen,
    request_count = public.catalog_product_requests.request_count + 1,
    last_seen_at = now();
end;
$$;

create or replace function public.resolve_catalog_product_request(
  p_product_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_normalized_text text;
  v_category_id uuid;
begin
  select normalized_name, category_id
  into v_normalized_text, v_category_id
  from public.products_catalog
  where id = p_product_id;

  if v_normalized_text is null then
    raise exception 'Product % not found in products_catalog', p_product_id;
  end if;

  update public.catalog_product_requests
  set
    status = 'ADDED',
    added_product_id = p_product_id,
    last_seen_at = now()
  where normalized_text = v_normalized_text
    and status = 'OPEN';

  update public.shopping_items
  set
    product_id = p_product_id,
    category_id = v_category_id,
    normalized_text = v_normalized_text
  where product_id is null
    and normalized_text = v_normalized_text;
end;
$$;

revoke all on public.catalog_product_requests from anon, authenticated;
grant select on public.catalog_product_requests to service_role;

revoke all on function public.register_catalog_product_request(text, text) from public;
grant execute on function public.register_catalog_product_request(text, text) to service_role;

revoke all on function public.resolve_catalog_product_request(uuid) from public;
grant execute on function public.resolve_catalog_product_request(uuid) to service_role;
