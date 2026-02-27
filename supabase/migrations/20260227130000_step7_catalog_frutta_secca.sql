insert into public.categories (key, label, sort_order)
values ('frutta_secca', 'Frutta secca', 35)
on conflict (key) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order;

with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    ('Mandorle', 'mandorle', 'frutta_secca', 78),
    ('Nocciole', 'nocciole', 'frutta_secca', 72),
    ('Noci', 'noci', 'frutta_secca', 80),
    ('Pistacchi', 'pistacchi', 'frutta_secca', 75),
    ('Anacardi', 'anacardi', 'frutta_secca', 68),
    ('Arachidi', 'arachidi', 'frutta_secca', 70),
    ('Pinoli', 'pinoli', 'frutta_secca', 61),
    ('Noci pecan', 'noci pecan', 'frutta_secca', 52),
    ('Noci macadamia', 'noci macadamia', 'frutta_secca', 48),
    ('Noci brasiliane', 'noci brasiliane', 'frutta_secca', 44),
    ('Uvetta', 'uvetta', 'frutta_secca', 63),
    ('Fichi secchi', 'fichi secchi', 'frutta_secca', 57),
    ('Datteri secchi', 'datteri secchi', 'frutta_secca', 54),
    ('Albicocche secche', 'albicocche secche', 'frutta_secca', 56),
    ('Prugne secche', 'prugne secche', 'frutta_secca', 51),
    ('Mirtilli rossi secchi', 'mirtilli rossi secchi', 'frutta_secca', 46),
    ('Mix frutta secca', 'mix frutta secca', 'frutta_secca', 67),
    ('Nocciole tostate', 'nocciole tostate', 'frutta_secca', 53),
    ('Mandorle pelate', 'mandorle pelate', 'frutta_secca', 50),
    ('Pistacchi sgusciati', 'pistacchi sgusciati', 'frutta_secca', 58),
    ('Semi di zucca', 'semi di zucca', 'frutta_secca', 55)
)
insert into public.products_catalog (display_name, normalized_name, category_id, popularity_score)
select p.display_name, p.normalized_name, c.id, p.popularity_score
from products p
join public.categories c on c.key = p.category_key
on conflict (normalized_name) do update
set
  display_name = excluded.display_name,
  category_id = excluded.category_id,
  popularity_score = greatest(public.products_catalog.popularity_score, excluded.popularity_score);
