# Architettura - Lista della Spesa

## Obiettivo
Applicazione web/PWA per gestione lista spesa condivisa in famiglia, con sincronizzazione realtime, login email/password e onboarding nuovi utenti tramite inviti monouso.

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
3. Dashboard `/app` valida sessione server-side.
4. Se non autenticato, redirect a `/login`.

### 2) Onboarding invito
1. Admin genera invito in dashboard.
2. Sistema salva solo `token_hash` (non token in chiaro), scadenza 24h.
3. Nuovo utente apre link invito, effettua autenticazione e conferma.
4. `acceptInviteAction` marca invito usato e crea membership `MEMBER`.

### 3) Lista spesa
1. Inserimento manuale o da suggerimento autocomplete (attivo da almeno 3 caratteri digitati).
2. Risoluzione catalogo:
   - match `product_id/category_id` da catalogo o alias
   - normalizzazione testo
3. Anti-duplicati:
   - se item uguale già `PENDING`: nessun duplicato
   - se uguale già `BOUGHT`: viene riattivato `PENDING`
4. UI mostra due sezioni: `Da comprare` e `Comprati`, entrambe raggruppate per categoria.
5. Menu `...` per item:
   - `Categoria`: assegnazione immediata (persistente su `shopping_items.category_id`)
   - `Elimina`
6. Toggle stato `Comprato/Compra` ottimistico lato client per feedback immediato.
7. Update realtime tramite subscription Supabase.

## Data model (attuale)
- `families`
- `profiles`
- `family_members`
- `shopping_items`
- `invites`
- `categories`
- `products_catalog`
- `product_aliases`

## Realtime
- Listener client su `shopping_items` filtrato per `family_id`.
- Ogni evento DB triggera `router.refresh()`.

## UX menu azioni item
- Menu renderizzato via portal su `document.body` per evitare problemi di stacking/z-index.
- Apertura dinamica sopra/sotto in base allo spazio disponibile in viewport.
- Chiusura automatica:
  - click/tap fuori menu
  - tasto `Esc`
  - apertura di un altro menu item

## PWA e cache
- Manifest e offline route presenti.
- Service Worker registrato in precedenza per cache shell.
- Attualmente registrazione SW disattivata (unregister forzato) per prevenire cache stale durante iterazioni UI/debug.

## Considerazioni su scalabilità
- Rate-limit attuale in-memory (istanza singola).
- In produzione multi-istanziazione: migrare rate-limit su Redis/Upstash.
- Con dataset catalogo più grande: introdurre indice trigram/full-text in Postgres.
