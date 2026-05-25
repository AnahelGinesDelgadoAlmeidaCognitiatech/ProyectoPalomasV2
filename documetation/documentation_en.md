# Technical Documentation — Proyecto Palomas V2

**Version:** 2.0  
**Repository:** https://github.com/AnahelGinesDelgadoAlmeidaCognitiatech/ProyectoPalomasV2  
**Date:** May 2026

---

## 1. Overview

**Proyecto Palomas V2** is a Progressive Web App (PWA) for the comprehensive management of racing pigeon lofts. It allows users to register pigeons, breeding seasons, mated pairs, racing events, veterinary treatments and contacts, with full offline support and bidirectional cloud synchronisation.

The application targets both mobile and desktop devices, with AI-powered voice dictation support to speed up data entry at the loft.

---

## 2. Technologies Used

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI framework |
| TypeScript | 5.8 | Static typing |
| Vite | 5.4 | Bundler and dev server |
| React Router DOM | 6.30 | SPA routing |
| Tailwind CSS | 3.4 | Utility-first styling |
| shadcn/ui + Radix UI | — | Accessible UI components |
| Lucide React | 0.462 | Icon library |
| Recharts | 2.15 | Charts and statistics |
| React Hook Form + Zod | 7.61 / 3.25 | Forms and validation |
| date-fns | 3.6 | Date manipulation |
| next-themes | 0.3 | Light/dark theme support |

### Internationalisation

| Technology | Version | Purpose |
|---|---|---|
| i18next | 26.0 | Translation engine |
| react-i18next | 17.0 | React integration |

Supported languages: **Spanish**, **English**, **Portuguese**.

### Local Database (Offline)

| Technology | Version | Purpose |
|---|---|---|
| Dexie.js | 4.4 | IndexedDB wrapper for local storage |
| dexie-react-hooks | 4.4 | Reactive hooks for local queries |

### Backend and Synchronisation

| Technology | Version | Purpose |
|---|---|---|
| Supabase | 2.105 | Cloud PostgreSQL database, Auth and Storage |
| Supabase Edge Functions | — | Serverless functions running on Deno |
| TanStack Query | 5.83 | Server state cache and management |

### Artificial Intelligence and Voice

| Technology | Version | Purpose |
|---|---|---|
| @huggingface/transformers | 4.2 | Whisper-tiny ONNX — local WASM speech-to-text |
| Web Speech API | Native | Speech-to-text on iOS Safari (Siri engine) |
| Gemini Flash (Lovable AI Gateway) | — | Structured field extraction from dictation |
| vite-plugin-mkcert | 2.0 | Local HTTPS for microphone access in dev |

### Testing

| Technology | Version | Purpose |
|---|---|---|
| Vitest | 3.2 | Unit testing framework |
| Testing Library | 16.0 | React component testing |
| jsdom | 20.0 | DOM simulation in tests |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                   │
│                                                      │
│  ┌─────────────┐    ┌──────────────────────────┐    │
│  │  React UI   │    │   Web Worker (Whisper)   │    │
│  │  (shadcn)   │    │   WASM / WebGPU          │    │
│  └──────┬──────┘    └──────────────────────────┘    │
│         │                                            │
│  ┌──────▼──────────────────────────────────────┐    │
│  │              Dexie (IndexedDB)               │    │
│  │  Local offline-first storage                 │    │
│  │  syncQueue → drainSyncQueue → Supabase       │    │
│  │  startAutoSync / stopAutoSync (30 s)         │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│                    SUPABASE                          │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ PostgreSQL  │  │     Auth     │  │  Storage   │  │
│  │   + RLS     │  │   (users)    │  │  (photos)  │  │
│  └─────────────┘  └──────────────┘  └────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │        Edge Function: parse-pigeon            │   │
│  │  Deno → Gemini Flash → structured fields      │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. The user interacts with the React UI.
2. Data is saved immediately to **Dexie (IndexedDB)** — the app works fully offline.
3. Every operation is queued in the **syncQueue** Dexie table.
4. On login, `AuthContext` calls `pullFromSupabase()` to download cloud data, then `startAutoSync()`.
5. `startAutoSync` drains the queue every **30 seconds** and listens for the `online` event to sync on reconnection.
6. On sign-out, `stopAutoSync()` stops the timer and removes the listener.
7. Supabase enforces **RLS** policies ensuring each user only accesses their own data.

