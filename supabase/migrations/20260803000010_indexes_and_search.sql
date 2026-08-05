-- Remaining supporting indexes not already covered by unique/FK constraints.
create index organizations_plan_id_idx on public.organizations (plan_id);
create index leads_assigned_to_idx on public.leads (assigned_to);
create index properties_listed_by_idx on public.properties (listed_by);
