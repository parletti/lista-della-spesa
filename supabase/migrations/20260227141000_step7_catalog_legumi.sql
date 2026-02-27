insert into public.categories (key, label, sort_order)
values ('legumi', 'Legumi', 58)
on conflict (key) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order;

with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    ('Ceci secchi', 'ceci secchi', 'legumi', 67),
    ('Ceci in scatola', 'ceci in scatola', 'legumi', 74),
    ('Fagioli borlotti secchi', 'fagioli borlotti secchi', 'legumi', 63),
    ('Fagioli borlotti in scatola', 'fagioli borlotti in scatola', 'legumi', 71),
    ('Fagioli cannellini secchi', 'fagioli cannellini secchi', 'legumi', 61),
    ('Fagioli cannellini in scatola', 'fagioli cannellini in scatola', 'legumi', 69),
    ('Fagioli neri secchi', 'fagioli neri secchi', 'legumi', 55),
    ('Fagioli rossi secchi', 'fagioli rossi secchi', 'legumi', 56),
    ('Lenticchie secche', 'lenticchie secche', 'legumi', 72),
    ('Lenticchie in scatola', 'lenticchie in scatola', 'legumi', 65),
    ('Lenticchie rosse decorticate', 'lenticchie rosse decorticate', 'legumi', 58),
    ('Piselli secchi spezzati', 'piselli secchi spezzati', 'legumi', 50),
    ('Piselli in scatola', 'piselli in scatola', 'legumi', 62),
    ('Fave secche', 'fave secche', 'legumi', 49),
    ('Cicerchie secche', 'cicerchie secche', 'legumi', 45),
    ('Lupini in salamoia', 'lupini in salamoia', 'legumi', 47),
    ('Soia gialla secca', 'soia gialla secca', 'legumi', 43),
    ('Edamame surgelato', 'edamame surgelato', 'legumi', 52),
    ('Mix legumi secchi', 'mix legumi secchi', 'legumi', 59),
    ('Zuppa di legumi mista', 'zuppa di legumi mista', 'legumi', 53)
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
