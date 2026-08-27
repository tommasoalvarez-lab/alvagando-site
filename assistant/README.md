# Assistente Personale

App web (PWA) per tenere sotto controllo entrate/uscite, agenda con promemoria push
e piano alimentare giornaliero bilanciato. Pensata per un solo utente, interfaccia
mobile-first, installabile come app sul telefono.

Stack: **Next.js 16** (App Router) + **Supabase** (autenticazione + database Postgres)
+ **Tailwind CSS** + **Web Push** per le notifiche.

## 1. Crea il progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un nuovo progetto (gratuito).
2. Vai su **SQL Editor** e incolla il contenuto di [`supabase/migration.sql`](./supabase/migration.sql), poi eseguilo. Crea tutte le tabelle (profili, transazioni, eventi, piani alimentari, abbonamenti push) con le policy di sicurezza (RLS) che isolano i dati di ogni utente.
3. Vai su **Project Settings → API** e copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (tienila segreta, serve solo al server)
4. (Opzionale ma consigliato) Su **Authentication → Providers → Email**, se vuoi saltare la conferma email per uso personale, disattiva "Confirm email".

## 2. Genera le chiavi per le notifiche push (VAPID)

```bash
npx web-push generate-vapid-keys
```

Copia le due chiavi generate in `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY`.

## 3. Configura le variabili d'ambiente

Copia `.env.example` in `.env.local` e compila tutti i valori, incluso un
`CRON_SECRET` a piacere (una stringa casuale lunga, es. generata con
`openssl rand -hex 32`).

## 4. Avvia in locale

```bash
npm install
npm run dev
```

Apri http://localhost:3000, registrati con la tua email e password.

## 5. Deploy su Vercel

1. Collega questo repository (cartella `assistant/` come *Root Directory* del progetto Vercel).
2. Aggiungi tutte le variabili di `.env.local` nelle **Environment Variables** del progetto Vercel.
3. Deploy.

### Nota importante sui promemoria push

Il file `vercel.json` definisce un Cron Job che chiama `/api/push/send-reminders`
ogni 5 minuti per controllare gli impegni in scadenza e inviare le notifiche.

**Sul piano gratuito (Hobby) di Vercel i Cron Job possono girare al massimo una
volta al giorno.** Per avere promemoria puntuali (ogni 5 minuti) hai due opzioni:

- Passare al piano **Vercel Pro**, oppure
- Usare un servizio esterno gratuito come [cron-job.org](https://cron-job.org) che
  chiami ogni 5 minuti:
  `https://<tuo-dominio>/api/push/send-reminders`
  con l'header `Authorization: Bearer <CRON_SECRET>` (lo stesso valore impostato
  nelle variabili d'ambiente).

## 6. Installa l'app sul telefono

Apri il sito da Chrome/Safari sul telefono e scegli "Aggiungi a schermata Home"
(o l'icona di installazione nella barra degli indirizzi). Una volta installata,
vai in **Profilo → Impostazioni** e tocca "Attiva promemoria push" per ricevere
le notifiche degli impegni anche ad app chiusa.

## Struttura del progetto

```
src/app/login/              pagina di accesso/registrazione
src/app/(app)/               area autenticata (nav in basso)
  page.tsx                    dashboard riassuntiva
  finanze/                    entrate/uscite e riepilogo per categoria
  agenda/                     impegni con promemoria
  piano-alimentare/           piano pasti giornaliero generato
  impostazioni/               profilo, target calorico, notifiche
src/app/api/push/            API per iscrizione push e invio promemoria (cron)
src/lib/food-database.ts     alimenti e combinazioni pasto usati dal generatore
src/lib/meal-planner.ts      logica di generazione del piano bilanciato
supabase/migration.sql       schema database + sicurezza a livello di riga
```

## Personalizzare il piano alimentare

Il generatore (`src/lib/meal-planner.ts`) sceglie tra alcune combinazioni di
pasto già bilanciate (in `src/lib/food-database.ts`) e ne scala le quantità in
proporzione al tuo target calorico impostato in **Impostazioni**. Per
aggiungere altri alimenti o combinazioni, modifica quel file: ogni alimento ha
i valori nutrizionali per 100g, ogni combinazione pasto elenca gli ingredienti
con le grammature di riferimento per una dieta da 2000 kcal.
