-- AgroGuardian AI — Supabase schema
-- Run in Supabase SQL editor or via supabase migration

create extension if not exists "pgcrypto";

-- Profiles (linked to Clerk user id)
create table if not exists public.profiles (
  id text primary key,
  full_name text,
  phone text,
  province text default 'Manabí',
  created_at timestamptz not null default now()
);

create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references public.profiles(id) on delete cascade,
  name text not null,
  lat double precision,
  lng double precision,
  area_ha numeric(10,2),
  health_status text default 'sano' check (health_status in ('sano','riesgo','infectado')),
  created_at timestamptz not null default now()
);

create table if not exists public.plots (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  area_ha numeric(10,2),
  created_at timestamptz not null default now()
);

create table if not exists public.crops (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid references public.plots(id) on delete set null,
  farm_id uuid not null references public.farms(id) on delete cascade,
  name text not null,
  variety text,
  growth_stage text,
  planted_at date,
  health_pct int default 90 check (health_pct between 0 and 100),
  status text default 'sano' check (status in ('sano','riesgo','infectado')),
  created_at timestamptz not null default now()
);

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid references public.crops(id) on delete set null,
  owner_id text not null,
  storage_path text not null,
  mime text,
  created_at timestamptz not null default now()
);

create table if not exists public.detections (
  id uuid primary key default gen_random_uuid(),
  image_id uuid references public.images(id) on delete set null,
  crop_id uuid references public.crops(id) on delete set null,
  owner_id text not null,
  disease text not null,
  confidence numeric(5,4) not null,
  risk_level text not null,
  affected_part text,
  rationale text,
  agent_trace jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  detection_id uuid not null references public.detections(id) on delete cascade,
  title text not null,
  detail text not null,
  priority int default 1,
  timeframe text,
  completed boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.weather_logs (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references public.farms(id) on delete set null,
  temperature_c numeric(5,2),
  humidity_pct numeric(5,2),
  rain_mm numeric(6,2),
  wind_kmh numeric(6,2),
  condition text,
  climate_risk text,
  source text,
  recorded_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  detection_id uuid references public.detections(id) on delete set null,
  owner_id text not null,
  storage_path text,
  summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  title text not null,
  body text,
  severity text default 'info',
  read boolean default false,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.plots enable row level security;
alter table public.crops enable row level security;
alter table public.images enable row level security;
alter table public.detections enable row level security;
alter table public.recommendations enable row level security;
alter table public.weather_logs enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;

-- Storage bucket (run in dashboard or via API): plant-scans
-- Policies should allow authenticated users to upload to their own folder.
