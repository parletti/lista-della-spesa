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

## Step 5 - Presenza realtime "in spesa"

File migration:
- `supabase/migrations/20260301103000_step5_shopping_presence_sessions.sql`

### Come applicarla
1. Apri Supabase Dashboard.
2. Vai su `SQL Editor`.
3. Esegui il contenuto della migration.

### Verifica rapida
1. La tabella `shopping_presence_sessions` esiste.
2. RLS è attivo su `shopping_presence_sessions`.
3. Un membro famiglia vede solo sessioni presenza della propria famiglia.
4. Un membro può inserire/chiudere solo le proprie sessioni presenza.

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
- `supabase/migrations/20260301100500_step7_catalog_carne_add_fegato_vitello.sql`
- `supabase/migrations/20260302100000_step7_catalog_add_cocco_kefir_flours.sql`
- `supabase/migrations/20260302102000_step7_catalog_add_flours_base.sql`
- `supabase/migrations/20260302104000_step7_catalog_add_home_supplies.sql`
- `supabase/migrations/20260303120000_step7_product_nutrition_facts.sql`
- `supabase/migrations/20260303121000_step7_product_nutrition_facts_seed_wave1.sql`
- `supabase/migrations/20260304100000_step7_product_nutrition_facts_seed_wave2.sql`
- `supabase/migrations/20260304113000_step7_product_nutrition_facts_seed_wave3.sql`
- `supabase/migrations/20260304123000_step7_product_nutrition_facts_seed_wave4_all_remaining_food.sql`
- `supabase/migrations/20260310110000_step7_product_nickel_levels.sql`
- `supabase/migrations/20260310111000_step7_product_nickel_levels_seed_v1.sql`
- `supabase/migrations/20260319113000_step7_catalog_product_requests.sql`
- `supabase/migrations/20260319120000_step7_catalog_add_formaggio_cremoso_tipo_philadelfia.sql`
- `supabase/migrations/20260319123000_step7_catalog_remove_unused_carne_pesce.sql`

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
16. Nuova categoria `Condimenti` con 37 prodotti dedicati.
17. Eventuali prodotti duplicati già presenti vengono riclassificati in `Condimenti` tramite upsert.
18. Aggiunte varianti olive (`olive verdi intere`, `olive verdi denocciolate`, `olive taggiasche`) in `Condimenti`.
19. Aggiunta voce `Fegato di vitello` nella categoria `Carne`.
20. Aggiunte nuove voci: `olio di cocco` (Condimenti), `farina di cocco` e `farina di mandorle` (Dispensa), `kefir` e `kefir di capra` (Latticini).
21. Aggiunte nuove voci base farine in `Dispensa`: `farina`, `farina di farro`, `farina di riso`.
22. Aggiunte nuove voci prodotti casa in `Dispensa`: `carta da forno`, `pellicola trasparente`, `pellicola alluminio`, `spugne lavello`, `pastiglie lavastoviglie`, `sale lavastoviglie`, `ammorbidente`.
23. Seed latticini integrato con nuove voci (mozzarella pizza, caprini specifici, formaggi a fette, grattugiati/cubetti).
24. Endpoint `GET /api/autocomplete?q=lat` restituisce suggerimenti pertinenti.
25. Aggiungendo un prodotto noto (es. `latte`) viene valorizzata la categoria su `shopping_items`.
26. Nuova tabella `product_nutrition_facts` creata con RLS (select authenticated, write client disabilitata).
27. Seed iniziale nutrizione (onda 1) applicato su ~50 prodotti base/top.
28. Seed nutrizione onda 2 applicato su ulteriori 50 alimenti del catalogo.
29. Seed nutrizione onda 3 applicato su ulteriori 50 alimenti del catalogo.
30. Seed nutrizione onda 4 applicato su tutti i 187 prodotti rimanenti fuori categoria `Igiene e Casa`.
31. Nuova tabella `product_nickel_levels` creata con RLS (select authenticated, write client disabilitata).
32. Seed nichel v1 applicato su catalogo alimentare con fallback `UNKNOWN` su non alimentari/non classificati.
33. Nuova tabella `catalog_product_requests` creata per backlog globale prodotti mancanti dal catalogo.
34. Ogni inserimento testo libero non catalogato puo' aggiornare il backlog tramite `public.register_catalog_product_request(...)`.
35. Quando un prodotto viene aggiunto al catalogo, `public.resolve_catalog_product_request(product_id)` chiude il backlog e riallinea gli `shopping_items` esistenti.
36. Aggiunta voce `Formaggio cremoso tipo Philadelfia` in `Latticini` con valori nutrizionali generici e nichel `LOW`, piu' chiusura backlog correlato.
37. Rimossa la categoria storica `Carne e Pesce` se non piu' referenziata da catalogo o shopping items.

### Regola operativa nutrizione
Per ogni nuova migration che aggiunge prodotti alimentari in catalogo, includere anche i corrispondenti record in `product_nutrition_facts` nello stesso ciclo e2e.

### Regola operativa nichel
Per ogni nuova migration che aggiunge prodotti alimentari in catalogo, includere anche i corrispondenti record in `product_nickel_levels` nello stesso ciclo e2e.

### Regola operativa backlog prodotti mancanti
Quando aggiungi manualmente un nuovo prodotto a `products_catalog` che era stato inserito prima come testo libero:
1. inserisci/aggiorna il prodotto nel catalogo;
2. esegui:

```sql
select public.resolve_catalog_product_request('<product_id>'::uuid);
```

3. verifica backlog aperto:

```sql
select
  normalized_text,
  raw_text_last_seen,
  request_count,
  first_seen_at,
  last_seen_at
from public.catalog_product_requests
where status = 'OPEN'
order by request_count desc, last_seen_at desc;
```

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
