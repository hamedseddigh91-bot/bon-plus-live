create table if not exists public.finance_opening_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  period_month date not null,
  amount numeric(12,3) not null default 0 check (amount >= 0),
  source_period_month date null,
  notes text null,
  created_by uuid null,
  created_by_email text null,
  updated_by uuid null,
  updated_by_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, period_month)
);

alter table public.finance_opening_entries enable row level security;

create or replace function public.admin_save_finance_period_fast(
  p_slug text,
  p_period_month date,
  p_opening_petty_cash numeric,
  p_notes text,
  p_actor_auth_user_id uuid,
  p_actor_email text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_context record;
  v_period_month date := public._finance_period_month(p_period_month);
  v_existing record;
begin
  select * into v_context
  from public._operations_get_context(p_slug, p_actor_auth_user_id, p_actor_email)
  limit 1;

  if v_context.business_id is null then
    return jsonb_build_object('success', false, 'message', 'Business access was not found.');
  end if;

  if v_context.actor_role::text not in ('owner', 'manager', 'accountant') then
    return jsonb_build_object('success', false, 'message', 'You do not have finance access.');
  end if;

  select * into v_existing
  from public.finance_periods
  where business_id = v_context.business_id
    and period_month = v_period_month
  limit 1;

  if v_existing.id is not null and v_existing.status = 'closed' then
    return jsonb_build_object('success', false, 'message', 'This period is closed. Reopen it before editing.');
  end if;

  insert into public.finance_periods (
    business_id, period_month, status, opening_petty_cash, notes,
    created_by, created_by_email, updated_at
  ) values (
    v_context.business_id, v_period_month, 'open',
    greatest(coalesce(p_opening_petty_cash, 0), 0),
    nullif(trim(coalesce(p_notes, '')), ''),
    p_actor_auth_user_id, lower(trim(coalesce(p_actor_email, ''))), now()
  )
  on conflict (business_id, period_month)
  do update set
    opening_petty_cash = excluded.opening_petty_cash,
    notes = excluded.notes,
    updated_at = now();

  insert into public.finance_opening_entries (
    business_id, period_month, amount, notes,
    created_by, created_by_email, updated_by, updated_by_email, updated_at
  ) values (
    v_context.business_id, v_period_month,
    greatest(coalesce(p_opening_petty_cash, 0), 0),
    nullif(trim(coalesce(p_notes, '')), ''),
    p_actor_auth_user_id, lower(trim(coalesce(p_actor_email, ''))),
    p_actor_auth_user_id, lower(trim(coalesce(p_actor_email, ''))), now()
  )
  on conflict (business_id, period_month)
  do update set
    amount = excluded.amount,
    notes = excluded.notes,
    updated_by = excluded.updated_by,
    updated_by_email = excluded.updated_by_email,
    updated_at = now();

  return jsonb_build_object('success', true, 'message', 'Finance period and opening entry saved.');
exception
  when others then
    return jsonb_build_object('success', false, 'message', sqlerrm);
end;
$$;

create or replace function public.admin_close_finance_period_fast(
  p_slug text,
  p_period_month date,
  p_closing_petty_cash numeric,
  p_notes text,
  p_actor_auth_user_id uuid,
  p_actor_email text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_context record;
  v_period_month date := public._finance_period_month(p_period_month);
  v_next_month date := (public._finance_period_month(p_period_month) + interval '1 month')::date;
  v_carry numeric(12,3) := greatest(coalesce(p_closing_petty_cash, 0), 0);
begin
  select * into v_context
  from public._operations_get_context(p_slug, p_actor_auth_user_id, p_actor_email)
  limit 1;

  if v_context.business_id is null then
    return jsonb_build_object('success', false, 'message', 'Business access was not found.');
  end if;

  if v_context.actor_role::text not in ('owner', 'manager', 'accountant') then
    return jsonb_build_object('success', false, 'message', 'You do not have finance access.');
  end if;

  insert into public.finance_periods (
    business_id, period_month, status, opening_petty_cash, closing_petty_cash,
    notes, closed_by, closed_by_email, closed_at,
    created_by, created_by_email, updated_at
  ) values (
    v_context.business_id, v_period_month, 'closed', 0, v_carry,
    nullif(trim(coalesce(p_notes, '')), ''),
    p_actor_auth_user_id, p_actor_email, now(),
    p_actor_auth_user_id, p_actor_email, now()
  )
  on conflict (business_id, period_month)
  do update set
    status = 'closed',
    closing_petty_cash = excluded.closing_petty_cash,
    notes = coalesce(excluded.notes, public.finance_periods.notes),
    closed_by = excluded.closed_by,
    closed_by_email = excluded.closed_by_email,
    closed_at = now(),
    updated_at = now();

  update public.finance_periods
  set status = 'closed', updated_at = now()
  where business_id = v_context.business_id
    and period_month <> v_next_month
    and status = 'open';

  insert into public.finance_periods (
    business_id, period_month, status, opening_petty_cash,
    created_by, created_by_email, updated_at
  ) values (
    v_context.business_id, v_next_month, 'open', v_carry,
    p_actor_auth_user_id, lower(trim(coalesce(p_actor_email, ''))), now()
  )
  on conflict (business_id, period_month)
  do update set
    status = 'open',
    opening_petty_cash = excluded.opening_petty_cash,
    updated_at = now();

  insert into public.finance_opening_entries (
    business_id, period_month, amount, source_period_month, notes,
    created_by, created_by_email, updated_by, updated_by_email, updated_at
  ) values (
    v_context.business_id, v_next_month, v_carry, v_period_month,
    'Auto carry forward from ' || to_char(v_period_month, 'YYYY-MM'),
    p_actor_auth_user_id, lower(trim(coalesce(p_actor_email, ''))),
    p_actor_auth_user_id, lower(trim(coalesce(p_actor_email, ''))), now()
  )
  on conflict (business_id, period_month)
  do update set
    amount = excluded.amount,
    source_period_month = excluded.source_period_month,
    notes = excluded.notes,
    updated_by = excluded.updated_by,
    updated_by_email = excluded.updated_by_email,
    updated_at = now();

  return jsonb_build_object(
    'success', true,
    'message', 'Period closed. Next month opened with editable opening entry.',
    'nextPeriod', v_next_month,
    'openingBalance', v_carry
  );
exception
  when others then
    return jsonb_build_object('success', false, 'message', sqlerrm);
end;
$$;
