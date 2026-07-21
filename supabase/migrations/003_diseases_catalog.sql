-- Disease catalog for scalable encyclopedia (optional — app also ships static catalog)
create table if not exists public.diseases (
  slug text primary key,
  name_es text not null,
  name_en text not null,
  crop text not null,
  pathogen text,
  severity text check (severity in ('bajo','medio','alto','critico')),
  symptoms_es jsonb default '[]'::jsonb,
  treatment_es jsonb default '[]'::jsonb,
  season text,
  risk_climate text,
  image_path text,
  created_at timestamptz not null default now()
);

alter table public.diseases enable row level security;

create policy diseases_read_all on public.diseases for select using (true);
