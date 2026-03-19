# Architettura - Lista della Spesa

## Obiettivo
Applicazione web/PWA per gestione lista spesa condivisa in famiglia, con sincronizzazione realtime, login email/password e onboarding nuovi utenti tramite inviti monouso.
Include inoltre una presenza realtime `in spesa` per segnalare ai familiari quando qualcuno e' al supermercato.

## Stack
- Frontend: Next.js (App Router) + TypeScript
- Backend/API: Route handlers + Server Actions Next.js
- Database/Auth/Realtime: Supabase (Postgres + Auth + Realtime + RLS)
- Deploy target: Vercel + Supabase

## Struttura applicativa
- `src/app/`
  - `page.tsx`: landing
  - `login/page.tsx`: login email/password
  - `app/page.tsx`: dashboard protetta (lista + inviti admin)
  - `invite/[token]/page.tsx`: onboarding via invito
  - `auth/callback/route.ts`: callback compatibilità link Supabase
  - `auth/confirm/page.tsx`: finalizzazione sessione auth lato client
  - `api/`: endpoint applicativi
- `src/lib/`
  - `supabase/`: client browser/server/admin
  - `catalog/`: normalizzazione e risoluzione prodotto/categoria
  - `security/`: token + rate-limit
- `supabase/migrations/`: schema SQL versionato

## Flussi principali

### 1) Autenticazione
1. Membro esistente esegue login con email/password su `/login`.
2. Supabase Auth crea sessione cookie.
3. Guard client applica durata massima sessione di 30 giorni.
4. Dashboard `/app` valida sessione server-side.
5. Se non autenticato, redirect a `/login`.

### 2) Onboarding invito
1. Admin genera invito in dashboard.
2. Sistema salva solo `token_hash` (non token in chiaro), scadenza 24h.
3. Nuovo utente apre link invito, effettua autenticazione e conferma.
4. `acceptInviteAction` marca invito usato e crea membership `MEMBER`.
5. Redirect forzato su `/login/reset?required=1&next=/app` per impostazione password obbligatoria.

### 2-bis) Reset password
1. Utente apre `/login/reset-request` e invia email.
2. Supabase invia link recovery verso `/auth/confirm?next=/login/reset`.
3. In `/login/reset` imposta nuova password + conferma.
4. Se il reset è richiesto dopo invito (`required=1`), il redirect finale va su `/app`.

### 3) Lista spesa
1. Inserimento manuale o da suggerimento autocomplete (attivo da almeno 3 caratteri digitati, lista estesa ordinata per categoria/prodotto).
2. Risoluzione catalogo:
   - match `product_id/category_id` da catalogo o alias
   - normalizzazione testo
3. Anti-duplicati:
   - se item uguale già `PENDING`: nessun duplicato
   - se uguale già `BOUGHT`: viene riattivato `PENDING`
4. Se il prodotto non esiste nel catalogo (`product_id = null`), il sistema registra anche una richiesta backlog globale in `catalog_product_requests`.
5. UI mostra due sezioni: `Da comprare` e `Comprati`, entrambe raggruppate per categoria.
6. Menu `...` per item:
   - `Categoria`: assegnazione immediata (persistente su `shopping_items.category_id`)
   - `Rinomina`: update condiviso del campo `shopping_items.text`
   - `Elimina`
   - `Valori nutrizionali`: pannello informativo con dati generici per 100g/100ml (fallback se assenti)
   - `Livello nichel`: indicatore informativo (`Basso`/`Medio`/`Alto`/`Non disponibile`)
7. Toggle stato `Comprato/Compra` ottimistico lato client per feedback immediato.
8. Update realtime tramite subscription Supabase.

### 4) Presenza "in spesa"
1. Utente attiva `Sto facendo la spesa` dalla dashboard.
2. Server Action crea sessione in `shopping_presence_sessions`.
3. Tutti i membri vedono banner realtime con i nomi attivi.
4. Utente puo' terminare manualmente con `Termina spesa`.
5. Su logout, eventuale sessione attiva viene chiusa automaticamente.
6. Sessioni senza `ended_at` oltre 60 minuti non sono considerate attive in UI.

