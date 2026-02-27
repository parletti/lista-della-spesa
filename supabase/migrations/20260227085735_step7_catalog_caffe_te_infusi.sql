insert into public.categories (key, label, sort_order)
values ('caffe_te_infusi', 'Caffè, Tè, Infusi', 55)
on conflict (key) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order;

with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    ('Caffè in grani', 'caffe in grani', 'caffe_te_infusi', 78),
    ('Caffè macinato', 'caffe macinato', 'caffe_te_infusi', 82),
    ('Caffè decaffeinato', 'caffe decaffeinato', 'caffe_te_infusi', 61),
    ('Cialde caffè', 'cialde caffe', 'caffe_te_infusi', 64),
    ('Capsule caffè', 'capsule caffe', 'caffe_te_infusi', 72),
    ('Caffè solubile', 'caffe solubile', 'caffe_te_infusi', 58),
    ('Orzo solubile', 'orzo solubile', 'caffe_te_infusi', 49),
    ('Ginseng solubile', 'ginseng solubile', 'caffe_te_infusi', 45),
    ('Tè nero', 'te nero', 'caffe_te_infusi', 57),
    ('Tè verde', 'te verde', 'caffe_te_infusi', 62),
    ('Tè bianco', 'te bianco', 'caffe_te_infusi', 43),
    ('Tè oolong', 'te oolong', 'caffe_te_infusi', 31),
    ('Tè deteinato', 'te deteinato', 'caffe_te_infusi', 38),
    ('Tè al limone', 'te al limone', 'caffe_te_infusi', 51),
    ('Tè alla pesca', 'te alla pesca', 'caffe_te_infusi', 53),
    ('Tisana camomilla', 'tisana camomilla', 'caffe_te_infusi', 66),
    ('Tisana finocchio', 'tisana finocchio', 'caffe_te_infusi', 48),
    ('Tisana zenzero e limone', 'tisana zenzero e limone', 'caffe_te_infusi', 52),
    ('Tisana frutti di bosco', 'tisana frutti di bosco', 'caffe_te_infusi', 44),
    ('Tisana rilassante', 'tisana rilassante', 'caffe_te_infusi', 40),
    ('Infuso menta', 'infuso menta', 'caffe_te_infusi', 39),
    ('Infuso karkadè', 'infuso karkade', 'caffe_te_infusi', 28),
    ('Cacao amaro', 'cacao amaro', 'caffe_te_infusi', 47),
    ('Cioccolata calda in polvere', 'cioccolata calda in polvere', 'caffe_te_infusi', 46),
    ('Latte di mandorla', 'latte di mandorla', 'caffe_te_infusi', 59),
    ('Latte di soia', 'latte di soia', 'caffe_te_infusi', 55),
    ('Latte di avena', 'latte di avena', 'caffe_te_infusi', 63),
    ('Latte di riso', 'latte di riso', 'caffe_te_infusi', 37),
    ('Gocce di cioccolato', 'gocce di cioccolato', 'caffe_te_infusi', 41)
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
