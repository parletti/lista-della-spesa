create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null unique,
  sort_order int not null default 100
);

create table if not exists public.products_catalog (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  normalized_name text not null unique,
  category_id uuid not null references public.categories(id) on delete restrict,
  popularity_score int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_aliases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products_catalog(id) on delete cascade,
  alias_normalized text not null,
  unique (product_id, alias_normalized)
);

create index if not exists idx_products_catalog_category on public.products_catalog(category_id);
create index if not exists idx_products_catalog_display_name on public.products_catalog(display_name);
create index if not exists idx_product_aliases_alias on public.product_aliases(alias_normalized);

alter table public.shopping_items
  add column if not exists normalized_text text,
  add column if not exists product_id uuid references public.products_catalog(id) on delete set null,
  add column if not exists category_id uuid references public.categories(id) on delete set null;

create index if not exists idx_shopping_items_category on public.shopping_items(category_id);

alter table public.categories enable row level security;
alter table public.products_catalog enable row level security;
alter table public.product_aliases enable row level security;

drop policy if exists "categories_select_authenticated" on public.categories;
create policy "categories_select_authenticated"
on public.categories
for select
to authenticated
using (true);

drop policy if exists "products_select_authenticated" on public.products_catalog;
create policy "products_select_authenticated"
on public.products_catalog
for select
to authenticated
using (true);

drop policy if exists "product_aliases_select_authenticated" on public.product_aliases;
create policy "product_aliases_select_authenticated"
on public.product_aliases
for select
to authenticated
using (true);

insert into public.categories (key, label, sort_order)
values
  ('frutta', 'Frutta', 10),
  ('verdura', 'Verdura', 20),
  ('latticini', 'Latticini', 30),
  ('forno', 'Pane e Forno', 40),
  ('bevande', 'Bevande', 50),
  ('dispensa', 'Dispensa', 60),
  ('carne_pesce', 'Carne e Pesce', 70),
  ('igiene_casa', 'Igiene e Casa', 80)
on conflict (key) do nothing;

with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    ('Mela', 'mela', 'frutta', 100),
    ('Banana', 'banana', 'frutta', 90),
    ('Arancia', 'arancia', 'frutta', 80),
    ('Pera', 'pera', 'frutta', 75),
    ('Limone', 'limone', 'frutta', 65),
    ('Lattuga', 'lattuga', 'verdura', 80),
    ('Carota', 'carota', 'verdura', 95),
    ('Pomodoro', 'pomodoro', 'verdura', 92),
    ('Zucchina', 'zucchina', 'verdura', 78),
    ('Peperone', 'peperone', 'verdura', 74),
    ('Latte', 'latte', 'latticini', 100),
    ('Yogurt', 'yogurt', 'latticini', 80),
    ('Burro', 'burro', 'latticini', 70),
    ('Stracchino', 'stracchino', 'latticini', 60),
    ('Panna', 'panna', 'latticini', 55),
    ('Pane', 'pane', 'forno', 98),
    ('Fette biscottate', 'fette biscottate', 'forno', 60),
    ('Acqua naturale', 'acqua naturale', 'bevande', 100),
    ('Acqua frizzante', 'acqua frizzante', 'bevande', 88),
    ('Succo di frutta', 'succo di frutta', 'bevande', 62),
    ('Pasta', 'pasta', 'dispensa', 100),
    ('Riso', 'riso', 'dispensa', 85),
    ('Passata di pomodoro', 'passata di pomodoro', 'dispensa', 76),
    ('Tonno', 'tonno', 'dispensa', 72),
    ('Olio extravergine', 'olio extravergine', 'dispensa', 90),
    ('Sale', 'sale', 'dispensa', 80),
    ('Zucchero', 'zucchero', 'dispensa', 78),
    ('Pollo', 'pollo', 'carne_pesce', 75),
    ('Salmone', 'salmone', 'carne_pesce', 65),
    ('Uova', 'uova', 'latticini', 88),
    ('Detersivo piatti', 'detersivo piatti', 'igiene_casa', 70),
    ('Carta igienica', 'carta igienica', 'igiene_casa', 92),
    ('Sapone mani', 'sapone mani', 'igiene_casa', 68)
)
insert into public.products_catalog (display_name, normalized_name, category_id, popularity_score)
select p.display_name, p.normalized_name, c.id, p.popularity_score
from products p
join public.categories c on c.key = p.category_key
on conflict (normalized_name) do nothing;

with aliases(alias_normalized, product_normalized) as (
  values
    ('mele', 'mela'),
    ('banana bio', 'banana'),
    ('pomodori', 'pomodoro'),
    ('zucchine', 'zucchina'),
    ('peperoni', 'peperone'),
    ('latte intero', 'latte'),
    ('latte parzialmente scremato', 'latte'),
    ('yoghurt', 'yogurt'),
    ('acqua', 'acqua naturale'),
    ('olio evo', 'olio extravergine'),
    ('passata', 'passata di pomodoro'),
    ('detersivo', 'detersivo piatti')
)
insert into public.product_aliases (product_id, alias_normalized)
select pc.id, a.alias_normalized
from aliases a
join public.products_catalog pc on pc.normalized_name = a.product_normalized
on conflict (product_id, alias_normalized) do nothing;
