# Documentación Técnica — Proyecto Palomas V2

**Versión:** 2.0  
**Repositorio:** https://github.com/AnahelGinesDelgadoAlmeidaCognitiatech/ProyectoPalomasV2  
**Fecha:** Mayo 2026

---

## 1. Descripción General

**Proyecto Palomas V2** es una aplicación web progresiva (PWA) para la gestión integral de palomares de competición. Permite registrar palomas, temporadas de cría, parejas reproductoras, vuelos de competición, tratamientos veterinarios y contactos, con soporte offline completo y sincronización bidireccional con la nube.

La aplicación está orientada a dispositivos móviles y escritorio, con soporte para dictado de voz mediante inteligencia artificial para agilizar el registro de datos en el palomar.

---

## 2. Tecnologías Utilizadas

### Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| React | 18.3 | Framework de interfaz de usuario |
| TypeScript | 5.8 | Tipado estático |
| Vite | 5.4 | Bundler y servidor de desarrollo |
| React Router DOM | 6.30 | Enrutamiento SPA |
| Tailwind CSS | 3.4 | Estilos utilitarios |
| shadcn/ui + Radix UI | — | Componentes de interfaz accesibles |
| Lucide React | 0.462 | Iconografía |
| Recharts | 2.15 | Gráficas y estadísticas |
| React Hook Form + Zod | 7.61 / 3.25 | Formularios y validación |
| date-fns | 3.6 | Manipulación de fechas |
| next-themes | 0.3 | Soporte tema claro/oscuro |

### Internacionalización

| Tecnología | Versión | Uso |
|---|---|---|
| i18next | 26.0 | Motor de traducciones |
| react-i18next | 17.0 | Integración con React |

Idiomas soportados: **Español**, **Inglés**, **Portugués**.

### Base de Datos Local (Offline)

| Tecnología | Versión | Uso |
|---|---|---|
| Dexie.js | 4.4 | Wrapper de IndexedDB para almacenamiento local |
| dexie-react-hooks | 4.4 | Hooks reactivos para consultas locales |

### Backend y Sincronización

| Tecnología | Versión | Uso |
|---|---|---|
| Supabase | 2.105 | Base de datos PostgreSQL en la nube, autenticación y storage |
| Supabase Edge Functions | — | Funciones serverless en Deno |
| TanStack Query | 5.83 | Caché y gestión de estado servidor |

### Inteligencia Artificial y Voz

| Tecnología | Versión | Uso |
|---|---|---|
| @huggingface/transformers | 4.2 | Whisper-tiny ONNX — transcripción local en WASM |
| Web Speech API | Nativa | Transcripción en iOS Safari (motor Siri) |
| Gemini Flash (Lovable AI Gateway) | — | Extracción de campos estructurados del dictado |
| vite-plugin-mkcert | 2.0 | HTTPS local para acceso al micrófono en desarrollo |

### Pruebas

| Tecnología | Versión | Uso |
|---|---|---|
| Vitest | 3.2 | Framework de tests unitarios |
| Testing Library | 16.0 | Tests de componentes React |
| jsdom | 20.0 | Simulación de DOM en tests |

---

## 3. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────┐
│                   CLIENTE (Navegador)                │
│                                                      │
│  ┌─────────────┐    ┌──────────────────────────┐    │
│  │  React UI   │    │   Web Worker (Whisper)   │    │
│  │  (shadcn)   │    │   WASM / WebGPU          │    │
│  └──────┬──────┘    └──────────────────────────┘    │
│         │                                            │
│  ┌──────▼──────────────────────────────────────┐    │
│  │              Dexie (IndexedDB)               │    │
│  │  Almacenamiento local offline-first          │    │
│  │  syncQueue → drainSyncQueue → Supabase       │    │
│  │  startAutoSync / stopAutoSync (30 s)         │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│                    SUPABASE                          │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ PostgreSQL  │  │    Auth      │  │  Storage   │  │
│  │  + RLS      │  │  (usuarios)  │  │  (fotos)   │  │
│  └─────────────┘  └──────────────┘  └────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │          Edge Function: parse-pigeon          │   │
│  │  Deno → Gemini Flash → campos estructurados   │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Flujo de datos

1. El usuario interactúa con la UI en React.
2. Los datos se guardan inmediatamente en **Dexie (IndexedDB)** — la app funciona sin conexión.
3. Cada operación (insert/update/delete) se encola en la **syncQueue** de Dexie.
4. Al iniciar sesión, `AuthContext` llama a `pullFromSupabase()` para descargar los datos de la nube, seguido de `startAutoSync()`.
5. `startAutoSync` drena la cola cada **30 segundos** y escucha el evento `online` para sincronizar al recuperar la conexión.
6. Al cerrar sesión, `stopAutoSync()` detiene el temporizador y elimina el listener.
7. Supabase aplica políticas de **RLS** para aislar los datos de cada usuario.

