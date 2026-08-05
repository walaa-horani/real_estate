-- Bridge table: which auth.users belong to which organizations, with what role.
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

-- Last-admin protection: an org can never end up with zero admins.
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

-- ---------------------------------------------------------------------------
-- Non-recursive RLS helpers.
--
-- organization_members' own RLS policies cannot query organization_members via
-- a plain subquery — that would re-trigger the same policy and recurse.
-- SECURITY DEFINER functions bypass RLS internally, breaking the cycle.
-- search_path is pinned to prevent search_path hijacking.
-- ---------------------------------------------------------------------------

-- True for any active member of the org (admin or member role) — used for
-- read access and for tenant-isolation checks ("does this user belong here").
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

-- True only for an active admin of the org — used to gate every write.
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

-- ---------------------------------------------------------------------------
-- Now that is_org_member/is_org_admin exist, add the member-visibility and
-- write policies on organizations that depend on them.
-- ---------------------------------------------------------------------------

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

-- Cross-member profile visibility, deferred from the profiles migration
-- until shares_org_with() exists.
create policy "profiles_org_member_select"
  on public.profiles
  for select
  to authenticated
  using (public.shares_org_with(id));