---

## 4. Project Structure

```
ProyectoPalomasV2/
├── public/
│   └── _headers              # COOP/COEP headers for Whisper WASM
├── src/
│   ├── components/           # Reusable components
│   │   ├── AuthGuard.tsx     # Route protection for authenticated users
│   │   ├── ErrorBoundary.tsx # React error boundary
│   │   ├── ImageUpload.tsx   # Image upload to Supabase Storage
│   │   ├── LocationPicker.tsx # GPS coordinate picker
│   │   ├── PedigreeTree.tsx  # Visual family tree
│   │   ├── VoiceInput.tsx    # Voice dictation button
│   │   └── ui/               # shadcn/ui components
│   ├── contexts/
│   │   └── AuthContext.tsx   # Authentication context + sync lifecycle
│   ├── hooks/
│   │   ├── useAudioRecorder.ts        # MediaRecorder audio capture
│   │   ├── useWhisperTranscription.ts # Whisper + Web Speech transcription
│   │   └── useVoiceRecorder.ts        # Dictation wrapper for forms
│   ├── i18n/
│   │   ├── config.ts         # i18next configuration
│   │   └── locales/
│   │       ├── es.json       # Spanish
│   │       ├── en.json       # English
│   │       └── pt.json       # Portuguese
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts     # Initialised Supabase client
│   │       ├── config.ts     # Supabase environment variables
│   │       └── types.ts      # Auto-generated TypeScript types
│   ├── layouts/
│   │   └── AppLayout.tsx     # Main layout with sidebar and header
│   ├── lib/
│   │   ├── db.ts             # Dexie schema + saveAndSync / removeAndSync
│   │   ├── genetics.ts       # Coefficient of Inbreeding (COI) calculation
│   │   └── syncWorker.ts     # Bidirectional Dexie ↔ Supabase synchronisation
│   ├── pages/                # One page per functional module (28 pages)
│   │   ├── Auth.tsx          # Login / Registration
│   │   ├── Dashboard.tsx     # Control panel
│   │   ├── Pigeons.tsx       # Pigeon list
│   │   ├── PigeonDetail.tsx  # Full pigeon profile
│   │   ├── PigeonEdit.tsx    # Create/edit form
│   │   ├── Pairs.tsx         # Breeding pairs
│   │   ├── Seasons.tsx       # Breeding seasons
│   │   ├── Races.tsx         # Race list
│   │   ├── RaceDetail.tsx    # Race detail and results
│   │   ├── Medications.tsx   # Veterinary treatments
│   │   ├── Journal.tsx       # Daily loft journal
│   │   ├── MyLoft.tsx        # Lofts management
│   │   ├── Stations.tsx      # Liberation stations
│   │   ├── Teams.tsx         # Racing teams
│   │   ├── Contacts.tsx      # Contacts directory
│   │   ├── Bands.tsx         # Band/ring management
│   │   ├── Statistics.tsx    # Charts and analytics
│   │   ├── Images.tsx        # Photo gallery
│   │   ├── Settings.tsx      # App configuration
│   │   └── DebugDB.tsx       # Debug tool (dev only)
│   ├── workers/
│   │   └── whisper.worker.ts # Web Worker with Whisper-tiny ONNX
│   ├── App.tsx               # Main router and providers
│   └── main.tsx              # Entry point
├── supabase/
│   ├── config.toml           # Supabase project configuration
│   ├── functions/
│   │   └── parse-pigeon/     # AI field extraction Edge Function
│   └── migrations/           # SQL schema migrations
├── vite.config.ts            # Vite config (HTTPS, COOP/COEP, workers)
├── tailwind.config.ts        # Tailwind configuration
└── .env                      # Environment variables (do not commit)
```

