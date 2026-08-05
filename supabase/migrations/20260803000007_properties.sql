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

-- Enforce plans.max_listings as a hard safety net against concurrent inserts
-- racing past an app-level pre-check. null max_listings = unlimited.
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
