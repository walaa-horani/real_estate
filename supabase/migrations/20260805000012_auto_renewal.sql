-- ---------------------------------------------------------------------------
-- Fully automatic subscription renewal.
--
-- The first payment (apply_paid_transaction, previous migration) also asks
-- PayTabs to tokenise the card (tran_class 'sale' + tokenise:2 — see
-- src/lib/actions/checkout.ts). The token it returns is stored on
-- subscriptions.paytabs_token. From then on, no human ever revisits billing:
-- a Postgres cron job wakes up every 30 minutes, finds subscriptions whose
-- current_period_end has passed, and calls a server route that charges the
-- saved token directly (tran_class 'recurring') — same signature/re-query/
-- amount/currency verification as the original checkout, just without a
-- browser in the loop.
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

-- ---------------------------------------------------------------------------
-- apply_paid_transaction: now also persists whatever token PayTabs returned,
-- so the very first payment already enrolls the org in auto-renewal.
-- CREATE OR REPLACE keeps the same signature-check/idempotency body from the
-- previous migration; only the token bookkeeping is new.
-- ---------------------------------------------------------------------------
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
        -- Keep the previous token if this payment didn't return a new one
        -- rather than overwriting a working saved card with null.
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

-- ---------------------------------------------------------------------------
-- claim_due_subscriptions_for_renewal(): the renewal endpoint's work queue.
--
-- `for update skip locked` means two overlapping cron runs (or a manual retry
-- racing the schedule) split the due subscriptions between them instead of
-- both charging the same one. Claiming also stamps next_renewal_attempt_at
-- forward as a soft lock, so a subscription that's mid-charge doesn't get
-- claimed again by the next tick before the first attempt finishes.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- apply_renewal_transaction(): fulfilment for a successful recurring charge.
-- Mirrors apply_paid_transaction's lock+status-guard idempotency, but extends
-- an existing subscription instead of creating an organization.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- mark_renewal_failed(): a declined/mismatched recurring charge.
-- Backs off the next attempt and, after 3 consecutive failures, flags the
-- organization past_due so the dashboard can surface it — access itself is
-- intentionally not cut off here; that's a product decision for later, not
-- something to bury silently inside a payments migration.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Scheduler: pg_cron calls a tiny SQL wrapper every 30 minutes, which uses
-- pg_net to POST to our own /api/paytabs/renew route. The cron job itself runs
-- as the Postgres superuser and reads app_settings directly (RLS never
-- applies to table owners/superusers), so app_settings can stay locked down
-- with no client-facing policies at all.
--
-- app_settings.renewal_endpoint_url / renewal_cron_secret start empty on
-- purpose — they depend on values (site URL, a shared secret) that only exist
-- outside the database. Fill them in after deploying:
--
--   update public.app_settings set value = 'https://your-domain/api/paytabs/renew'
--     where key = 'renewal_endpoint_url';
--   update public.app_settings set value = '<same value as PAYTABS_RENEWAL_SECRET>'
--     where key = 'renewal_cron_secret';
--
-- Until renewal_endpoint_url is set, trigger_subscription_renewal() is a no-op
-- — no subscriptions can silently start failing to renew just because this
-- migration ran before the URL was known.
-- ---------------------------------------------------------------------------
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
-- No policies: unreadable and unwritable by anon/authenticated. Only the
-- table owner (migrations, SQL Editor) and superuser-run cron jobs touch it.

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

-- Re-runnable: drop any existing job with this name before scheduling again,
-- since cron.schedule() errors on a duplicate name rather than upserting.
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
