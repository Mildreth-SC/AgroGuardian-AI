-- Phase 3: geolocation on detections, feedback, follow-up tracking

alter table public.detections
  add column if not exists lat double precision,
  add column if not exists lon double precision,
  add column if not exists feedback_correct boolean,
  add column if not exists feedback_comment text,
  add column if not exists feedback_at timestamptz;

create index if not exists detections_owner_created_idx
  on public.detections (owner_id, created_at desc);

create index if not exists notifications_owner_read_idx
  on public.notifications (owner_id, read, created_at desc);
