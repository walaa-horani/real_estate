-- ---------------------------------------------------------------------------
-- PayTabs payments + subscriptions.
--
-- Security model, in one sentence: subscription state is never derived from
-- anything the browser says.
--
-- The ONLY code path that can mark a payment paid, create an organization, or
-- move an organization onto a different plan is apply_paid_transaction().
-- That function is SECURITY DEFINER and is granted to service_role only, so it
-- is unreachable from an anon/authenticated Supabase client. In the app it is
-- called from exactly one place: the server-to-server PayTabs callback handler,
-- and only after (a) the callback's HMAC-SHA256 signature verifies against our
-- server key and (b) an independent /payment/query call to PayTabs confirms the
-- transaction, its amount, its currency and its cart reference.
--
-- The browser return URL performs no writes at all — it only reads status.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Close the free-provisioning hole.
--
-- create_organization_with_admin() was granted to `authenticated` so the old
-- (unpaid) signup flow could call it straight from a server action. Any signed
-- in user could therefore self-provision an Enterprise organization without
-- ever paying. Organizations are now created exclusively inside
-- apply_paid_transaction(), so that grant is revoked.
--
-- Same reasoning for organizations_authenticated_insert: it allowed a raw
-- INSERT into organizations with `with check (true)`.
-- ---------------------------------------------------------------------------
revoke execute on function public.create_organization_with_admin(text, text, text)
  from authenticated;
revoke execute on function public.create_organization_with_admin(text, text, text)
  from anon;

drop policy if exists "organizations_authenticated_insert" on public.organizations;

-- ---------------------------------------------------------------------------
-- payment_transactions: the idempotency ledger + audit trail.
-- ---------------------------------------------------------------------------
create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),

  -- Our idempotency key, generated before redirecting the buyer to PayTabs and
  -- sent as PayTabs' cart_id. Every callback (including replays and retries)
  -- maps back to exactly one row via this column.
  cart_id text not null unique,

  -- PayTabs' own reference. UNIQUE so the same PayTabs transaction can never be
  -- applied against two different carts.
  tran_ref text unique,

  user_id uuid not null references auth.users(id) on delete cascade,

  intent text not null default 'signup'
    check (intent in ('signup', 'upgrade')),

  -- 'signup': the organization does not exist yet — name/slug below describe
  -- what to create once payment is confirmed.
  -- 'upgrade': organization_id must be set and the payer must still be one of
  -- its active admins at apply time.
  organization_id uuid references public.organizations(id) on delete set null,
  organization_name text not null,
  organization_slug text not null check (organization_slug ~ '^[a-z0-9-]+$'),

  plan_id uuid not null references public.plans(id),

  -- Expected price, snapshotted from public.plans at checkout time. The
  -- callback compares PayTabs' authoritative amount/currency against these; any
  -- mismatch marks the row 'mismatch' and grants nothing.
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),

  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'canceled', 'mismatch')),
  failure_reason text,

  -- Raw payloads kept for dispute/forensics. paytabs_query is the authoritative
  -- one: it came from our own outbound call, not from an inbound request.
  paytabs_request jsonb,
  paytabs_callback jsonb,
  paytabs_query jsonb,
  verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payment_transactions_user_idx
  on public.payment_transactions (user_id, created_at desc);
create index payment_transactions_org_idx
  on public.payment_transactions (organization_id, created_at desc);
create index payment_transactions_status_idx
  on public.payment_transactions (status);

create trigger payment_transactions_touch_updated_at
  before update on public.payment_transactions
  for each row execute function public.touch_updated_at();

alter table public.payment_transactions enable row level security;

-- Deliberately ZERO policies: anon and authenticated are fully denied, both
-- read and write. Billing rows are only ever touched by server code holding the
-- service role key. The signup status screen reads its own row through a server
-- action that re-filters on the session's user_id.

-- ---------------------------------------------------------------------------
-- subscriptions: current billing state per organization.
--
-- Kept off the organizations table on purpose — organizations doubles as the
-- public storefront record and every column there must be safe to expose.
-- organizations.plan_id/plan_status stay as the hot-path entitlement lookup and
-- are written in the same transaction as this row.
-- ---------------------------------------------------------------------------
create table public.subscriptions (
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

create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

alter table public.subscriptions enable row level security;

-- Members may read their own org's subscription (the dashboard shows the plan
-- and renewal date). No client write policies at all — writes are service-role
-- only, from the verified callback.
create policy "subscriptions_member_select"
  on public.subscriptions
  for select
  to authenticated
  using (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- apply_paid_transaction(): the single fulfilment path.
--
-- Idempotency is enforced here rather than in application code:
--   * SELECT ... FOR UPDATE takes a row lock on the cart, so two callbacks
--     arriving at once serialize instead of both fulfilling.
--   * The status = 'pending' guard means the second one exits as
--     'already_applied' without granting anything a second time.
--
-- Callers must have already verified the signature and re-queried PayTabs.
-- This function does not talk to PayTabs and does not trust p_query_payload for
-- anything except storage — amount/currency checks happen in the caller against
-- the snapshot columns above, because only the caller has the raw API response.
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

  -- If we already recorded a reference at checkout, the callback must be about
  -- that same PayTabs transaction.
  if tx.tran_ref is not null and tx.tran_ref <> p_tran_ref then
    return jsonb_build_object('outcome', 'tran_ref_mismatch');
  end if;

  if tx.intent = 'signup' then
    v_org_id := tx.organization_id;

    -- The user may already have an org by the time this lands (they paid twice,
    -- or an upgrade raced a signup). Creating a second one would blow up on the
    -- unique slug and make PayTabs retry the callback forever, so reuse it and
    -- treat the payment as a plan change instead.
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

    -- Re-checked at apply time, not just at checkout: an admin who was removed
    -- between starting and completing a payment must not be able to move that
    -- tenant's plan.
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

-- PostgreSQL grants EXECUTE to PUBLIC by default — revoke first, then hand it
-- to service_role alone. anon/authenticated must never reach this.
revoke all on function public.apply_paid_transaction(text, text, jsonb) from public;
revoke all on function public.apply_paid_transaction(text, text, jsonb) from anon;
revoke all on function public.apply_paid_transaction(text, text, jsonb) from authenticated;
grant execute on function public.apply_paid_transaction(text, text, jsonb) to service_role;
