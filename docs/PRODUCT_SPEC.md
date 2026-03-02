# Product Spec - Lista della Spesa

Ultimo aggiornamento: 2 marzo 2026

## 1) Scopo del progetto
Applicazione web/PWA per gestire una lista della spesa condivisa tra membri della stessa famiglia, con aggiornamento realtime, uso semplice da mobile/desktop e gestione prodotti per categoria.

Obiettivo pratico:
- ridurre dimenticanze durante la spesa
- evitare duplicati nella lista
- avere una base catalogo prodotti riutilizzabile con suggerimenti rapidi

## 2) Utenti e ruoli
- `ADMIN` famiglia
  - crea famiglia
  - genera inviti monouso per nuovi membri
- `MEMBER`
  - usa la lista condivisa (aggiunta/toggle/rinomina/categoria/elimina item)

## 3) Funzionalita principali (MVP esteso attuale)
- Login email/password per utenti esistenti
- Inviti sicuri 24h monouso per onboarding nuovi utenti
- Impostazione password obbligatoria dopo accettazione invito
- Reset password via email
- Lista spesa condivisa in realtime
- Presenza realtime `in spesa` condivisa in famiglia (start/stop manuale)
- Due stati item: `Da comprare` / `Comprati`
- Raggruppamento per categoria in entrambe le sezioni
- Autocomplete prodotti/categorie da catalogo
- Menu azioni item (`...`):
  - assegna categoria
  - rinomina
  - elimina
- Anti-duplicati tra pending/bought
- UI ottimizzata mobile-first in stile iOS-like
- PWA con manifest + base offline (service worker attualmente disattivato in runtime)

## 4) Flussi utente

### 4.1 Accesso utente esistente
1. Utente apre `/login`
2. Inserisce email + password
3. Se credenziali valide entra in `/app`

### 4.2 Onboarding nuovo utente via invito
1. Admin genera link invito in `/app`
2. Nuovo utente apre link invito
3. Completa autenticazione e accetta invito
4. Viene forzato a impostare password (`/login/reset?required=1&next=/app`)
5. Accesso finale alla dashboard

### 4.3 Gestione lista
1. Utente digita prodotto nel campo aggiunta
2. Da 3 caratteri in poi vede suggerimenti per categoria/prodotto
3. Aggiunge prodotto:
  - se gia presente in `Da comprare`, non duplica
  - se presente in `Comprati`, viene riattivato
4. Durante la spesa usa `Comprato` per spostare item
5. In `Comprati` puo usare `Compra` per riportarlo in pending

### 4.4 Menu azioni item
Dal pulsante `...`:
- cambio categoria immediato
- rinomina condivisa (persistente su DB item)
- eliminazione item

### 4.5 Segnalazione "in spesa"
1. Utente in dashboard clicca `Sto facendo la spesa`
2. Tutti i familiari vedono un banner `In spesa ora: ...`
3. Più utenti possono risultare attivi contemporaneamente
4. Utente può chiudere con `Termina spesa`
5. La sessione viene chiusa automaticamente in logout
6. Sessioni oltre 60 minuti non vengono più mostrate come attive

## 5) Requisiti funzionali
- Isolamento dati per famiglia (multi-tenant)
- Nessun accesso cross-family
- Realtime tra due o piu sessioni attive
- Ordinamento e leggibilita lista (categoria + nome)
- Suggerimenti coerenti da catalogo
- Supporto uso da browser desktop e mobile (iPhone incluso via browser/PWA)
- Segnalazione presenza realtime a livello famiglia durante la spesa

## 6) Requisiti non funzionali
- Sicurezza credenziali e sessioni
- Buona reattivita UI (toggle ottimistico)
- Deploy continuo su Vercel
- Configurazione semplice per ripartenza progetto

## 7) Sicurezza e policy
- Password policy:
  - minimo 10 caratteri
  - almeno 1 maiuscola, 1 minuscola, 1 numero
  - blacklist password deboli
- Sessione massima 30 giorni (logout forzato oltre soglia)
- RLS Supabase su tabelle famiglia
- Inviti con token hashato, scadenza 24h, monouso
- `SUPABASE_SERVICE_ROLE_KEY` solo server-side
- Header sicurezza HTTP attivi (CSP, HSTS, ecc.)

## 8) Stack tecnico
- Next.js 16 + TypeScript
- Supabase (Postgres/Auth/Realtime)
- Vercel (deploy)
- GitHub (repository e versionamento)

## 9) Modello dati (alto livello)
- `families`, `profiles`, `family_members`
- `shopping_items`
- `shopping_presence_sessions`
- `invites`
- `categories`, `products_catalog`, `product_aliases`
- `audit_logs`

## 10) Stato attuale e gap aperti
Stato corrente:
- core applicativo completato e operativo in produzione
- catalogo alimenti esteso su categorie principali
- presenza `in spesa` attiva con banner realtime e timeout logico 60 minuti
- catalogo aggiornato anche con varianti cocco/farine e kefir

Gap / prossimi step:
- Step 9: rifinitura offline/PWA (riattivazione SW con strategia cache stabile)
- Step 10: rate-limit distribuito (Redis/Upstash) al posto dell'in-memory
- eventuali evoluzioni UX catalogo (workflow arricchimento guidato prodotti/categorie)

## 11) Runbook rapido (ripartenza tra mesi)
1. Leggere questo file (`docs/PRODUCT_SPEC.md`)
2. Verificare stato avanzamento in `docs/IMPLEMENTATION_STATUS.md`
3. Verificare sicurezza in `docs/SECURITY.md`
4. Verificare architettura in `docs/ARCHITECTURE.md`
5. Verificare setup e migration in `README.md` e `supabase/README.md`
6. Controllare env Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
7. Eseguire smoke test:
   - login
   - add item
   - toggle comprato/compra
   - attivazione/disattivazione stato `in spesa`
   - realtime su due sessioni

## 12) Mappa documentazione collegata
- Setup + comandi: [README.md](../README.md)
- Architettura tecnica: [ARCHITECTURE.md](ARCHITECTURE.md)
- Sicurezza: [SECURITY.md](SECURITY.md)
- Stato implementazione step-by-step: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
- Migrazioni DB: [supabase/README.md](../supabase/README.md)
