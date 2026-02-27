# Lista della Spesa

App web (Next.js + Supabase) per lista spesa condivisa famigliare con:
- accesso via email/password (membri esistenti)
- onboarding nuovi utenti via inviti monouso
- sincronizzazione realtime
- autocomplete prodotti/categorie
- raggruppamento prodotti per categoria
- menu azioni item (`...`) con assegnazione categoria persistente
- PWA installabile con supporto offline base

## Requisiti
- Node.js >= 20
- npm >= 10
- progetto Supabase attivo

## Setup rapido
1. Installa dipendenze:

```bash
npm install
```

2. Crea `.env.local` da `.env.example`:

```bash
cp .env.example .env.local
```

3. Compila variabili:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

4. Configura Supabase Auth:
- `Authentication` -> `URL Configuration`
- `Site URL`: `http://127.0.0.1:3000`
- `Redirect URL`: `http://127.0.0.1:3000/auth/confirm`

5. Avvia in locale:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## Database migration (manuale via SQL Editor)
Esegui in ordine i file in `supabase/migrations/`:
1. `20260226173000_step2_base_schema_rls.sql`
2. `20260226180000_step4_shopping_items.sql`
3. `20260226191000_step6_invites.sql`
4. `20260226195000_step7_catalog_autocomplete.sql`
5. `20260226232051_step7_catalog_expand_foods.sql`
6. `20260227082223_step7_catalog_latticini_expand.sql`
7. `20260227083735_step7_catalog_latticini_formaggi_milk_type.sql`

## Comandi utili
```bash
npm run lint
npm run typecheck
npm run build
```

Health check DB:
```bash
curl http://127.0.0.1:3000/api/health/db
```

Autocomplete test:
```bash
curl "http://127.0.0.1:3000/api/autocomplete?q=lat"
```

## PWA/Offline
- Manifest disponibile su `/manifest.webmanifest`
- Service worker: `public/sw.js`
- Pagina fallback offline: `/offline`
- Queue offline minima: aggiunta prodotti accodata e sincronizzata quando torna la connessione
- Nota: registrazione service worker temporaneamente disattivata in runtime per evitare cache stale durante debug UI.

## Flusso utente
1. Admin crea famiglia.
2. Utente esistente accede da `/login` con email/password.
3. Admin genera invito (valido 24h, monouso) per nuovi membri.
4. Nuovo utente apre link invito e completa onboarding.
5. Membri aggiungono/spuntano prodotti in realtime.
6. Da menu `...`, i membri possono assegnare/modificare la categoria di un item (persistente su DB item).

## Sicurezza (attuale)
- Login principale con email/password.
- Creazione nuovi utenti vincolata a invito.
- Token invito salvato hashato (mai in chiaro).
- RLS attiva sulle tabelle family-scoped.
- Rate-limit endpoint auth sensibili (`IP+token` e `IP+email`).
- `SUPABASE_SERVICE_ROLE_KEY` usata solo server-side.

## Note operative recenti
- Callback auth robusta per diversi formati link Supabase (`code`, `token_hash`, hash token).
- Pagina `/auth/confirm` dedicata al completamento sessione.
- Service Worker temporaneamente disattivato per evitare UI stale da cache durante sviluppo/debug.
- Toggle `Comprato/Compra` ottimizzato lato UI con comportamento ottimistico (feedback immediato).

## Documentazione completa
- Architettura: [docs/ARCHITECTURE.md](/Users/parletti/chagpt%20codex%20progetti/Lista%20della%20Spesa/docs/ARCHITECTURE.md)
- Sicurezza: [docs/SECURITY.md](/Users/parletti/chagpt%20codex%20progetti/Lista%20della%20Spesa/docs/SECURITY.md)
- Stato implementazione: [docs/IMPLEMENTATION_STATUS.md](/Users/parletti/chagpt%20codex%20progetti/Lista%20della%20Spesa/docs/IMPLEMENTATION_STATUS.md)
- Note migration Supabase: [supabase/README.md](/Users/parletti/chagpt%20codex%20progetti/Lista%20della%20Spesa/supabase/README.md)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
