-- =============================================================================
-- Run in Supabase SQL Editor to collapse the 4-role model (owner/admin/agent/
-- viewer) down to 2 roles (admin/member) on an already-deployed project.
-- Skip entirely on a brand-new project — deploy_schema.sql already has the
-- 2-role model.
-- =============================================================================

-- 1. Migrate existing role data before the check constraint changes.
update public.organization_members set role = 'admin' where role in ('owner', 'admin');
update public.organization_members set role = 'member' where role in ('agent', 'viewer');

-- 2. Drop old policies that reference has_org_role (must drop before the
-- function can be dropped).
drop policy if exists "org_members_insert" on public.organization_members;
drop policy if exists "org_members_update" on public.organization_members;
drop policy if exists "org_members_delete" on public.organization_members;
drop policy if exists "organizations_admin_update" on public.organizations;
drop policy if exists "organizations_owner_delete" on public.organizations;
drop policy if exists "properties_agent_insert" on public.properties;
drop policy if exists "properties_update" on public.properties;
drop policy if exists "properties_admin_delete" on public.properties;
drop policy if exists "property_images_agent_insert" on public.property_images;
drop policy if exists "property_images_agent_update" on public.property_images;
drop policy if exists "property_images_agent_delete" on public.property_images;
drop policy if exists "leads_admin_update" on public.leads;
drop policy if exists "leads_admin_delete" on public.leads;

-- 3. Drop old last-owner trigger/function and has_org_role.
drop trigger if exists organization_members_prevent_last_owner_removal on public.organization_members;
drop function if exists public.prevent_last_owner_removal();
drop function if exists public.has_org_role(uuid, text);

-- 4. Swap the role check constraint to 2 values.
alter table public.organization_members drop constraint if exists organization_members_role_check;
alter table public.organization_members add constraint organization_members_role_check
  check (role in ('admin', 'member'));

-- 5. New last-admin protection.
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

-- 6. New is_org_admin() helper (replaces has_org_role).
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

grant execute on function public.is_org_admin(uuid) to authenticated, anon;

-- 7. Recreate all dependent policies using is_org_admin.
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

-- 8. Rename the bootstrap RPC (owner -> admin terminology). Old function is
-- dropped since nothing has called it yet (no signup flow was wired to it).
drop function if exists public.create_organization_with_owner(text, text, text);

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
