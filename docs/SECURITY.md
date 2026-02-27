# Sicurezza

## Principi applicati
- Segreti fuori da git (`.env*` ignorati)
- `service_role` usata solo server-side
- Accesso dati governato da RLS Supabase
- Onboarding tramite inviti monouso con scadenza
- Login utenti esistenti con email/password
- Reset password con flusso recovery via email
- Rate-limit su endpoint auth sensibili
- Sessione applicativa massima: 30 giorni

## Policy password
- Minimo 10 caratteri.
- Obbligo di almeno: maiuscola, minuscola, numero.
- Nessun carattere speciale obbligatorio.
- Blocco password deboli (blacklist).
- Blocco password contenenti parti dell'email utente.

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
- `audit_logs`: select solo membri della stessa famiglia

## Inviti
- Token random (`base64url`) generato server-side
- Persistito solo hash SHA-256 in DB
- Validità 24 ore
- Monouso (`used_at` + `used_by`)
- Accept atomico con verifica:
  - token valido
  - non scaduto
  - non usato

## Anti-flood auth
- Endpoint server sensibili:
  - `/api/auth/request-magic-link` (flow invito/legacy)
  - endpoint/login action correnti via email/password
  - endpoint recovery/reset password Supabase
- Controlli:
  - payload valido
  - invito esistente/valido (quando presente token)
  - rate-limit per combinazioni `IP+token` e `IP+email`

Nota:
- rate-limit attuale è in-memory, quindi locale/singola istanza.
- Da completare in fase hardening: backend condiviso (Redis/Upstash).

## Audit log
Eventi tracciati (principali):
- `MAGIC_LINK_REQUEST`
- `PASSWORD_LOGIN`
- `INVITE_CREATE`
- `INVITE_ACCEPT`
- `ITEM_ADD`
- `ITEM_ADD_DEDUP`
- `ITEM_REACTIVATE`
- `ITEM_TOGGLE`
- `ITEM_CATEGORY_SET`
- `ITEM_DELETE`

Tabella: `audit_logs` con metadata JSON, timestamp e contesto famiglia/attore.

## Security headers
Header globali impostati in `next.config.ts`:
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

Nota CSP:
- `connect-src` include `wss://*.supabase.co` per realtime.
- In development sono consentiti anche `ws://localhost:*` e `ws://127.0.0.1:*`.

## Azioni raccomandate periodiche
1. Ruotare `service_role` in caso di esposizione.
2. Monitorare uso endpoint auth.
3. Verificare periodicamente policy RLS dopo nuove migration.
