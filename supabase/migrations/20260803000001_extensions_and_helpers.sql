-- Extensions
create extension if not exists pgcrypto;

-- Generic updated_at maintenance trigger, reused by several tables
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
