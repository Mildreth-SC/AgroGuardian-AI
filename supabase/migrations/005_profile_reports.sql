-- Profile preferences + unique report per detection

alter table public.profiles
  add column if not exists default_crop text;

create unique index if not exists reports_detection_id_unique
  on public.reports (detection_id)
  where detection_id is not null;
