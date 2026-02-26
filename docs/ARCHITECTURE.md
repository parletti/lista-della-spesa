# Architettura - Lista della Spesa

## Obiettivo
Applicazione web/PWA per gestione lista spesa condivisa in famiglia, con sincronizzazione realtime e onboarding tramite inviti monouso.

## Stack
- Frontend: Next.js (App Router) + TypeScript
- Backend/API: Route handlers + Server Actions Next.js
- Database/Auth/Realtime: Supabase (Postgres + Auth + Realtime + RLS)
- Deploy target: Vercel + Supabase

## Struttura applicativa
- `src/app/`
  - `page.tsx`: landing
  - `login/page.tsx`: pagina informativa (no form pubblico)
  - `app/page.tsx`: dashboard protetta (lista + inviti admin)
  - `invite/[token]/page.tsx`: onboarding via invito
  - `auth/callback/route.ts`: callback magic link
  - `api/`: endpoint applicativi
- `src/lib/`
  - `supabase/`: client browser/server/admin
  - `catalog/`: normalizzazione e risoluzione prodotto/categoria
  - `security/`: token + rate-limit
- `supabase/migrations/`: schema SQL versionato

## Flussi principali

### 1) Autenticazione
1. Utente apre link invito `/invite/[token]`.
2. Se non autenticato, inserisce email nel form invito.
3. Endpoint server `/api/auth/request-magic-link` valida invito e applica rate-limit.
4. Supabase invia magic link, callback su `/auth/callback`.
5. Callback crea/aggiorna `profiles` e reindirizza al percorso richiesto.

### 2) Onboarding invito
1. Admin genera invito in dashboard.
2. Sistema salva solo `token_hash` (non token in chiaro), scadenza 24h.
3. Utente autenticato conferma invito.
4. `acceptInviteAction` marca invito usato e crea membership `MEMBER`.

### 3) Lista spesa
1. Inserimento manuale o da suggerimento autocomplete.
2. Risoluzione catalogo:
   - match `product_id/category_id` da catalogo o alias
   - normalizzazione testo
3. Anti-duplicati:
   - se item uguale già `PENDING`: nessun duplicato
   - se uguale già `BOUGHT`: viene riattivato `PENDING`
4. UI mostra due sezioni: `Da comprare` e `Comprati`, entrambe raggruppate per categoria.
5. Update realtime tramite subscription Supabase.

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

## Considerazioni su scalabilità
- Rate-limit attuale in-memory (istanza singola).
- In produzione multi-istanziazione: migrare rate-limit su Redis/Upstash.
- Con dataset catalogo più grande: introdurre indice trigram/full-text in Postgres.