## Data model (attuale)
- `families`
- `profiles`
- `family_members`
- `shopping_items`
- `shopping_presence_sessions`
- `invites`
- `categories`
- `products_catalog`
- `product_aliases`
- `catalog_product_requests`
- `product_nutrition_facts`
- `product_nickel_levels`

## Data flow nutrizione
1. `AppPage` recupera gli item della famiglia.
2. Estrae i `product_id` presenti negli item renderizzati.
3. Query server-side su `product_nutrition_facts` filtrata per i `product_id` correnti.
4. Costruisce mappa `product_id -> nutrition facts`.
5. Passa la fact al singolo `ItemActionsMenu`, che espone azione `Valori nutrizionali`.

## Data flow nichel
1. Endpoint `/api/autocomplete` recupera classificazione nichel per i prodotti suggeriti.
2. Ogni suggestion include `nickelLevel` (`LOW|MEDIUM|HIGH|UNKNOWN`) e mostra badge in UI.
3. `AppPage` recupera classificazione nichel per i `product_id` presenti negli item lista.
4. La mappa `product_id -> nickelLevel` viene passata a `ItemActionsMenu`.
5. Il menu `...` mostra il livello nichel in modo informativo, senza bloccare azioni utente.

## Data flow backlog prodotti mancanti
1. Inserimento item da API o Server Action.
2. Risoluzione catalogo tramite `resolveCatalogMatchByText` / `resolveCatalogMatchByProductId`.
3. Se il prodotto resta senza `product_id`, l'app chiama `public.register_catalog_product_request(normalized_text, raw_text)`.
4. La tabella backlog mantiene una sola riga per `normalized_text` e aggiorna contatore e timestamp.
5. Quando un prodotto viene poi aggiunto a `products_catalog`, la migration/admin flow deve eseguire `public.resolve_catalog_product_request(product_id)`:
   - backlog `OPEN` -> `ADDED`
   - valorizzazione `added_product_id`
   - backfill di `shopping_items` esistenti con stesso `normalized_text`

## Realtime
- Listener client su `shopping_items` filtrato per `family_id`.
- Listener client su `shopping_presence_sessions` filtrato per `family_id`.
- Ogni evento DB triggera `router.refresh()`.
- Se ci sono sessioni presenza attive, refresh periodico ogni 60s per applicare timeout logico senza job server.

## UX menu azioni item
- Menu renderizzato via portal su `document.body` per evitare problemi di stacking/z-index.
- Apertura dinamica sopra/sotto in base allo spazio disponibile in viewport.
- Chiusura automatica:
  - click/tap fuori menu
  - tasto `Esc`
  - apertura di un altro menu item

## UX e Design System
- Tema visivo iOS-like con palette soft su base neutra.
- Densità UI ottimizzata (compact): testo e controlli leggermente ridotti per aumentare i contenuti visibili a schermo.
- Gerarchia cromatica:
  - `Da comprare` e `Comprati` hanno pannelli con tonalità diverse ma armoniche.
  - Categorie evidenziate tramite badge dedicati.
  - Righe item pending/bought con differenze di contrasto coerenti.
- Autocomplete:
  - attivo da 3 caratteri
  - lista suggerimenti raggruppata e ordinata per categoria -> prodotto
  - lieve rientro elementi prodotto per migliorare scansione visiva
  - chiusura automatica dei suggerimenti con click/tap fuori dall'area input+suggerimenti

## Policy Password
- Minimo 10 caratteri.
- Almeno una lettera maiuscola, una minuscola e un numero.
- Nessun carattere speciale obbligatorio.
- Blocco password deboli (blacklist) e password che contengono parti dell'email utente.

## PWA e cache
- Manifest e offline route presenti.
- Service Worker registrato in precedenza per cache shell.
- Attualmente registrazione SW disattivata (unregister forzato) per prevenire cache stale durante iterazioni UI/debug.

## Considerazioni su scalabilità
- Rate-limit attuale in-memory (istanza singola).
- In produzione multi-istanziazione: migrare rate-limit su Redis/Upstash.
- Con dataset catalogo più grande: introdurre indice trigram/full-text in Postgres.
- Con backlog catalogo più ampio: possibile evoluzione futura con UI admin dedicata e filtri per priorità/stato.
