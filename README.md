# PigeonDB — Gestión de Palomas Mensajeras

Aplicación web **local-first** para la gestión integral de palomas mensajeras (colombofilia). Permite administrar el palomar, pedigríes, carreras, emparejamientos, medicaciones y mucho más, con sincronización opcional a la nube via Supabase.

---

## Características principales

- **Gestión de palomas** — ficha completa con anilla, genealogía, fotos, genética y estadísticas de vuelo
- **Pedigrí** — árbol genealógico visual de hasta 5 generaciones con cálculo automático del coeficiente de consanguinidad (COI)
- **Carreras** — registro de vuelos con tiempos de llegada, velocidades (m/min), clasificación automática y campo de victoria
- **Emparejamientos** — gestión de parejas por temporada con recomendaciones de cría
- **Equipos** — agrupación de palomas para asignación a carreras
- **Medicaciones** — historial de tratamientos por paloma o por palomar completo
- **Estaciones y palomares** — gestión de puntos de suelta y palomares con coordenadas GPS
- **Contactos** — directorio de criadores y colaboradores
- **Diario** — cuaderno de notas del palomar
- **Dictado por voz con IA** — crea fichas de palomas dictando los datos por micrófono
- **Modo offline** — funciona sin conexión; los cambios se sincronizan cuando hay red
- **Multiidioma** — Español, Inglés y Portugués
- **Modo oscuro/claro**

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Framework | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Radix UI + Tailwind CSS |
| Base de datos local | Dexie.js (IndexedDB) |
| Backend / Auth | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Mapas | Leaflet + React Leaflet |
| Gráficas | Recharts |
| Formularios | React Hook Form + Zod |
| i18n | i18next + react-i18next |
| Voz IA | MediaRecorder API + Supabase Edge Function (Gemini 2.5 Flash) |

---

## Requisitos previos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) con un proyecto creado
- (Opcional) API key de Lovable AI Gateway para la función de voz

---

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/AnahelGinesDelgadoAlmeidaCognitiatech/ProyectoPalomasV2.git
cd ProyectoPalomasV2

# Instalar dependencias
npm install
```

---

## Configuración

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL="https://<tu-proyecto>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<tu-anon-key>"
VITE_SUPABASE_PROJECT_ID="<tu-project-id>"
VITE_SUPABASE_STORAGE_BUCKET="pigeons-images"
```

### Secrets de Edge Functions (Supabase Dashboard → Edge Functions → Secrets)

| Secret | Descripción |
|--------|-------------|
| `LOVABLE_API_KEY` | Clave del gateway de IA para la transcripción de voz |

---

## Desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:5173`.

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Build de producción |
| `npm run build:dev` | Build en modo desarrollo |
| `npm run preview` | Previsualizar el build de producción |
| `npm run lint` | Ejecutar ESLint |
| `npm run test` | Ejecutar tests con Vitest |
| `npm run test:watch` | Tests en modo watch |

---

## Arquitectura

### Local-first

La app usa **Dexie.js (IndexedDB)** como base de datos principal. Cada mutación queda registrada en una `syncQueue` local. Un worker de sincronización drena esa cola hacia Supabase en segundo plano cuando hay conexión, o al reconectar tras estar offline.

```
Usuario → Dexie (IndexedDB) → syncQueue → Supabase (PostgreSQL)
                ↑                              ↓
          useLiveQuery                   pullFromSupabase
         (reactivo)                       (al iniciar sesión)
```

### Base de datos por usuario

Cada usuario tiene su propia base de datos Dexie: `pigeondb_{userId}`. Se inicializa al autenticarse mediante `initDb(userId)`.

### Estructura de carpetas

```
src/
├── components/       # Componentes reutilizables (UI, PedigreeTree, ImageUpload…)
├── contexts/         # AuthContext
├── hooks/            # useAudioRecorder, useVoiceRecorder, useWhisperTranscription…
├── i18n/             # Configuración i18next + locales (es, en, pt)
├── integrations/     # Cliente Supabase y tipos generados
├── lib/              # db.ts (Dexie), syncWorker.ts, genetics.ts, utils.ts
├── pages/            # Páginas de la aplicación
└── workers/          # Web Worker de Whisper (transcripción local)

supabase/
└── functions/
    └── parse-pigeon/ # Edge Function: transcripción de voz + extracción de campos con IA
```

---

## Función de voz (dictado IA)

Al crear una paloma, el botón de micrófono graba audio hasta 60 segundos. El audio se envía a la Edge Function `parse-pigeon` que:

1. Transcribe el audio con **Gemini 2.5 Flash** (multimodal)
2. Extrae los campos estructurados (nombre, anilla, sexo, año, color, palomar…) mediante **tool calling**
3. Rellena el formulario automáticamente

Requiere que `LOVABLE_API_KEY` esté configurada en los secrets de la Edge Function.

---

## Despliegue

### Edge Functions

```bash
supabase functions deploy parse-pigeon --project-ref <tu-project-id>
```

### Frontend

El proyecto está optimizado para desplegarse en cualquier CDN estático (Vercel, Netlify, etc.):

```bash
npm run build
# El output estará en /dist
```

---

## Idiomas soportados

| Código | Idioma |
|--------|--------|
| `es` | Español (por defecto) |
| `en` | English |
| `pt` | Português |

El idioma se guarda en `localStorage` y en la base de datos local de configuración, sincronizándose entre dispositivos.

---

## Licencia

Proyecto privado — © 2026 Cognitiatech / AnahelGinesDelgadoAlmeidaCognitiatech
