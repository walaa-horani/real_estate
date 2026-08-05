-- Tenant table. Also doubles as the public agency storefront record —
-- every column here must be safe to expose publicly when is_public = true.
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

-- Public/anon can see published storefronts. Real membership-based access
-- is added in the organization_members migration once is_org_member() exists.
create policy "organizations_public_select"
  on public.organizations
  for select
  using (is_public = true);

-- Any signed-in user may create an org row. In practice creation is expected to
-- go through the create_organization_with_owner() RPC (see later migration) so
-- the owner membership row is created atomically in the same transaction.
create policy "organizations_authenticated_insert"
  on public.organizations
  for insert
  to authenticated
  with check (true);
