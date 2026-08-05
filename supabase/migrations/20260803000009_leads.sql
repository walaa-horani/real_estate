-- Contact-form submissions from public site visitors to an agency.
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

-- Anyone (anon or authenticated) can submit an inquiry, but only against a
-- real, publicly listed organization. No USING clause needed: it doesn't
-- apply to INSERT.
create policy "leads_public_insert"
  on public.leads
  for insert
  with check (
    exists (
      select 1 from public.organizations o
      where o.id = leads.organization_id and o.is_public = true
    )
  );

-- Deliberately no anon/public SELECT policy: absence of a matching policy
-- combined with RLS enabled means anon gets zero rows back. Only org members
-- can read their own organization's leads.
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
