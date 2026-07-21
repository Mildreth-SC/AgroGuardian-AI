# AgroGuardian AI

**Tu agrónomo inteligente disponible 24/7.**

Plataforma de **sanidad vegetal** para agricultores de Manabí: foto de hoja → detección IA → clima → recomendaciones → PDF → historial.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend + API | Next.js 16 (App Router, `/api/*`) |
| Auth | **Clerk** |
| IA | **OpenAI API** (GPT-4o-mini texto + visión) · OpenRouter opcional como respaldo |
| Clima | **Open-Meteo** (gratis) |
| Datos | **Supabase** |
| Legacy | `backend/` FastAPI (opcional, no necesario en Vercel) |

## Despliegue en Vercel (producción)

1. **Root Directory:** `web`
2. Variables de entorno (ver `web/.env.example`):
   - Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, URLs de sign-in/up
   - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - **OpenAI:** `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-4o-mini`, `OPENAI_VISION_MODEL=gpt-4o-mini`
   - OpenRouter (opcional): `OPENROUTER_API_KEY`, modelos `:free` como respaldo
3. **No uses** `NEXT_PUBLIC_API_URL` apuntando a `:8000` — la API corre en el mismo dominio
4. En Clerk Dashboard agrega tu dominio `*.vercel.app`
5. Ejecuta migraciones SQL en Supabase (`supabase/migrations/`)

## Inicio local

```powershell
cd web
copy .env.example .env.local
npm install
npm run dev
```

App: http://localhost:3000

### OpenAI + Supabase

1. Ejecuta migraciones SQL en Supabase (`supabase/migrations/`)
2. Crea API key en [platform.openai.com](https://platform.openai.com) → `OPENAI_API_KEY` en `web/.env.local`
3. OpenRouter es **opcional** (respaldo); sin ninguna clave IA y `DEMO_MODE=true` corre en modo demo

### PWA y cámara (Escanear)

- Instala como PWA desde el navegador (manifest + service worker)
- Muestras demo estilo PlantVillage en **Escanear**
- HTTPS o `localhost` son necesarios para `getUserMedia`

## Flujo de agentes

```
Foto → Disease Detector (visión) → Climate Agent (Open-Meteo)
     → Agronomist (diagnóstico + plan) → Report Agent (PDF + historial)
```

## Estructura

```
AgroGuardian-AI/
  web/               # Next.js UI + API routes (desplegar esto en Vercel)
  backend/           # FastAPI legacy (opcional en local)
  supabase/          # SQL schema + RLS
```
