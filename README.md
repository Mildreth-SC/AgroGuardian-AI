# AgroGuardian AI

**Tu agrónomo inteligente disponible 24/7.**

Plataforma de **sanidad vegetal** para agricultores de Manabí: foto de hoja → detección → clima → recomendaciones → PDF → historial.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16, React, Tailwind CSS, Leaflet, React Query |
| Auth | Clerk (opcional en MVP) |
| Backend | FastAPI + agentes (Disease / Agronomist / Climate / Report) |
| IA | OpenRouter → GPT-4o Vision |
| Clima | OpenWeather o Open-Meteo (gratis) |
| Datos | Supabase (schema listo en `supabase/migrations`) |

## Inicio rápido

### 1. Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
# Si faltan paquetes:
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

Sin `OPENROUTER_API_KEY` el sistema corre en **modo demo** (Sigatoka Negra + recomendaciones + clima real vía Open-Meteo).

### 2. Frontend

```powershell
cd web
copy .env.example .env.local
npm install
npm run dev
```

App: http://localhost:3000

### 3. Cámara (móvil y web)

En **Escanear**:

1. **Activar cámara** → usa la cámara trasera en el teléfono (`facingMode: environment`).
2. **Tomar muestra** → captura JPEG y analiza.
3. O **subir / arrastrar** archivo, o el input nativo `capture="environment"`.

HTTPS o `localhost` son necesarios para `getUserMedia`.

## Flujo de agentes

1. **Disease Detector** — visión (GPT-4o o demo)
2. **Climate Agent** — Open-Meteo / OpenWeather
3. **Agronomist** — diagnóstico + plan en español
4. **Report Agent** — empaquetado + PDF

## Supabase

Ejecuta `supabase/migrations/001_schema.sql` en el SQL editor. Tablas: profiles, farms, plots, crops, images, detections, recommendations, weather_logs, reports, notifications.

## Hackathon demo

1. Abrir dashboard
2. Ir a **Escanear** → cámara o foto
3. Ver diagnóstico + trazabilidad de agentes
4. Descargar PDF
5. Preguntar al **Asistente IA**

## Estructura

```
AgroGuardian-AI/
  backend/app/     # FastAPI + agents
  web/src/         # Next.js UI
  supabase/        # SQL schema
```
