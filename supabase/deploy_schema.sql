-- =============================================================================
-- Deploy schema + RLS to Supabase SQL Editor
-- Paste this whole file into: Supabase Dashboard -> SQL Editor -> New query -> Run
-- Safe to run once on a fresh project. Mirrors supabase/migrations/*.sql exactly.
-- =============================================================================

-- ── 1. extensions + helpers ─────────────────────────────────────────────────
create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 2. plans ─────────────────────────────────────────────────────────────
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  price_monthly_cents integer not null check (price_monthly_cents >= 0),
  description text,
  max_listings integer,               -- null = unlimited
  max_team_members integer,           -- null = unlimited
  max_images_per_listing integer not null default 10,
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.plans enable row level security;

create policy "plans_public_select"
  on public.plans
  for select
  using (true);

-- ── 3. organizations ─────────────────────────────────────────────────────
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  logo_url text,
  description text,
  address text,
  phone text,
  public_email text,
  website_url text,
  plan_id uuid not null references public.plans(id),
  plan_status text not null default 'active'
    check (plan_status in ('active', 'past_due', 'canceled', 'trialing')),
  created_by uuid references auth.users(id),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_touch_updated_at
  before update on public.organizations
  for each row execute function public.touch_updated_at();

alter table public.organizations enable row level security;

create policy "organizations_public_select"
  on public.organizations
  for select
  using (is_public = true);

create policy "organizations_authenticated_insert"
  on public.organizations
  for insert
  to authenticated
  with check (true);

-- ── 4. profiles ─────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles_self_select"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_self_update"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── 5. organization_members + non-recursive RLS helpers ────────────────────
-- Two roles only: admin (full CRUD) and member (read-only, invited by an admin).
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  invited_email text,
  status text not null default 'active' check (status in ('invited', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_members_user_id_idx on public.organization_members (user_id);
create index organization_members_org_role_idx on public.organization_members (organization_id, role);

create or replace function public.prevent_last_admin_removal()
returns trigger
language plpgsql
as $$
declare
  remaining_admins integer;
begin
  if (tg_op = 'DELETE' and old.role = 'admin')
     or (tg_op = 'UPDATE' and old.role = 'admin' and new.role <> 'admin') then
    select count(*) into remaining_admins
    from public.organization_members
    where organization_id = old.organization_id
      and role = 'admin'
      and id <> old.id;

    if remaining_admins = 0 then
      raise exception 'cannot remove the last admin of an organization'
        using errcode = 'P0001';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger organization_members_prevent_last_admin_removal
  before update or delete on public.organization_members
  for each row execute function public.prevent_last_admin_removal();

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = 'admin'
  );
$$;

create or replace function public.shares_org_with(target_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.organization_members m1
    join public.organization_members m2 on m1.organization_id = m2.organization_id
    where m1.user_id = auth.uid()
      and m2.user_id = target_user
      and m1.status = 'active'
      and m2.status = 'active'
  );
$$;

grant execute on function public.is_org_member(uuid) to authenticated, anon;
grant execute on function public.is_org_admin(uuid) to authenticated, anon;
grant execute on function public.shares_org_with(uuid) to authenticated, anon;

alter table public.organization_members enable row level security;

create policy "org_members_select"
  on public.organization_members
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "org_members_insert"
  on public.organization_members
  for insert
  to authenticated
  with check (public.is_org_admin(organization_id));

create policy "org_members_update"
  on public.organization_members
  for update
  to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "org_members_delete"
  on public.organization_members
  for delete
  to authenticated
  using (public.is_org_admin(organization_id));

create policy "organizations_member_select"
  on public.organizations
  for select
  to authenticated
  using (public.is_org_member(id));

create policy "organizations_admin_update"
  on public.organizations
  for update
  to authenticated
  using (public.is_org_admin(id))
  with check (public.is_org_admin(id));

create policy "organizations_admin_delete"
  on public.organizations
  for delete
  to authenticated
  using (public.is_org_admin(id));

create policy "profiles_org_member_select"
  on public.profiles
  for select
  to authenticated
  using (public.shares_org_with(id));

-- ── 6. org bootstrap RPC ─────────────────────────────────────────────────
create or replace function public.create_organization_with_admin(
  org_slug text,
  org_name text,
  plan_slug text default 'basic'
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org public.organizations;
  selected_plan_id uuid;
begin
  if auth.uid() is null then
    raise exception 'must be authenticated to create an organization';
  end if;

  select id into selected_plan_id
  from public.plans
  where slug = plan_slug and is_active = true;

  if selected_plan_id is null then
    raise exception 'unknown or inactive plan: %', plan_slug;
  end if;

  insert into public.organizations (slug, name, plan_id, created_by)
  values (org_slug, org_name, selected_plan_id, auth.uid())
  returning * into new_org;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (new_org.id, auth.uid(), 'admin', 'active');

  return new_org;
end;
$$;

grant execute on function public.create_organization_with_admin(text, text, text) to authenticated;

-- ── 7. properties ─────────────────────────────────────────────────────────
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  price numeric(14, 2) not null check (price >= 0),
  price_period text not null default 'sale' check (price_period in ('sale', 'month', 'year')),
  address_line text,
  city text,
  state text,
  postal_code text,
  country text not null default 'US',
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  beds smallint check (beds >= 0),
  baths numeric(3, 1) check (baths >= 0),
  sqft integer check (sqft >= 0),
  property_type text not null
    check (property_type in ('condo', 'apartment', 'villa', 'house', 'office', 'land', 'other')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  listed_by uuid references public.organization_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (organization_id, slug)
);

create index properties_org_status_idx on public.properties (organization_id, status);
create index properties_published_idx on public.properties (status) where status = 'published';
create index properties_org_idx on public.properties (organization_id);

create trigger properties_touch_updated_at
  before update on public.properties
  for each row execute function public.touch_updated_at();

create or replace function public.enforce_property_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  limit_value integer;
  current_count integer;
begin
  select p.max_listings into limit_value
  from public.organizations o
  join public.plans p on p.id = o.plan_id
  where o.id = new.organization_id;

  if limit_value is not null then
    select count(*) into current_count
    from public.properties
    where organization_id = new.organization_id;

    if current_count >= limit_value then
      raise exception 'plan_limit_exceeded: organization % has reached its plan limit of % listings',
        new.organization_id, limit_value
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger properties_enforce_limit
  before insert on public.properties
  for each row execute function public.enforce_property_limit();

alter table public.properties enable row level security;

create policy "properties_public_select"
  on public.properties
  for select
  using (status = 'published');

create policy "properties_member_select"
  on public.properties
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "properties_admin_insert"
  on public.properties
  for insert
  to authenticated
  with check (public.is_org_admin(organization_id));

create policy "properties_admin_update"
  on public.properties
  for update
  to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "properties_admin_delete"
  on public.properties
  for delete
  to authenticated
  using (public.is_org_admin(organization_id));

-- ── 8. property_images (Cloudinary-backed, no Supabase Storage) ────────────
-- cloudinary_public_id is the stable per-slot asset id the app uploads to
-- with overwrite:true — replacing a photo re-uploads onto the same asset
-- instead of creating a new one. unique() is the DB-side guarantee that two
-- rows never point at the same Cloudinary asset.
create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
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

-- ── 9. leads ─────────────────────────────────────────────────────────────
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  name text not null check (char_length(name) between 1 and 200),
  phone text not null check (char_length(phone) between 3 and 30),
  email text,
  message text check (message is null or char_length(message) <= 5000),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  assigned_to uuid references public.organization_members(id) on delete set null,
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_org_status_idx on public.leads (organization_id, status);
create index leads_org_created_idx on public.leads (organization_id, created_at desc);
create index leads_property_idx on public.leads (property_id);

create trigger leads_touch_updated_at
  before update on public.leads
  for each row execute function public.touch_updated_at();

alter table public.leads enable row level security;

create policy "leads_public_insert"
  on public.leads
  for insert
  with check (
    exists (
      select 1 from public.organizations o
      where o.id = leads.organization_id and o.is_public = true
    )
  );

create policy "leads_member_select"
  on public.leads
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "leads_admin_update"
  on public.leads
  for update
  to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "leads_admin_delete"
  on public.leads
  for delete
  to authenticated
  using (public.is_org_admin(organization_id));

-- ── 10. remaining indexes ───────────────────────────────────────────────
create index organizations_plan_id_idx on public.organizations (plan_id);
create index leads_assigned_to_idx on public.leads (assigned_to);
create index properties_listed_by_idx on public.properties (listed_by);
