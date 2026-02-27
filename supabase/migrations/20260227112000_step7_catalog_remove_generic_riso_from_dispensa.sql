with target as (
  select p.id
  from public.products_catalog p
  join public.categories c on c.id = p.category_id
  where c.key = 'dispensa'
    and p.normalized_name = 'riso'
)
delete from public.product_aliases pa
using target t
where pa.product_id = t.id;

delete from public.products_catalog p
using public.categories c
where p.category_id = c.id
  and c.key = 'dispensa'
  and p.normalized_name = 'riso';
