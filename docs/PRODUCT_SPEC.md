# Product Spec - Lista della Spesa

Ultimo aggiornamento: 19 marzo 2026

## 1) Scopo del progetto
Applicazione web/PWA per gestire una lista della spesa condivisa tra membri della stessa famiglia, con aggiornamento realtime, uso semplice da mobile/desktop e gestione prodotti per categoria.

Obiettivo pratico:
- ridurre dimenticanze durante la spesa
- evitare duplicati nella lista
- avere una base catalogo prodotti riutilizzabile con suggerimenti rapidi
- raccogliere automaticamente un backlog dei prodotti mancanti dal catalogo per arricchimenti futuri

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
- Condivisione selettiva esterna della sola lista `Da comprare`
- Due stati item: `Da comprare` / `Comprati`
- Raggruppamento per categoria in entrambe le sezioni
- Autocomplete prodotti/categorie da catalogo
- Menu azioni item (`...`):
  - assegna categoria
  - rinomina
  - elimina
  - valori nutrizionali generici (se presenti)
  - livello nichel informativo (`Basso`/`Medio`/`Alto`/`Non disponibile`)
- Backlog automatico globale dei prodotti mancanti dal catalogo
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
3. Nei suggerimenti vede badge nichel informativo per ogni prodotto
4. Sceglie se inserire o meno in base al livello nichel
5. Aggiunge prodotto:
  - se gia presente in `Da comprare`, non duplica
  - se presente in `Comprati`, viene riattivato
  - se non esiste in catalogo, viene comunque aggiunto alla lista e registrato in backlog globale deduplicato
6. Durante la spesa usa `Comprato` per spostare item
7. In `Comprati` puo usare `Compra` per riportarlo in pending

### 4.4 Menu azioni item
Dal pulsante `...`:
- cambio categoria immediato
- rinomina condivisa (persistente su DB item)
- eliminazione item
- apertura pannello `Valori nutrizionali` (dati generici per 100g/100ml)
- visualizzazione livello nichel informativo nel menu item
- fallback chiaro: `Valori nutrizionali non disponibili`

### 4.5 Segnalazione "in spesa"
1. Utente in dashboard clicca `Sto facendo la spesa`
2. Tutti i familiari vedono un banner `In spesa ora: ...`
3. Più utenti possono risultare attivi contemporaneamente
4. Utente può chiudere con `Termina spesa`
5. La sessione viene chiusa automaticamente in logout
6. Sessioni oltre 60 minuti non vengono più mostrate come attive

### 4.6 Condivisione esterna lista da comprare
1. Utente apre `Condividi lista` dalla dashboard
2. Si apre modal con soli prodotti `Da comprare`
3. Tutti i prodotti sono preselezionati
4. Utente deseleziona quelli da escludere
5. Condivide testo via share sheet (mobile) o fallback copia (desktop/non supportato)
6. Testo inviato è raggruppato per categoria con prodotti rientrati visivamente

## 5) Requisiti funzionali
- Isolamento dati per famiglia (multi-tenant)
- Nessun accesso cross-family
- Realtime tra due o piu sessioni attive
- Ordinamento e leggibilita lista (categoria + nome)
- Suggerimenti coerenti da catalogo
- Segnalazione livello nichel nei suggerimenti e nel dettaglio item
- Registrazione automatica prodotti mancanti in backlog globale deduplicato
- Supporto uso da browser desktop e mobile (iPhone incluso via browser/PWA)
- Segnalazione presenza realtime a livello famiglia durante la spesa
- Condivisione esterna rapida senza creare account destinatario

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
- `catalog_product_requests`
- `product_nickel_levels`
- `audit_logs`

## 10) Stato attuale e gap aperti
Stato corrente:
- core applicativo completato e operativo in produzione
- catalogo alimenti esteso su categorie principali
- presenza `in spesa` attiva con banner realtime e timeout logico 60 minuti
- catalogo aggiornato anche con varianti cocco/farine (incluse farine base), kefir e prodotti casa per dispensa
- condivisione selettiva `Da comprare` disponibile su laptop e mobile
- valori nutrizionali generici disponibili su una prima ondata di circa 50 prodotti
- livello nichel informativo disponibile per prodotti alimentari catalogo (fallback `Non disponibile` su non alimentari/non classificati)
- backlog globale prodotti mancanti disponibile per consultazione via Codex/SQL

Gap / prossimi step:
- Step 9: rifinitura offline/PWA (riattivazione SW con strategia cache stabile)
- Step 10: rate-limit distribuito (Redis/Upstash) al posto dell'in-memory
- eventuali evoluzioni UX catalogo (workflow arricchimento guidato prodotti/categorie)
- completare ondate nutrizione: `Latticini` -> `Frutta` -> `Verdura`
- raffinare classificazione nichel generica con eventuali revisioni per prodotto
- eventuale UI admin dedicata per backlog catalogo (oggi consultazione solo via Codex/SQL)

## 11) Regola operativa catalogo alimentare
- Ogni nuova migration che aggiunge prodotti alimentari deve includere anche il seed in `product_nutrition_facts` nello stesso ciclo e2e (stessa migration o migration accodata immediata).
- Ogni nuova migration che aggiunge prodotti alimentari deve includere anche il seed in `product_nickel_levels` nello stesso ciclo e2e.
- Ogni nuovo prodotto catalogato che nasce da backlog deve chiudere la relativa richiesta in `catalog_product_requests` e riallineare gli `shopping_items` ancora presenti tramite `public.resolve_catalog_product_request(...)`.

## 12) Runbook rapido (ripartenza tra mesi)
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
   - condivisione selettiva `Da comprare` (share/copia)
   - realtime su due sessioni
8. Per backlog prodotti mancanti:
   - query backlog aperto ordinato per priorita
   - quando un prodotto viene aggiunto a catalogo, eseguire `select public.resolve_catalog_product_request('<product_id>'::uuid);`

## 13) Mappa documentazione collegata
- Setup + comandi: [README.md](../README.md)
- Architettura tecnica: [ARCHITECTURE.md](ARCHITECTURE.md)
- Sicurezza: [SECURITY.md](SECURITY.md)
- Stato implementazione step-by-step: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
- Migrazioni DB: [supabase/README.md](../supabase/README.md)
