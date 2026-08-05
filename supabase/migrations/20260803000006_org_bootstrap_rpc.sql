-- Atomically create an organization plus its first admin membership.
-- Exists to avoid the chicken-and-egg problem: a freshly signed-up user isn't
-- yet a member of any org, so a raw client-side insert into
-- organization_members would be rejected by org_members_insert's
-- is_org_admin() check. This function runs as SECURITY DEFINER to perform
-- both inserts in one transaction.
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
