delete from public.categories
where key = 'carne_pesce'
  and not exists (
    select 1
    from public.products_catalog pc
    where pc.category_id = public.categories.id
  )
  and not exists (
    select 1
    from public.shopping_items si
    where si.category_id = public.categories.id
  );
