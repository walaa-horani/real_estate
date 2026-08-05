-- Run in Supabase SQL Editor. Adds a read-only view joining organizations to
-- their plan name, browsable in Table Editor's left sidebar just like a table
-- (shows up under "Views"). Does not affect the app or RLS on the real tables.
create or replace view public.organizations_with_plan as
select
  o.id,
  o.slug,
  o.name as org_name,
  p.slug as plan_slug,
  p.name as plan_name,
  o.plan_status,
  o.is_public,
  o.created_at
from public.organizations o
join public.plans p on p.id = o.plan_id;
