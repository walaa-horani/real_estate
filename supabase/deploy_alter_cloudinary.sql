-- =============================================================================
-- Run this in Supabase SQL Editor if you already ran deploy_schema.sql once
-- (adds Cloudinary columns to an existing property_images table without
-- dropping it). Skip this file entirely on a brand-new project — deploy_schema.sql
-- already includes these columns.
-- =============================================================================

alter table public.property_images
  add column if not exists cloudinary_public_id text,
  add column if not exists cloudinary_version integer,
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists format text,
  add column if not exists updated_at timestamptz not null default now();

-- Backfill placeholder public_ids for any pre-existing rows (e.g. demo seed
-- data using picsum.photos URLs) so the NOT NULL + UNIQUE constraints below
-- can be applied. Replace/re-upload these through the app once Cloudinary is wired up.
update public.property_images
set cloudinary_public_id = 'legacy/' || id::text
where cloudinary_public_id is null;

alter table public.property_images
  alter column cloudinary_public_id set not null;

alter table public.property_images
  add constraint property_images_cloudinary_public_id_key unique (cloudinary_public_id);

drop trigger if exists property_images_touch_updated_at on public.property_images;
create trigger property_images_touch_updated_at
  before update on public.property_images
  for each row execute function public.touch_updated_at();
