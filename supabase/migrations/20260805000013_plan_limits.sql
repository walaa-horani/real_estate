-- ---------------------------------------------------------------------------
-- Enforce the remaining numeric plan limits (max_team_members,
-- max_images_per_listing) as DB triggers, same pattern as
-- enforce_property_limit() for max_listings. These run on every insert
-- regardless of which client performs it (RLS-scoped or service-role), so
-- there is no code path — admin client, RPC, future API route — that can
-- silently bypass a plan's limit.
--
-- The 7 boolean feature flags in plans.features (custom_branding,
-- api_access, advanced_analytics, priority_support, automated_marketing,
-- lead_automation, dedicated_account_manager) are deliberately left alone:
-- none of them correspond to a feature that exists in this codebase yet, so
-- there is nothing real to gate. Enforcing a flag for a feature that was
-- never built would just be a different kind of mock.
-- ---------------------------------------------------------------------------

create or replace function public.enforce_team_member_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  limit_value integer;
  current_count integer;
begin
  select p.max_team_members into limit_value
  from public.organizations o
  join public.plans p on p.id = o.plan_id
  where o.id = new.organization_id;

  if limit_value is not null then
    -- 'invited' consumes a seat the same as 'active' — an admin shouldn't be
    -- able to out-invite the limit and only find out when someone accepts.
    select count(*) into current_count
    from public.organization_members
    where organization_id = new.organization_id
      and status in ('active', 'invited');

    if current_count >= limit_value then
      raise exception 'plan_limit_exceeded: organization % has reached its plan limit of % team members',
        new.organization_id, limit_value
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists organization_members_enforce_limit on public.organization_members;
create trigger organization_members_enforce_limit
  before insert on public.organization_members
  for each row execute function public.enforce_team_member_limit();

create or replace function public.enforce_image_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  limit_value integer;
  current_count integer;
begin
  select p.max_images_per_listing into limit_value
  from public.properties prop
  join public.organizations o on o.id = prop.organization_id
  join public.plans p on p.id = o.plan_id
  where prop.id = new.property_id;

  if limit_value is not null then
    select count(*) into current_count
    from public.property_images
    where property_id = new.property_id;

    if current_count >= limit_value then
      raise exception 'plan_limit_exceeded: property % has reached its plan limit of % images',
        new.property_id, limit_value
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists property_images_enforce_limit on public.property_images;
create trigger property_images_enforce_limit
  before insert on public.property_images
  for each row execute function public.enforce_image_limit();