---

## 5. Database

### 5.1 Local Database — Dexie (IndexedDB)

Dexie is the primary offline database. All modules read and write here first. Synchronisation with Supabase is secondary and asynchronous.

| Table | Description |
|---|---|
| `pigeons` | Pigeons with all their attributes |
| `pairs` | Breeding pairs per season |
| `seasons` | Breeding seasons |
| `races` | Racing events with inline results |
| `raceResults` | Individual results per pigeon and race |
| `teams` | Racing teams |
| `medications` | Veterinary treatments |
| `contacts` | Breeders and clubs directory |
| `stations` | Liberation stations with coordinates |
| `lofts` | User lofts |
| `journal` | Daily journal entries |
| `bands` | Registered band series |
| `autocomplete` | Values for form suggestions |
| `filters` | Saved filters |
| `settings` | User preferences |
| `syncQueue` | Queue of pending sync operations |

### 5.2 Cloud Database — Supabase (PostgreSQL)

The Supabase schema mirrors Dexie in snake_case. All tables have **RLS enabled**.

| Table | Key relations |
|---|---|
| `pigeons` | `loft_id → lofts` (SET NULL), `father_id / mother_id → pigeons` (self-reference, SET NULL) |
| `pairs` | `cock_id / hen_id → pigeons` (SET NULL), `season_id → seasons` (SET NULL) |
| `races` | `station_id → stations` (SET NULL), `team_id → teams` (SET NULL) |
| `race_results` | `race_id → races` (CASCADE), `pigeon_id → pigeons` (SET NULL) |
| `medication_pigeons` | N:M junction — `medication_id → medications`, `pigeon_id → pigeons` (CASCADE) |
| `bands` | `pigeon_id → pigeons` (SET NULL) |
| `settings` | Composite PK `(key, user_id)` — delete and upsert handled by composite key |

### 5.3 Performance Indexes

| Index | Purpose |
|---|---|
| `pigeons(user_id)`, `races(user_id)`, etc. | User filtering on all main tables |
| `journal(user_id, date DESC)` | Journal by date |
| `races(user_id, date DESC)` | Races by date |
| `pigeons(father_id)`, `pigeons(mother_id)` | Family tree traversal |
| `race_results(pigeon_id)` | Race history per pigeon |

---

## 6. Authentication and Session Lifecycle

Authentication is handled by **Supabase Auth**.

| Element | Detail |
|---|---|
| Login/registration page | `/auth` → `Auth.tsx` |
| Global context | `AuthContext.tsx` with `useAuth()` hook |
| Route protection | `AuthGuard.tsx` — redirects to `/auth` if no active session |
| On sign-in | `pullFromSupabase()` downloads cloud data → `startAutoSync()` starts |
| On sign-out | `stopAutoSync()` stops the timer and removes the `online` listener |

---

## 7. Offline ↔ Cloud Synchronisation

### Offline-first flow

```
User action
       ↓
saveAndSync() / removeAndSync()     ← src/lib/db.ts
       ↓
Dexie (IndexedDB)  ←  immediate write, UI updates instantly
       ↓
syncQueue (Dexie table)  ←  operation enqueued
       ↓
drainSyncQueue()  ←  every 30 s or on 'online' event (reconnection)
       ↓
Supabase PostgreSQL  ←  camelCase → snake_case + automatic user_id
```

### Entity-specific behaviour

- **`settings`**: uses composite PK `(key, user_id)`. Deletes filter by `key + user_id` instead of `id`. Upsert uses `onConflict: "key,user_id"`.
- **All other entities**: upsert with `onConflict: "id"`, delete by `id + user_id`.

### Pull on sign-in

On authentication, `AuthContext` runs `pullFromSupabase()` before starting auto-sync. This ensures the device downloads existing cloud data before pushing any local changes, preventing conflicts.

---

## 8. Voice and AI System

### 8.1 Speech Transcription

