# Sicurezza

## Principi applicati
- Segreti fuori da git (`.env*` ignorati)
- `service_role` usata solo server-side
- Accesso dati governato da RLS Supabase
- Onboarding tramite inviti monouso con scadenza
- Login pubblico disabilitato (solo invito)
- Rate-limit sul flusso richiesta magic link

## Gestione credenziali
- File locale: `.env.local`
- Variabili:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (solo backend)
- In produzione:
  - Vercel Environment Variables
  - mai esporre la `service_role` nel client

## RLS
Policy implementate per:
- `families`: select solo membri della famiglia
- `profiles`: accesso al solo profilo proprio
- `family_members`: select limitato alla famiglia dell'utente
- `shopping_items`: select/insert/update solo nella propria famiglia
- `invites`: select membri famiglia, insert/update solo admin famiglia
- `categories/products_catalog/product_aliases`: select authenticated

## Inviti
- Token random (`base64url`) generato server-side
- Persistito solo hash SHA-256 in DB
- Validità 24 ore
- Monouso (`used_at` + `used_by`)
- Accept atomico con verifica:
  - token valido
  - non scaduto
  - non usato

## Anti-flood magic link
- Endpoint server: `/api/auth/request-magic-link`
- Controlli:
  - payload valido (`email`, `token`)
  - invito esistente/valido
  - rate-limit `5 req / 10 min` per `IP+token`

Nota:
- rate-limit attuale è in-memory, quindi locale/singola istanza.
- Da completare in fase hardening: backend condiviso (Redis/Upstash).

## Azioni raccomandate periodiche
1. Ruotare `service_role` in caso di esposizione.
2. Monitorare uso endpoint auth.
3. Verificare periodicamente policy RLS dopo nuove migration.
