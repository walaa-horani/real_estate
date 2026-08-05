-- Images live in Cloudinary, not Supabase Storage. cloudinary_public_id is the
-- stable per-slot asset id the app uploads to with overwrite:true, so
-- replacing a photo re-uploads onto the same Cloudinary asset instead of
-- creating a new one — the unique constraint below is the DB-side guarantee
-- that two rows never claim the same asset.
create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  -- Denormalized from properties.organization_id so RLS policies here don't
  -- need a join to properties on every row check. Kept in sync by trigger below.
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cloudinary_public_id text not null unique,
  url text not null,
  cloudinary_version integer,
  width integer,
  height integer,
  format text,
  role text not null default 'gallery',
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index property_images_property_sort_idx on public.property_images (property_id, sort_order);

create trigger property_images_touch_updated_at
  before update on public.property_images
  for each row execute function public.touch_updated_at();

create or replace function public.set_property_images_org_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select organization_id into new.organization_id
  from public.properties
  where id = new.property_id;

  return new;
end;
$$;

create trigger property_images_sync_org_id
  before insert on public.property_images
  for each row execute function public.set_property_images_org_id();

alter table public.property_images enable row level security;

create policy "property_images_public_select"
  on public.property_images
  for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id and p.status = 'published'
    )
  );

create policy "property_images_member_select"
  on public.property_images
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "property_images_admin_insert"
  on public.property_images
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id
        and public.is_org_admin(p.organization_id)
    )
  );

create policy "property_images_admin_update"
  on public.property_images
  for update
  to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "property_images_admin_delete"
  on public.property_images
  for delete
  to authenticated
  using (public.is_org_admin(organization_id));
