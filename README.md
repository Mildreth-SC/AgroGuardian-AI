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

## Demo en producción

- **App:** https://agroguardian-ai-six.vercel.app
- **Health check:** `/api/health?probe=1` (OpenAI + Supabase)
- **Flujo E2E:** registro → onboarding → escanear foto → agentes IA → PDF → historial → asistente chat

## Herramientas OpenAI utilizadas

| Herramienta | Uso en AgroGuardian |
|-------------|---------------------|
| **OpenAI API (GPT-4o-mini)** | Visión: detección de enfermedades en hoja/planta. Texto: diagnóstico agronómico, chat asistente, salidas JSON estructuradas. |
| **SDK `openai` (Node.js)** | Cliente oficial en `web/src/lib/server/openrouter.ts` contra `api.openai.com`. |
| **Codex / Cursor Agent** | Construcción del pipeline de agentes, integración Next.js + Supabase + despliegue Vercel. |
| **OpenRouter (respaldo)** | Fallback opcional si OpenAI no responde; no reemplaza el proveedor principal del reto. |

Orquestación de agentes: pipeline propio de 4 agentes (Detector → Clima → Agrónomo → Reporte) con trazas `agent_trace` expuestas en UI.

## Contribución a los ODS (Agenda 2030)

| ODS | Cómo contribuye AgroGuardian | Indicador de impacto propuesto |
|-----|------------------------------|--------------------------------|
| **ODS 2 — Hambre cero** | Detección temprana de plagas/enfermedades en plátano, cacao, maíz, café y arroz de Manabí → menos pérdida de cosecha. | Nº diagnósticos/mes; % casos con tratamiento iniciado &lt;72 h. |
| **ODS 12 — Producción responsable** | Recomendaciones focalizadas (no aplicación ciega de agroquímicos); alertas de brotes y clima. | Nº recomendaciones prioridad 1 ejecutadas vs. total. |
| **ODS 15 — Vida de ecosistemas** | Monitoreo de sanidad vegetal + enciclopedia de enfermedades; reduce propagación y uso innecesario de químicos. | Hectáreas monitoreadas; alertas de brote emitidas por zona. |

## Validación del problema (sector real)

La problemática está alineada con el contexto agroproductivo de **Manabí, Ecuador**:

- Cultivos prioritarios de la costa ecuatoriana: plátano/banano (sigatoka), cacao (moniliasis), maíz (roya), café y arroz.
- Referencias técnicas: guías del **MAG Ecuador** e **INIAP** sobre sanidad vegetal y manejo integrado de plagas.
- Entrevistas / prueba de concepto: validar con extensionistas rurales o cooperativas de Portoviejo, Chone o Jipijapa (completar contacto y fecha en la presentación del reto).

## Trazabilidad y supervisión humana

- Cada diagnóstico incluye **`agent_trace`** (agente, estado, duración, resumen).
- El asistente muestra **fuentes** de cada respuesta (clima Open-Meteo, historial de finca, modelo IA).
- Bloque **“Datos de entrada”** en escaneo: imagen, clima, confianza y señales visuales.
- **Disclaimer** visible: las recomendaciones no sustituyen agrónomo/extensionista; decisiones críticas requieren validación humana.

## Repositorio

https://github.com/Mildreth-SC/AgroGuardian-AI

