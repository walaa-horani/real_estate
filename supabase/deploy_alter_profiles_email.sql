-- =============================================================================
-- Run in Supabase SQL Editor on an already-deployed project to add
-- profiles.email (needed so the dashboard Team page can display member
-- emails without touching the RLS-hidden auth.users table). Skip on a fresh
-- project — deploy_schema.sql already includes this column.
-- =============================================================================

alter table public.profiles add column if not exists email text;

-- Backfill existing profiles from auth.users.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;
