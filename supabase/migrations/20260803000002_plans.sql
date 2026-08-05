-- Plan catalog: Basic / Pro / Enterprise. Not tenant-scoped, publicly readable.
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

-- Anyone (including anon) can read active plans — needed for public pricing/signup page
create policy "plans_public_select"
  on public.plans
  for select
  using (true);

-- No insert/update/delete policies for authenticated/anon: plans are managed via
-- migrations / service_role only.