| Engine | Devices | How it works |
|---|---|---|
| **Whisper-tiny (ONNX q4)** | PC, Android Chrome | Downloaded once (~40 MB). Runs in a Web Worker via WASM. Works offline. |
| **Web Speech API (Siri)** | iOS Safari | Native OS engine. No download, real-time. Automatic fallback. |

**Technical requirements for Whisper WASM:**
- HTTPS required for microphone access
- `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers to enable `SharedArrayBuffer`

### 8.2 AI Field Extraction — `parse-pigeon` Edge Function

1. Transcript is sent to the Supabase Edge Function.
2. The function calls **Gemini Flash** via Lovable AI Gateway with tool calling.
3. Returns structured fields: `name`, `ringNumber`, `sex`, `bornYear`, `color`, `loft`, `breeder`, `status`, `notes`.
4. The pigeon edit form is automatically populated with the extracted data.

---

## 9. Functional Modules

| Module | Description |
|---|---|
| **Pigeons** | Full CRUD with photo gallery, pedigree tree, race history, medications and comments. Wins and race counts calculated dynamically from real results. |
| **Breeding** | Seasons and mated pairs with hypothetical COI calculation |
| **Racing** | Events with arrival registration and speeds. Sorted by speed with tie-breaking by arrival time. `won` field on results. 1st place highlighted with gold badge and trophy icon. |
| **Medications** | Veterinary treatments with dose, reason and withdrawal days per pigeon |
| **Lofts** | Facility management with GPS coordinates |
| **Stations** | Liberation stations for automatic distance calculation |
| **Teams** | Pigeon grouping for race entry |
| **Journal** | Daily loft observation log |
| **Contacts** | Breeders and clubs directory |
| **Bands** | Band series by year and country prefix |
| **Statistics** | Distribution charts by status and birth year |
| **Images** | Gallery of all pigeon photos |
| **Calculators** | Great-circle distance and speed calculators |
| **Settings** | Theme, language, units, pedigree and card configuration |

---

## 10. Configuration and Deployment

### Environment Variables (.env)

```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[anon-key]
VITE_SUPABASE_PROJECT_ID=[project-id]
```

> ⚠️ The `.env` file must be in `.gitignore` and never committed to the repository.

### Local Development

```bash
npm install
npm run dev    # https://localhost:5173 (automatic HTTPS with mkcert)
```

On first run, `vite-plugin-mkcert` automatically generates a local SSL certificate, enabling microphone access from other devices on the same local network.

### Production Build

```bash
npm run build  # Generates the /dist folder
```

The `public/_headers` file automatically configures COOP/COEP headers on Netlify and Cloudflare Pages:

```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Resource-Policy: cross-origin
```

### Database Migrations

```bash
# From the Supabase dashboard SQL Editor or via CLI:
supabase db push
```

---

## 11. Key Technical Decisions

**Offline-first with Dexie:** The app works fully without an internet connection. Dexie is the local source of truth; Supabase is the cloud mirror.

**Bidirectional sync on sign-in:** On authentication, a `pull` from Supabase runs before auto-sync starts, ensuring cloud data arrives on the device before any local writes are pushed.

**Auto-sync with reconnection listener:** `syncWorker` drains the queue every 30 seconds and also on the browser's `online` event, guaranteeing offline changes are uploaded as soon as connectivity is restored.

**Settings with composite PK:** The `settings` table uses `(key, user_id)` as its primary key. `syncWorker` has specific logic to handle deletes and upserts for this table correctly.

**Dynamically calculated wins:** Win and race counts per pigeon are computed in real time by cross-referencing race results, rather than maintaining counters in the `pigeons` table. This ensures they always reflect the actual state.

**Whisper singleton Web Worker:** The worker and model are instantiated once per browser tab. Fallback to Web Speech API is automatic on iOS Safari.

**RLS in Supabase:** Every table has Row Level Security policies guaranteeing data isolation between users without additional filters in the frontend code.

**camelCase locally / snake_case in the cloud:** `syncWorker` converts field names automatically on every sync operation.
