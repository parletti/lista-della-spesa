# Supabase Migrations

## Step 2 - Base schema + RLS minima

File migration:
- `supabase/migrations/20260226173000_step2_base_schema_rls.sql`

### Come applicarla
1. Apri Supabase Dashboard.
2. Vai su `SQL Editor`.
3. Crea una nuova query.
4. Incolla il contenuto della migration.
5. Esegui la query.

### Verifica rapida post-migration
1. Controlla che le tabelle esistano:
   - `families`
   - `profiles`
   - `family_members`
2. Controlla RLS attivo:
   - in `Table Editor`, ogni tabella deve avere RLS `enabled`.

### Verifica sicurezza (cross-family bloccata)
Esegui questi test con due utenti diversi autenticati:
1. Utente A membro di Famiglia A.
2. Utente B membro di Famiglia B.
3. Utente A non deve vedere righe di Famiglia B in `families`/`family_members`.
4. Utente A deve vedere solo il proprio profilo in `profiles`.

## Step 4 - Shopping items core

File migration:
- `supabase/migrations/20260226180000_step4_shopping_items.sql`

### Come applicarla
1. Apri Supabase Dashboard.
2. Vai su `SQL Editor`.
3. Esegui il contenuto della migration.

### Verifica rapida
1. La tabella `shopping_items` esiste.
2. RLS è attivo su `shopping_items`.
3. Un membro famiglia può inserire item nella propria famiglia.

## Step 6 - Inviti sicuri (24h monouso)

File migration:
- `supabase/migrations/20260226191000_step6_invites.sql`

### Come applicarla
1. Apri Supabase Dashboard.
2. Vai su `SQL Editor`.
3. Esegui il contenuto della migration.

### Verifica rapida
1. Tabella `invites` esiste con RLS attivo.
2. Solo utente admin della famiglia riesce a creare inviti.
3. Invito valido può essere usato una sola volta.
4. Invito scaduto viene rifiutato.

## Step 7 - Categorie + catalogo seed + autocomplete

File migration:
- `supabase/migrations/20260226195000_step7_catalog_autocomplete.sql`
- `supabase/migrations/20260226232051_step7_catalog_expand_foods.sql`
- `supabase/migrations/20260227082223_step7_catalog_latticini_expand.sql`
- `supabase/migrations/20260227083735_step7_catalog_latticini_formaggi_milk_type.sql`
- `supabase/migrations/20260227084647_step7_catalog_frutta_expand.sql`
- `supabase/migrations/20260227085735_step7_catalog_caffe_te_infusi.sql`
- `supabase/migrations/20260227093030_step7_catalog_split_carne_pesce_affettati.sql`
- `supabase/migrations/20260227103000_step7_catalog_pasta_riso.sql`
- `supabase/migrations/20260227112000_step7_catalog_remove_generic_riso_from_dispensa.sql`
- `supabase/migrations/20260227130000_step7_catalog_frutta_secca.sql`
- `supabase/migrations/20260227134000_step7_catalog_dolci.sql`
- `supabase/migrations/20260227135500_step7_catalog_add_funghi_to_verdura.sql`
- `supabase/migrations/20260227141000_step7_catalog_legumi.sql`
- `supabase/migrations/20260227143000_step7_catalog_add_salsa_di_soia_to_dispensa.sql`
- `supabase/migrations/20260227150000_step7_catalog_condimenti.sql`
- `supabase/migrations/20260228114000_step7_catalog_latticini_add_items.sql`
- `supabase/migrations/20260228162000_step7_catalog_condimenti_add_olive.sql`

### Come applicarla
1. Apri Supabase Dashboard.
2. Vai su `SQL Editor`.
3. Esegui il contenuto della migration.

### Verifica rapida
1. Tabelle create: `categories`, `products_catalog`, `product_aliases`.
2. Seed presente con categorie e prodotti iniziali.
3. Seed espanso con prodotti aggiuntivi (es. `cocco`, `ciliegia`, ecc.).
4. Seed latticini esteso (30+ prodotti, inclusi formaggi e yogurt specifici).
5. Seed latticini esteso con formaggi per tipo di latte (`formaggio di capra/pecora/mucca`).
6. Seed frutta esteso (20+ prodotti, inclusi frutti di bosco e `cocomero`).
7. Nuova categoria `Caffè, Tè, Infusi` con prodotti dedicati (caffè/tè/tisane/infusi e correlati).
8. Split categoria carne/pesce in tre categorie dedicate: `Carne`, `Pesce`, `Affettati`.
9. Nuova categoria `Pasta e Riso` con 30 prodotti dedicati.
10. Rimozione voce generica `Riso` dalla categoria `Dispensa` per evitare conflitti con `Pasta e Riso`.
11. Nuova categoria `Frutta secca` con prodotti dedicati.
12. Nuova categoria `Dolci` con 24 prodotti dedicati.
13. Aggiunta voce `Funghi` nella categoria `Verdura`.
14. Nuova categoria `Legumi` con 20 prodotti dedicati.
15. Aggiunta voce `Salsa di soia` nella categoria `Dispensa`.
16. Nuova categoria `Condimenti` con 36 prodotti dedicati.
17. Eventuali prodotti duplicati già presenti vengono riclassificati in `Condimenti` tramite upsert.
18. Aggiunte varianti olive (`olive verdi intere`, `olive verdi denocciolate`, `olive taggiasche`) in `Condimenti`.
19. Seed latticini integrato con nuove voci (mozzarella pizza, caprini specifici, formaggi a fette, grattugiati/cubetti).
20. Endpoint `GET /api/autocomplete?q=lat` restituisce suggerimenti pertinenti.
21. Aggiungendo un prodotto noto (es. `latte`) viene valorizzata la categoria su `shopping_items`.

## Step 10 - Security hardening + audit

File migration:
- `supabase/migrations/20260226201000_step10_security_audit.sql`

### Come applicarla
1. Apri Supabase Dashboard.
2. Vai su `SQL Editor`.
3. Esegui il contenuto della migration.

### Verifica rapida
1. Tabella `audit_logs` presente.
2. Inserimento eventi audit funzionante durante:
   - richiesta magic link invito
   - creazione/accettazione invito
   - add/toggle/delete item
3. RLS `audit_logs` attivo.