---

## 4. Estructura del Proyecto

```
ProyectoPalomasV2/
├── public/
│   └── _headers              # Headers COOP/COEP para Whisper WASM
├── src/
│   ├── components/           # Componentes reutilizables
│   │   ├── AuthGuard.tsx     # Protección de rutas autenticadas
│   │   ├── ErrorBoundary.tsx # Captura de errores React
│   │   ├── ImageUpload.tsx   # Subida de imágenes a Supabase Storage
│   │   ├── LocationPicker.tsx # Selector de coordenadas GPS
│   │   ├── PedigreeTree.tsx  # Árbol genealógico visual
│   │   ├── VoiceInput.tsx    # Botón de dictado de voz
│   │   └── ui/               # Componentes shadcn/ui
│   ├── contexts/
│   │   └── AuthContext.tsx   # Contexto de autenticación + arranque de sync
│   ├── hooks/
│   │   ├── useAudioRecorder.ts        # Grabación de audio MediaRecorder
│   │   ├── useWhisperTranscription.ts # Transcripción Whisper + Web Speech
│   │   └── useVoiceRecorder.ts        # Wrapper para dictado en formularios
│   ├── i18n/
│   │   ├── config.ts         # Configuración i18next
│   │   └── locales/
│   │       ├── es.json       # Español
│   │       ├── en.json       # Inglés
│   │       └── pt.json       # Portugués
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts     # Cliente Supabase inicializado
│   │       ├── config.ts     # Variables de entorno Supabase
│   │       └── types.ts      # Tipos TypeScript generados automáticamente
│   ├── layouts/
│   │   └── AppLayout.tsx     # Layout principal con sidebar y header
│   ├── lib/
│   │   ├── db.ts             # Schema Dexie y funciones saveAndSync/removeAndSync
│   │   ├── genetics.ts       # Cálculo del Coeficiente de Consanguinidad (COI)
│   │   └── syncWorker.ts     # Sincronización bidireccional Dexie ↔ Supabase
│   ├── pages/                # Una página por módulo funcional (28 páginas)
│   │   ├── Auth.tsx          # Login / Registro
│   │   ├── Dashboard.tsx     # Panel de control
│   │   ├── Pigeons.tsx       # Lista de palomas
│   │   ├── PigeonDetail.tsx  # Perfil completo de paloma
│   │   ├── PigeonEdit.tsx    # Formulario de creación/edición
│   │   ├── Pairs.tsx         # Parejas reproductoras
│   │   ├── Seasons.tsx       # Temporadas de cría
│   │   ├── Races.tsx         # Lista de vuelos
│   │   ├── RaceDetail.tsx    # Detalle y resultados de vuelo
│   │   ├── Medications.tsx   # Tratamientos veterinarios
│   │   ├── Journal.tsx       # Diario del palomar
│   │   ├── MyLoft.tsx        # Palomares
│   │   ├── Stations.tsx      # Estaciones de suelta
│   │   ├── Teams.tsx         # Equipos de competición
│   │   ├── Contacts.tsx      # Agenda de contactos
│   │   ├── Bands.tsx         # Gestión de anillas
│   │   ├── Statistics.tsx    # Estadísticas y gráficas
│   │   ├── Images.tsx        # Galería de fotos
│   │   ├── Settings.tsx      # Configuración de la app
│   │   └── DebugDB.tsx       # Herramienta de depuración (solo dev)
│   ├── workers/
│   │   └── whisper.worker.ts # Web Worker con Whisper-tiny ONNX
│   ├── App.tsx               # Enrutador principal y providers
│   └── main.tsx              # Punto de entrada
├── supabase/
│   ├── config.toml           # Configuración del proyecto Supabase
│   ├── functions/
│   │   └── parse-pigeon/     # Edge Function de extracción de campos IA
│   └── migrations/           # Migraciones SQL del esquema
├── vite.config.ts            # Configuración Vite (HTTPS, COOP/COEP, workers)
├── tailwind.config.ts        # Configuración Tailwind
└── .env                      # Variables de entorno (no subir a git)
```

---

## 5. Base de Datos

### 5.1 Base de datos local — Dexie (IndexedDB)

Dexie actúa como base de datos primaria offline. Todos los módulos leen y escriben aquí primero. La sincronización con Supabase es secundaria y asíncrona.

**Tablas locales:**

