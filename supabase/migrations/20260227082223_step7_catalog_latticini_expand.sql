with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    ('Gorgonzola', 'gorgonzola', 'latticini', 68),
    ('Grana Padano', 'grana padano', 'latticini', 75),
    ('Pecorino Romano', 'pecorino romano', 'latticini', 64),
    ('Asiago', 'asiago', 'latticini', 58),
    ('Provolone', 'provolone', 'latticini', 61),
    ('Scamorza', 'scamorza', 'latticini', 56),
    ('Caciocavallo', 'caciocavallo', 'latticini', 50),
    ('Fontina', 'fontina', 'latticini', 55),
    ('Taleggio', 'taleggio', 'latticini', 52),
    ('Brie', 'brie', 'latticini', 48),
    ('Camembert', 'camembert', 'latticini', 45),
    ('Emmental', 'emmental', 'latticini', 54),
    ('Edamer', 'edamer', 'latticini', 42),
    ('Feta', 'feta', 'latticini', 57),
    ('Caprino', 'caprino', 'latticini', 53),
    ('Mascarpone', 'mascarpone', 'latticini', 63),
    ('Crescenza', 'crescenza', 'latticini', 46),
    ('Fiocchi di latte', 'fiocchi di latte', 'latticini', 49),
    ('Robiola', 'robiola', 'latticini', 44),
    ('Quartirolo', 'quartirolo', 'latticini', 39),
    ('Burrata', 'burrata', 'latticini', 67),
    ('Formaggio spalmabile', 'formaggio spalmabile', 'latticini', 62),
    ('Lassi', 'lassi', 'latticini', 30),
    ('Latte di capra', 'latte di capra', 'latticini', 41),
    ('Latte di pecora', 'latte di pecora', 'latticini', 36),
    ('Latte senza lattosio', 'latte senza lattosio', 'latticini', 72),
    ('Panna acida', 'panna acida', 'latticini', 33),
    ('Creme fraiche', 'creme fraiche', 'latticini', 28),
    ('Cagliata', 'cagliata', 'latticini', 24),
    ('Caciotta', 'caciotta', 'latticini', 47),
    ('Montasio', 'montasio', 'latticini', 34),
    ('Ragusano', 'ragusano', 'latticini', 22),
    ('Yogurt greco', 'yogurt greco', 'latticini', 73),
    ('Yogurt alla frutta', 'yogurt alla frutta', 'latticini', 66)
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
