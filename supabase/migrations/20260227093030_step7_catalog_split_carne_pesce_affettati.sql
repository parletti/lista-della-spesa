insert into public.categories (key, label, sort_order)
values
  ('carne', 'Carne', 70),
  ('pesce', 'Pesce', 75),
  ('affettati', 'Affettati', 76)
on conflict (key) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order;

with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    -- Pesce
    ('Salmone fresco', 'salmone fresco', 'pesce', 72),
    ('Salmone selvaggio affumicato', 'salmone selvaggio affumicato', 'pesce', 66),
    ('Salmone selvaggio congelato', 'salmone selvaggio congelato', 'pesce', 64),
    ('Tonno fresco', 'tonno fresco', 'pesce', 63),
    ('Tonno in scatola', 'tonno in scatola', 'pesce', 81),
    ('Merluzzo', 'merluzzo', 'pesce', 60),
    ('Nasello', 'nasello', 'pesce', 50),
    ('Orata', 'orata', 'pesce', 57),
    ('Branzino', 'branzino', 'pesce', 56),
    ('Sgombro', 'sgombro', 'pesce', 48),
    ('Trota', 'trota', 'pesce', 47),
    ('Pesce spada', 'pesce spada', 'pesce', 58),
    ('Alici', 'alici', 'pesce', 46),
    ('Sardine', 'sardine', 'pesce', 44),
    ('Calamari', 'calamari', 'pesce', 61),
    ('Seppie', 'seppie', 'pesce', 52),
    ('Polpo', 'polpo', 'pesce', 55),
    ('Gamberi', 'gamberi', 'pesce', 65),
    ('Cozze', 'cozze', 'pesce', 53),
    ('Vongole', 'vongole', 'pesce', 54),
    ('Baccalà', 'baccala', 'pesce', 49),

    -- Carne
    ('Petto di pollo', 'petto di pollo', 'carne', 74),
    ('Cosce di pollo', 'cosce di pollo', 'carne', 62),
    ('Fesa di tacchino', 'fesa di tacchino', 'carne', 59),
    ('Macinato di manzo', 'macinato di manzo', 'carne', 71),
    ('Bistecca di manzo', 'bistecca di manzo', 'carne', 66),
    ('Spezzatino di manzo', 'spezzatino di manzo', 'carne', 56),
    ('Vitello a fette', 'vitello a fette', 'carne', 51),
    ('Arrosto di vitello', 'arrosto di vitello', 'carne', 45),
    ('Lonza di maiale', 'lonza di maiale', 'carne', 58),
    ('Costine di maiale', 'costine di maiale', 'carne', 50),
    ('Salsiccia fresca', 'salsiccia fresca', 'carne', 60),
    ('Hamburger di manzo', 'hamburger di manzo', 'carne', 63),
    ('Wurstel', 'wurstel', 'carne', 46),

    -- Affettati
    ('Prosciutto cotto', 'prosciutto cotto', 'affettati', 73),
    ('Prosciutto crudo', 'prosciutto crudo', 'affettati', 69),
    ('Bresaola', 'bresaola', 'affettati', 57),
    ('Pancetta', 'pancetta', 'affettati', 52),
    ('Mortadella', 'mortadella', 'affettati', 55),
    ('Salame', 'salame', 'affettati', 58),

    -- Riallineamento prodotti esistenti
    ('Pollo', 'pollo', 'carne', 75),
    ('Salmone', 'salmone', 'pesce', 65)
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
