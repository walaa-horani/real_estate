-- Run in Supabase SQL Editor. Removes the organizations_with_plan view —
-- app code now uses PostgREST's FK-embedding (organizations.plan_id -> plans.id)
-- directly instead, so this was redundant.
drop view if exists public.organizations_with_plan;
