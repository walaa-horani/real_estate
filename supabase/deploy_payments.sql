-- ---------------------------------------------------------------------------
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- Mirrors supabase/migrations/20260805000011_payments.sql, made re-runnable.
--
-- What it does:
--   1. Closes the "free plan" hole: revokes the org-creation RPC from
--      authenticated users and drops the open INSERT policy on organizations.
--   2. Creates payment_transactions (idempotency ledger, deny-all RLS).
--   3. Creates subscriptions (member-readable, never client-writable).
--   4. Creates apply_paid_transaction() — the single fulfilment path, granted
--      to service_role only.
--   5. Backfills a subscriptions row for organizations that already exist.
-- ---------------------------------------------------------------------------

-- 1. Close the free-provisioning hole --------------------------------------
revoke execute on function public.create_organization_with_admin(text, text, text)
  from authenticated;
revoke execute on function public.create_organization_with_admin(text, text, text)
  from anon;

drop policy if exists "organizations_authenticated_insert" on public.organizations;

-- 2. payment_transactions ---------------------------------------------------
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  cart_id text not null unique,
  tran_ref text unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  intent text not null default 'signup'
    check (intent in ('signup', 'upgrade')),
  organization_id uuid references public.organizations(id) on delete set null,
  organization_name text not null,
  organization_slug text not null check (organization_slug ~ '^[a-z0-9-]+$'),
  plan_id uuid not null references public.plans(id),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'canceled', 'mismatch')),
  failure_reason text,
  paytabs_request jsonb,
  paytabs_callback jsonb,
  paytabs_query jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_transactions_user_idx
  on public.payment_transactions (user_id, created_at desc);
create index if not exists payment_transactions_org_idx
  on public.payment_transactions (organization_id, created_at desc);
create index if not exists payment_transactions_status_idx
  on public.payment_transactions (status);

drop trigger if exists payment_transactions_touch_updated_at on public.payment_transactions;
create trigger payment_transactions_touch_updated_at
  before update on public.payment_transactions
  for each row execute function public.touch_updated_at();

alter table public.payment_transactions enable row level security;
-- Intentionally no policies: anon + authenticated are denied read and write.

