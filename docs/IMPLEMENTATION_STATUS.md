# Stato Implementazione

## Completati

### Step 0 - Bootstrap
- Next.js + TypeScript + ESLint
- Script qualità (`lint`, `typecheck`)
- Build locale verificata

### Step 1 - Supabase base
- Config env + client/server/admin Supabase
- Health check DB: `/api/health/db`

### Step 2 - Schema base + RLS minima
- Tabelle: `families`, `profiles`, `family_members`
- Trigger `updated_at`
- Policy RLS base

### Step 3 - Auth magic link + ingresso famiglia
- Callback auth
- Pagina protetta `/app`
- Creazione famiglia primo accesso
- Logout
- Evoluzione: login principale migrato a email/password
- Flusso magic link mantenuto per onboarding via invito

### Step 4 - Lista spesa core
- Tabella `shopping_items`
- Aggiunta item
- Toggle `PENDING/BOUGHT`
- Persistenza dati

### Step 5 - Realtime multiutente
- Subscription su `shopping_items`
- Refresh automatico UI

### Step 6 - Inviti sicuri 24h
- Tabella `invites`
- Creazione inviti admin-only
- Accettazione monouso + scadenza
- Flusso onboarding via link invito

### Step 7 - Categorie + catalogo + autocomplete
- Tabelle `categories`, `products_catalog`, `product_aliases`
- Seed iniziale IT
- Endpoint autocomplete fuzzy
- Auto-assegnazione categoria
- UI raggruppata per categoria
- No duplicati tra `Da comprare` e `Comprati`

## In corso / da fare

### Step 8 - Voce assistita
- Pulsante microfono nel form aggiunta prodotto
- Trascrizione Web Speech API (it-IT)
- Conferma esplicita utente tramite click su `Aggiungi` (no autosave)
- Fallback tastiera in caso di browser non supportato o permessi negati

### Step 9 - Offline base + PWA
- Manifest PWA attivo
- Service worker implementato ma temporaneamente disattivato in runtime (unregister forzato) per eliminare cache stale durante debug/layout
- Pagina offline `/offline`
- Coda offline minima per aggiunta prodotti
- Sync automatico queue add al reconnect (`online`)

### Step 10 - Hardening sicurezza
- Audit log eventi critici (`audit_logs`) su item/invite/auth
- Security headers completi (CSP, HSTS, X-Frame-Options, ecc.)
- Validazione input server-side unificata (helper centralizzati)
- Rate-limit esteso a endpoint sensibili e azioni server principali
- Nota: rate-limit persistente distribuito ancora da fare (attuale in-memory)

### Step 11 - Deploy progressivo
- Preview environment
- Production environment
- Smoke test post deploy

## Aggiornamenti recenti (post-step incrementali)
1. Auth callback resa compatibile con formati Supabase multipli (`code`, `token_hash`, hash token).
2. Aggiunta pagina `/auth/confirm` per finalizzazione sessione.
3. Login `/login` convertito a email/password.
4. Endpoint `POST /api/auth/sync-profile` per allineamento profilo dopo autenticazione.
5. CSP aggiornata per websocket realtime sicuri.

## Test minimi regressione (attuali)
1. Login via invito
2. Generazione invito admin
3. Accept invito (valido/scaduto/riusato)
4. Aggiunta prodotto manuale e da suggerimento
5. Toggle stato prodotto
6. Assenza duplicati cross-gruppo
7. Sync realtime tra due sessioni
