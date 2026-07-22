-- Storage buckets for scan images and diagnosis PDF reports
-- Run in Supabase SQL editor after 001–003

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'plant-scans',
    'plant-scans',
    false,
    12582912,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'reports',
    'reports',
    false,
    5242880,
    array['application/pdf']
  )
on conflict (id) do nothing;

-- Service role uploads via Next.js API; optional public read for signed URLs
create policy "plant_scans_service" on storage.objects
  for all using (bucket_id = 'plant-scans')
  with check (bucket_id = 'plant-scans');

create policy "reports_service" on storage.objects
  for all using (bucket_id = 'reports')
  with check (bucket_id = 'reports');