-- 3. subscriptions ----------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique
    references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status text not null default 'active'
    check (status in ('active', 'past_due', 'canceled', 'expired')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  last_payment_transaction_id uuid references public.payment_transactions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_member_select" on public.subscriptions;
create policy "subscriptions_member_select"
  on public.subscriptions
  for select
  to authenticated
  using (public.is_org_member(organization_id));

-- 4. apply_paid_transaction() ----------------------------------------------
create or replace function public.apply_paid_transaction(
  p_cart_id text,
  p_tran_ref text,
  p_query_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  tx public.payment_transactions;
  v_org_id uuid;
  v_period_end timestamptz := now() + interval '1 month';
begin
  select * into tx
  from public.payment_transactions
  where cart_id = p_cart_id
  for update;

  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  if tx.status = 'paid' then
    return jsonb_build_object(
      'outcome', 'already_applied',
      'organization_id', tx.organization_id
    );
  end if;

  if tx.status <> 'pending' then
    return jsonb_build_object('outcome', 'not_pending', 'status', tx.status);
  end if;

  if tx.tran_ref is not null and tx.tran_ref <> p_tran_ref then
    return jsonb_build_object('outcome', 'tran_ref_mismatch');
  end if;

  if tx.intent = 'signup' then
    v_org_id := tx.organization_id;

    -- Reuse an org the payer already belongs to rather than trying to insert a
    -- second one (unique slug violation => PayTabs retries the callback forever).
    if v_org_id is null then
      select m.organization_id into v_org_id
      from public.organization_members m
      where m.user_id = tx.user_id
        and m.status = 'active'
      order by m.created_at
      limit 1;
    end if;

    if v_org_id is null then
      insert into public.organizations (slug, name, plan_id, created_by, plan_status)
      values (tx.organization_slug, tx.organization_name, tx.plan_id, tx.user_id, 'active')
      returning id into v_org_id;

      insert into public.organization_members (organization_id, user_id, role, status)
      values (v_org_id, tx.user_id, 'admin', 'active')
      on conflict (organization_id, user_id) do nothing;
    else
      update public.organizations
         set plan_id = tx.plan_id,
             plan_status = 'active'
       where id = v_org_id;
    end if;
  else
    v_org_id := tx.organization_id;

    if v_org_id is null then
      return jsonb_build_object('outcome', 'missing_organization');
    end if;

    if not exists (
      select 1 from public.organization_members m
      where m.organization_id = v_org_id
        and m.user_id = tx.user_id
        and m.role = 'admin'
        and m.status = 'active'
    ) then
      return jsonb_build_object('outcome', 'not_org_admin');
    end if;

    update public.organizations
       set plan_id = tx.plan_id,
           plan_status = 'active'
     where id = v_org_id;
  end if;

  insert into public.subscriptions (
    organization_id, plan_id, status,
    current_period_start, current_period_end, last_payment_transaction_id
  )
  values (v_org_id, tx.plan_id, 'active', now(), v_period_end, tx.id)
  on conflict (organization_id) do update
    set plan_id = excluded.plan_id,
        status = 'active',
        current_period_start = excluded.current_period_start,
        current_period_end = excluded.current_period_end,
        last_payment_transaction_id = excluded.last_payment_transaction_id;

  update public.payment_transactions
     set status = 'paid',
         tran_ref = p_tran_ref,
         organization_id = v_org_id,
         paytabs_query = p_query_payload,
         verified_at = now()
   where id = tx.id;

  return jsonb_build_object('outcome', 'applied', 'organization_id', v_org_id);
end;
$$;

revoke all on function public.apply_paid_transaction(text, text, jsonb) from public;
revoke all on function public.apply_paid_transaction(text, text, jsonb) from anon;
revoke all on function public.apply_paid_transaction(text, text, jsonb) from authenticated;
grant execute on function public.apply_paid_transaction(text, text, jsonb) to service_role;

-- 5. Backfill existing organizations ---------------------------------------
-- Organizations created before this migration (including yours) have no
-- subscriptions row. Give them one so the dashboard reads consistently. These
-- are grandfathered, not payment-verified — last_payment_transaction_id is null.
insert into public.subscriptions (
  organization_id, plan_id, status, current_period_start, current_period_end
)
select o.id, o.plan_id, 'active', o.created_at, now() + interval '1 month'
from public.organizations o
on conflict (organization_id) do nothing;

-- ---------------------------------------------------------------------------
-- 6. Fully automatic renewal (mirrors migrations/20260805000012_auto_renewal.sql)
--
-- No human touches billing after the first payment. pg_cron wakes up every
-- 30 minutes, and for each subscription past its current_period_end, calls
-- /api/paytabs/renew, which charges the token saved from checkout and applies
-- the same signature/re-query/amount/currency verification as a fresh payment.
-- ---------------------------------------------------------------------------

alter table public.subscriptions
  add column if not exists paytabs_token text,
  add column if not exists next_renewal_attempt_at timestamptz,
  add column if not exists failed_renewal_count integer not null default 0;

alter table public.payment_transactions
  drop constraint if exists payment_transactions_intent_check,
  add constraint payment_transactions_intent_check
    check (intent in ('signup', 'upgrade', 'renewal'));

alter table public.payment_transactions
  add column if not exists token text;

create or replace function public.apply_paid_transaction(
  p_cart_id text,
  p_tran_ref text,
  p_query_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  tx public.payment_transactions;
  v_org_id uuid;
  v_period_end timestamptz := now() + interval '1 month';
  v_token text := nullif(p_query_payload->>'token', '');
begin
  select * into tx
  from public.payment_transactions
  where cart_id = p_cart_id
  for update;

  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  if tx.status = 'paid' then
    return jsonb_build_object(
      'outcome', 'already_applied',
      'organization_id', tx.organization_id
    );
  end if;

  if tx.status <> 'pending' then
    return jsonb_build_object('outcome', 'not_pending', 'status', tx.status);
  end if;

  if tx.tran_ref is not null and tx.tran_ref <> p_tran_ref then
    return jsonb_build_object('outcome', 'tran_ref_mismatch');
  end if;

  if tx.intent = 'signup' then
    v_org_id := tx.organization_id;

    if v_org_id is null then
      select m.organization_id into v_org_id
      from public.organization_members m
      where m.user_id = tx.user_id
        and m.status = 'active'
      order by m.created_at
      limit 1;
    end if;

    if v_org_id is null then
      insert into public.organizations (slug, name, plan_id, created_by, plan_status)
      values (tx.organization_slug, tx.organization_name, tx.plan_id, tx.user_id, 'active')
      returning id into v_org_id;

      insert into public.organization_members (organization_id, user_id, role, status)
      values (v_org_id, tx.user_id, 'admin', 'active')
      on conflict (organization_id, user_id) do nothing;
    else
      update public.organizations
         set plan_id = tx.plan_id,
             plan_status = 'active'
       where id = v_org_id;
    end if;
  else
    v_org_id := tx.organization_id;

    if v_org_id is null then
      return jsonb_build_object('outcome', 'missing_organization');
    end if;

    if not exists (
      select 1 from public.organization_members m
      where m.organization_id = v_org_id
        and m.user_id = tx.user_id
        and m.role = 'admin'
        and m.status = 'active'
    ) then
      return jsonb_build_object('outcome', 'not_org_admin');
    end if;

    update public.organizations
       set plan_id = tx.plan_id,
           plan_status = 'active'
     where id = v_org_id;
  end if;

  insert into public.subscriptions (
    organization_id, plan_id, status,
    current_period_start, current_period_end, last_payment_transaction_id,
    paytabs_token, next_renewal_attempt_at, failed_renewal_count
  )
  values (
    v_org_id, tx.plan_id, 'active', now(), v_period_end, tx.id,
    v_token, null, 0
  )
  on conflict (organization_id) do update
    set plan_id = excluded.plan_id,
        status = 'active',
        current_period_start = excluded.current_period_start,
        current_period_end = excluded.current_period_end,
        last_payment_transaction_id = excluded.last_payment_transaction_id,
        paytabs_token = coalesce(v_token, public.subscriptions.paytabs_token),
        next_renewal_attempt_at = null,
        failed_renewal_count = 0;

  update public.payment_transactions
     set status = 'paid',
         tran_ref = p_tran_ref,
         organization_id = v_org_id,
         paytabs_query = p_query_payload,
         token = v_token,
         verified_at = now()
   where id = tx.id;

  return jsonb_build_object('outcome', 'applied', 'organization_id', v_org_id);
end;
$$;

revoke all on function public.apply_paid_transaction(text, text, jsonb) from public;
revoke all on function public.apply_paid_transaction(text, text, jsonb) from anon;
revoke all on function public.apply_paid_transaction(text, text, jsonb) from authenticated;
grant execute on function public.apply_paid_transaction(text, text, jsonb) to service_role;

create or replace function public.claim_due_subscriptions_for_renewal(p_limit integer default 25)
returns setof public.subscriptions
language sql
security definer
set search_path = public
as $$
  update public.subscriptions s
  set next_renewal_attempt_at = now() + interval '30 minutes'
  from (
    select id
    from public.subscriptions
    where status = 'active'
      and current_period_end <= now()
      and (next_renewal_attempt_at is null or next_renewal_attempt_at <= now())
    order by current_period_end
    limit p_limit
    for update skip locked
  ) due
  where s.id = due.id
  returning s.*;
$$;

revoke all on function public.claim_due_subscriptions_for_renewal(integer) from public;
revoke all on function public.claim_due_subscriptions_for_renewal(integer) from anon;
revoke all on function public.claim_due_subscriptions_for_renewal(integer) from authenticated;
grant execute on function public.claim_due_subscriptions_for_renewal(integer) to service_role;

create or replace function public.apply_renewal_transaction(
  p_cart_id text,
  p_tran_ref text,
  p_query_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  tx public.payment_transactions;
begin
  select * into tx
  from public.payment_transactions
  where cart_id = p_cart_id
    and intent = 'renewal'
  for update;

  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  if tx.status = 'paid' then
    return jsonb_build_object('outcome', 'already_applied');
  end if;

  if tx.status <> 'pending' then
    return jsonb_build_object('outcome', 'not_pending', 'status', tx.status);
  end if;

  if tx.tran_ref is not null and tx.tran_ref <> p_tran_ref then
    return jsonb_build_object('outcome', 'tran_ref_mismatch');
  end if;

  if tx.organization_id is null then
    return jsonb_build_object('outcome', 'missing_organization');
  end if;

  update public.subscriptions
     set current_period_start = now(),
         current_period_end = now() + interval '1 month',
         status = 'active',
         failed_renewal_count = 0,
         next_renewal_attempt_at = null,
         last_payment_transaction_id = tx.id,
         paytabs_token = coalesce(nullif(p_query_payload->>'token', ''), paytabs_token)
   where organization_id = tx.organization_id;

  update public.organizations
     set plan_status = 'active'
   where id = tx.organization_id;

  update public.payment_transactions
     set status = 'paid',
         tran_ref = p_tran_ref,
         paytabs_query = p_query_payload,
         verified_at = now()
   where id = tx.id;

  return jsonb_build_object('outcome', 'applied', 'organization_id', tx.organization_id);
end;
$$;

revoke all on function public.apply_renewal_transaction(text, text, jsonb) from public;
revoke all on function public.apply_renewal_transaction(text, text, jsonb) from anon;
revoke all on function public.apply_renewal_transaction(text, text, jsonb) from authenticated;
grant execute on function public.apply_renewal_transaction(text, text, jsonb) to service_role;

create or replace function public.mark_renewal_failed(
  p_cart_id text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  tx public.payment_transactions;
  v_failed_count integer;
begin
  select * into tx
  from public.payment_transactions
  where cart_id = p_cart_id
    and intent = 'renewal'
  for update;

  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  update public.payment_transactions
     set status = 'failed',
         failure_reason = p_reason
   where id = tx.id
     and status = 'pending';

  update public.subscriptions
     set failed_renewal_count = failed_renewal_count + 1,
         next_renewal_attempt_at = now() + interval '6 hours'
   where organization_id = tx.organization_id
   returning failed_renewal_count into v_failed_count;

  if v_failed_count >= 3 then
    update public.organizations
       set plan_status = 'past_due'
     where id = tx.organization_id;
  end if;

  return jsonb_build_object('outcome', 'recorded', 'failed_renewal_count', v_failed_count);
end;
$$;

revoke all on function public.mark_renewal_failed(text, text) from public;
revoke all on function public.mark_renewal_failed(text, text) from anon;
revoke all on function public.mark_renewal_failed(text, text) from authenticated;
grant execute on function public.mark_renewal_failed(text, text) to service_role;

-- Scheduler: pg_cron -> pg_net -> /api/paytabs/renew every 30 minutes.
-- app_settings.renewal_endpoint_url/renewal_cron_secret start empty; the
-- job no-ops until you fill them in (see step 7 below).
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

drop trigger if exists app_settings_touch_updated_at on public.app_settings;
create trigger app_settings_touch_updated_at
  before update on public.app_settings
  for each row execute function public.touch_updated_at();

alter table public.app_settings enable row level security;
-- No policies: unreadable/unwritable by anon + authenticated on purpose.

insert into public.app_settings (key, value)
values
  ('renewal_endpoint_url', null),
  ('renewal_cron_secret', null)
on conflict (key) do nothing;

create or replace function public.trigger_subscription_renewal()
returns void
language plpgsql
security definer
set search_path = public, net
as $$
declare
  v_url text;
  v_secret text;
begin
  select value into v_url from public.app_settings where key = 'renewal_endpoint_url';
  select value into v_secret from public.app_settings where key = 'renewal_cron_secret';

  if v_url is null or v_url = '' then
    return;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-secret', coalesce(v_secret, '')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
end;
$$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'paytabs-renew-subscriptions') then
    perform cron.unschedule('paytabs-renew-subscriptions');
  end if;
end;
$$;

select cron.schedule(
  'paytabs-renew-subscriptions',
  '*/30 * * * *',
  $$select public.trigger_subscription_renewal();$$
);

-- ---------------------------------------------------------------------------
-- 7. LAST STEP — point the cron job at your real site.
--
-- Run these two updates yourself, filling in your actual public URL (an ngrok
-- URL if running locally — pg_net cannot reach localhost) and the exact value
-- of PAYTABS_RENEWAL_SECRET from .env.local:
--
--   update public.app_settings set value = 'https://YOUR-PUBLIC-URL/api/paytabs/renew'
--     where key = 'renewal_endpoint_url';
--   update public.app_settings set value = 'PASTE_PAYTABS_RENEWAL_SECRET_HERE'
--     where key = 'renewal_cron_secret';
-- ---------------------------------------------------------------------------
