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

### Come applicarla
1. Apri Supabase Dashboard.
2. Vai su `SQL Editor`.
3. Esegui il contenuto della migration.

### Verifica rapida
1. Tabelle create: `categories`, `products_catalog`, `product_aliases`.
2. Seed presente con categorie e prodotti iniziali.
3. Seed espanso con prodotti aggiuntivi (es. `cocco`, `ciliegia`, ecc.).
4. Endpoint `GET /api/autocomplete?q=lat` restituisce suggerimenti pertinenti.
5. Aggiungendo un prodotto noto (es. `latte`) viene valorizzata la categoria su `shopping_items`.

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
