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
- Seed espanso con prodotti aggiuntivi (es. cocco/ciliegia e altri)
- Seed latticini esteso con 30+ prodotti validati (formaggi/yogurt/latte speciali)
- Seed latticini integrato con formaggi per tipologia latte (capra/pecora/mucca)
- Seed frutta esteso con 20+ prodotti validati (inclusi frutti di bosco e cocomero)
- Nuova categoria `Caffè, Tè, Infusi` con 29 prodotti validati (incluso `gocce di cioccolato`)
- Split categoria carne/pesce in tre categorie distinte: `Carne`, `Pesce`, `Affettati` con seed dedicati
- Nuova categoria `Pasta e Riso` con 30 prodotti validati
- Cleanup catalogo: rimossa voce generica `Riso` da `Dispensa` per evitare duplicazione semantica con `Pasta e Riso`
- Endpoint autocomplete fuzzy
- Auto-assegnazione categoria
- UI raggruppata per categoria
- No duplicati tra `Da comprare` e `Comprati`
- Menu azioni `...` per item:
  - Assegnazione categoria immediata e persistente su item
  - Eliminazione item
  - Apertura menu robusta (portal, chiusura click-outside/Esc, posizione dinamica)

## In corso / da fare

### Step 8 - Voce assistita
- Fuori scope per questa release (feature rimossa su richiesta prodotto).

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
6. Rimozione completa interfaccia/logica input vocale.
7. Aggiunto menu `...` con categoria persistente per item.
8. Fix azione `Elimina` dal menu `...` (submit affidabile anche con menu renderizzato via portal).
9. Toggle `Comprato/Compra` ottimistico lato client per ridurre latenza percepita sui bottoni.
10. Autocomplete UI limitato a input di almeno 3 caratteri per migliorare performance percepita.
11. Suggerimenti autocomplete estesi e ordinati per categoria -> prodotto in UI.
12. Suggerimenti prodotto con rientro visivo sotto il titolo categoria per leggibilità.
13. Restyling UI iOS-like con palette soft multisezione e gerarchia visiva migliorata:
    - pannello `Da comprare` con tema dedicato
    - pannello `Comprati` con tema dedicato
    - badge categoria più leggibili
    - contrasto item pending/bought più chiaro senza colori aggressivi
14. Tuning UI:
    - pannelli `Da comprare` e `Comprati` riportati a sfondo bianco
    - separazione visiva mantenuta via contorni colorati
    - badge categoria con verde più acceso
15. UX autocomplete:
    - dropdown suggerimenti chiuso automaticamente al click/tap fuori area input+suggerimenti
16. Compact layout tuning:
    - tipografia e controlli leggermente ridotti
    - spaziature verticali compattate per mostrare più contenuto
    - toni/gerarchie cromatiche mantenuti (pannelli pending/bought + badge categoria)

## Test minimi regressione (attuali)
1. Login email/password
2. Generazione invito admin
3. Accept invito (valido/scaduto/riusato)
4. Aggiunta prodotto manuale e da suggerimento
5. Toggle stato prodotto
6. Assenza duplicati cross-gruppo
7. Assegnazione categoria da menu `...` e persistenza dopo toggle stato
8. Sync realtime tra due sessioni