| Tabla | Descripción |
|---|---|
| `pigeons` | Palomas con todos sus atributos |
| `pairs` | Parejas reproductoras por temporada |
| `seasons` | Temporadas de cría |
| `races` | Vuelos de competición con resultados inline |
| `raceResults` | Resultados individuales por paloma y vuelo |
| `teams` | Equipos de competición |
| `medications` | Tratamientos veterinarios |
| `contacts` | Agenda de criadores y clubes |
| `stations` | Estaciones de suelta con coordenadas |
| `lofts` | Palomares del usuario |
| `journal` | Entradas del diario |
| `bands` | Series de anillas registradas |
| `autocomplete` | Valores para sugerencias en formularios |
| `filters` | Filtros guardados |
| `settings` | Preferencias del usuario |
| `syncQueue` | Cola de operaciones pendientes de sincronizar |

### 5.2 Base de datos en la nube — Supabase (PostgreSQL)

El esquema en Supabase replica la estructura de Dexie en snake_case. Todas las tablas tienen **RLS activado** — cada usuario solo accede a sus propios registros.

**Tablas y relaciones clave:**

| Tabla | Relaciones |
|---|---|
| `pigeons` | `loft_id → lofts` (SET NULL), `father_id / mother_id → pigeons` (auto-referencia, SET NULL) |
| `pairs` | `cock_id / hen_id → pigeons` (SET NULL), `season_id → seasons` (SET NULL) |
| `races` | `station_id → stations` (SET NULL), `team_id → teams` (SET NULL) |
| `race_results` | `race_id → races` (CASCADE), `pigeon_id → pigeons` (SET NULL) |
| `medication_pigeons` | Tabla N:M — `medication_id → medications`, `pigeon_id → pigeons` (CASCADE) |
| `bands` | `pigeon_id → pigeons` (SET NULL) |
| `settings` | PK compuesta `(key, user_id)` — delete y upsert gestionados por clave compuesta |

### 5.3 Índices de rendimiento

| Índice | Propósito |
|---|---|
| `pigeons(user_id)`, `races(user_id)`, etc. | Filtrado por usuario en todas las tablas |
| `journal(user_id, date DESC)` | Diario por fecha |
| `races(user_id, date DESC)` | Vuelos por fecha |
| `pigeons(father_id)`, `pigeons(mother_id)` | Árbol genealógico |
| `race_results(pigeon_id)` | Historial de vuelos por paloma |

---

## 6. Autenticación y Ciclo de Sesión

La autenticación está gestionada por **Supabase Auth**.

| Elemento | Detalle |
|---|---|
| Página de login/registro | `/auth` → `Auth.tsx` |
| Contexto global | `AuthContext.tsx` con `useAuth()` hook |
| Protección de rutas | `AuthGuard.tsx` — redirige a `/auth` si no hay sesión |
| Al iniciar sesión | `pullFromSupabase()` descarga datos de la nube → `startAutoSync()` |
| Al cerrar sesión | `stopAutoSync()` detiene el temporizador y el listener `online` |

---

## 7. Sincronización Offline ↔ Nube

### Flujo offline-first

```
Acción del usuario
       ↓
saveAndSync() / removeAndSync()     ← src/lib/db.ts
       ↓
Dexie (IndexedDB)  ←  escritura inmediata, UI actualiza al instante
       ↓
syncQueue (tabla Dexie)  ←  operación encolada
       ↓
drainSyncQueue()  ←  cada 30 s o al recuperar conexión (evento 'online')
       ↓
Supabase PostgreSQL  ←  camelCase → snake_case + user_id automático
```

### Comportamiento especial por entidad

- **`settings`**: usa PK compuesta `(key, user_id)`. El delete filtra por `key + user_id` en lugar de `id`. El upsert usa `onConflict: "key,user_id"`.
- **Resto de entidades**: upsert con `onConflict: "id"`, delete por `id + user_id`.

### Sincronización al iniciar sesión

Al autenticarse, `AuthContext` ejecuta `pullFromSupabase()` antes de arrancar el auto-sync. Esto garantiza que el dispositivo descarga primero los datos existentes en la nube antes de empezar a subir los datos locales, evitando conflictos.

---

## 8. Sistema de Voz e IA

### 8.1 Transcripción de voz

| Motor | Dispositivos | Funcionamiento |
|---|---|---|
| **Whisper-tiny (ONNX q4)** | PC, Android Chrome | Modelo descargado una vez (~40 MB). Corre en Web Worker via WASM. Sin conexión. |
| **Web Speech API (Siri)** | iOS Safari | Motor nativo del SO. Sin descarga, tiempo real. Fallback automático. |

**Requisitos técnicos para Whisper WASM:**
- HTTPS obligatorio para acceso al micrófono
- Headers `Cross-Origin-Opener-Policy: same-origin` y `Cross-Origin-Embedder-Policy: require-corp` para activar `SharedArrayBuffer`

### 8.2 Extracción de campos con IA (Edge Function `parse-pigeon`)

1. La transcripción se envía a la Edge Function en Supabase.
2. La función llama a **Gemini Flash** vía Lovable AI Gateway con tool calling.
3. Devuelve campos estructurados: `name`, `ringNumber`, `sex`, `bornYear`, `color`, `loft`, `breeder`, `status`, `notes`.
4. El formulario de edición de paloma se rellena automáticamente.

---

## 9. Módulos Funcionales

| Módulo | Descripción |
|---|---|
| **Palomas** | CRUD completo con foto, pedigree, historial de vuelos, medicamentos y comentarios. Victorias y carreras calculadas dinámicamente desde los resultados reales. |
| **Cría** | Temporadas y parejas con cálculo de COI hipotético |
| **Competición** | Vuelos con registro de llegadas y velocidades. Ordenación por velocidad con desempate por hora de llegada. Campo `won` en resultados. Primer puesto destacado con badge dorado y trofeo. |
| **Tratamientos** | Medicamentos con dosis, motivo y días de retirada, asignados a palomas individuales |
| **Palomares** | Gestión de instalaciones con coordenadas GPS |
| **Estaciones** | Puntos de suelta con coordenadas para cálculo automático de distancias |
| **Equipos** | Agrupación de palomas para inscripción en vuelos |
| **Diario** | Registro diario de observaciones del palomar |
| **Contactos** | Agenda de criadores y clubes |
| **Anillas** | Gestión de series de anillas por año y prefijo país |
| **Estadísticas** | Gráficas de distribución por estado y año de nacimiento |
| **Imágenes** | Galería de todas las fotos de las palomas |
| **Calculadoras** | Distancia (gran círculo) y velocidad |
| **Ajustes** | Tema, idioma, unidades, configuración de pedigree y tarjetas |

---

## 10. Configuración y Despliegue

### Variables de entorno (.env)

```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[anon-key]
VITE_SUPABASE_PROJECT_ID=[project-id]
```

> ⚠️ El archivo `.env` debe estar en `.gitignore` y nunca subirse al repositorio.

### Desarrollo local

```bash
npm install
npm run dev    # Arranca en https://localhost:5173 (HTTPS automático con mkcert)
```

La primera vez, `vite-plugin-mkcert` genera un certificado SSL local automáticamente, habilitando el acceso al micrófono también desde otros dispositivos en la misma red local.

### Producción

```bash
npm run build  # Genera la carpeta /dist
```

El archivo `public/_headers` configura automáticamente los headers COOP/COEP en Netlify y Cloudflare Pages:

```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Resource-Policy: cross-origin
```

### Migraciones de base de datos

```bash
# Desde el SQL Editor de Supabase o con CLI:
supabase db push
```

---

## 11. Decisiones Técnicas Relevantes

**Offline-first con Dexie:** La app funciona completamente sin conexión. Dexie actúa como fuente de verdad local y Supabase como espejo en la nube.

**Sync bidireccional al iniciar sesión:** Al autenticarse, se hace primero un `pull` de Supabase antes de arrancar el auto-sync, garantizando que los datos de la nube llegan al dispositivo antes de cualquier escritura.

**Auto-sync con listener de reconexión:** El `syncWorker` drena la cola cada 30 segundos y también al detectar el evento `online` del navegador, lo que garantiza que los cambios offline se suben en cuanto hay conexión.

**Settings con PK compuesta:** La tabla `settings` usa `(key, user_id)` como clave primaria. El `syncWorker` tiene lógica específica para gestionar los delete y upsert de esta tabla correctamente.

**Victorias calculadas dinámicamente:** El número de victorias y carreras de cada paloma se calcula en tiempo real cruzando los resultados de los vuelos, en lugar de mantener contadores en la tabla `pigeons`. Esto garantiza que siempre refleja el estado real.

**Whisper en Web Worker singleton:** El worker y el modelo se instancian una sola vez por pestaña. El fallback a Web Speech API es automático en iOS Safari.

**RLS en Supabase:** Cada tabla tiene políticas de Row Level Security que garantizan el aislamiento de datos entre usuarios sin filtros adicionales en el código frontend.

**camelCase local / snake_case en la nube:** El `syncWorker` convierte automáticamente los nombres de campo en cada operación de sincronización.
