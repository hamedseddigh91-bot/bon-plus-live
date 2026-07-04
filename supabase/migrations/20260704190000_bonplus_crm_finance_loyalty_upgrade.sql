-- Bon Plus CRM / Finance / Loyalty upgrade

create table if not exists public.loyalty_program_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  category_key text not null,
  threshold_count integer not null check (threshold_count > 0),
  reward_type text not null check (reward_type in ('percentage','fixed','free_item')),
  reward_value numeric not null default 0,
  message_en text not null default '',
  message_ar text not null default '',
  message_fa text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists loyalty_program_rules_business_idx on public.loyalty_program_rules(business_id, is_active);

create table if not exists public.loyalty_customer_counters (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid null references public.customers(id) on delete set null,
  phone text not null,
  rule_id uuid not null references public.loyalty_program_rules(id) on delete cascade,
  current_count integer not null default 0 check (current_count >= 0),
  total_count integer not null default 0 check (total_count >= 0),
  last_purchase_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, phone, rule_id)
);

create index if not exists loyalty_customer_counters_business_phone_idx on public.loyalty_customer_counters(business_id, phone);

alter table public.loyalty_program_rules enable row level security;
alter table public.loyalty_customer_counters enable row level security;

-- Auto-create recovery workflow for every score <= 2, regardless of feedback source.
create or replace function public._auto_start_low_score_recovery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case_id uuid;
begin
  if coalesce(new.overall_score, 5) > 2 then
    return new;
  end if;

  insert into public.feedback_recovery_cases (
    business_id, feedback_submission_id, customer_id, phone,
    status, priority, started_at
  )
  values (
    new.business_id, new.id, new.customer_id, new.phone,
    'open', case when new.overall_score <= 1 then 'urgent' else 'high' end, now()
  )
  on conflict (feedback_submission_id) do update set
    priority = excluded.priority,
    updated_at = now()
  returning id into v_case_id;

  if not exists (select 1 from public.feedback_recovery_tasks where case_id = v_case_id) then
    insert into public.feedback_recovery_tasks(case_id, step_order, title, description, status)
    values
      (v_case_id, 1, 'Review feedback', 'Read the review and identify the operational issue.', 'pending'),
      (v_case_id, 2, 'Investigate internally', 'Check the responsible area, order, shift, or service details.', 'pending'),
      (v_case_id, 3, 'Contact customer', 'Follow up with the customer and record the outcome.', 'pending'),
      (v_case_id, 4, 'Submit resolution', 'Record the action taken and submit the case for closure.', 'pending');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_auto_start_low_score_recovery on public.feedback_submissions;
create trigger trg_auto_start_low_score_recovery
after insert on public.feedback_submissions
for each row execute function public._auto_start_low_score_recovery();

-- Keep an editable opening entry synchronized with the period opening balance.
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
  select * into v_context from public._operations_get_context(p_slug, p_actor_auth_user_id, p_actor_email) limit 1;
  if v_context.business_id is null then return jsonb_build_object('success', false, 'message', 'Business access was not found.'); end if;
  if v_context.actor_role::text not in ('owner','manager','accountant') then return jsonb_build_object('success', false, 'message', 'You do not have finance access.'); end if;

  select * into v_existing from public.finance_periods where business_id=v_context.business_id and period_month=v_period_month limit 1;
  if v_existing.id is not null and v_existing.status='closed' then return jsonb_build_object('success', false, 'message', 'This period is closed. Reopen it before editing.'); end if;

  insert into public.finance_periods(business_id, period_month, status, opening_petty_cash, notes, created_by, created_by_email, updated_at)
  values(v_context.business_id, v_period_month, 'open', greatest(coalesce(p_opening_petty_cash,0),0), nullif(trim(coalesce(p_notes,'')),''), p_actor_auth_user_id, lower(trim(coalesce(p_actor_email,''))), now())
  on conflict (business_id, period_month) do update set opening_petty_cash=excluded.opening_petty_cash, notes=excluded.notes, updated_at=now();

  update public.finance_entries
  set amount=greatest(coalesce(p_opening_petty_cash,0),0), description=nullif(trim(coalesce(p_notes,'')),''), updated_at=now()
  where business_id=v_context.business_id and entry_type='opening_balance' and entry_date=v_period_month and status='active';

  if not found then
    insert into public.finance_entries(business_id, entry_date, entry_type, title, amount, payment_status, payer, usage_place, description, created_by, created_by_email)
    values(v_context.business_id, v_period_month, 'opening_balance', 'Opening balance ' || to_char(v_period_month,'YYYY-MM'), greatest(coalesce(p_opening_petty_cash,0),0), 'paid', 'system', 'general', nullif(trim(coalesce(p_notes,'')),''), p_actor_auth_user_id, lower(trim(coalesce(p_actor_email,''))));
  end if;

  return jsonb_build_object('success', true, 'message', 'Finance period and opening entry saved.');
exception when others then return jsonb_build_object('success', false, 'message', sqlerrm);
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
  v_carry numeric := greatest(coalesce(p_closing_petty_cash,0),0);
begin
  select * into v_context from public._operations_get_context(p_slug, p_actor_auth_user_id, p_actor_email) limit 1;
  if v_context.business_id is null then return jsonb_build_object('success', false, 'message', 'Business access was not found.'); end if;
  if v_context.actor_role::text not in ('owner','manager','accountant') then return jsonb_build_object('success', false, 'message', 'You do not have finance access.'); end if;

  update public.finance_periods set status='closed', closing_petty_cash=v_carry, notes=coalesce(nullif(trim(coalesce(p_notes,'')),''),notes), closed_by=p_actor_auth_user_id, closed_by_email=p_actor_email, closed_at=now(), updated_at=now()
  where business_id=v_context.business_id and period_month=v_period_month;
  if not found then
    insert into public.finance_periods(business_id,period_month,status,opening_petty_cash,closing_petty_cash,notes,closed_by,closed_by_email,closed_at,created_by,created_by_email)
    values(v_context.business_id,v_period_month,'closed',0,v_carry,nullif(trim(coalesce(p_notes,'')),''),p_actor_auth_user_id,p_actor_email,now(),p_actor_auth_user_id,p_actor_email);
  end if;

  update public.finance_periods set status='closed', updated_at=now()
  where business_id=v_context.business_id and period_month<>v_next_month and status='open';

  insert into public.finance_periods(business_id,period_month,status,opening_petty_cash,created_by,created_by_email)
  values(v_context.business_id,v_next_month,'open',v_carry,p_actor_auth_user_id,p_actor_email)
  on conflict (business_id,period_month) do update set status='open', opening_petty_cash=excluded.opening_petty_cash, updated_at=now();

  insert into public.finance_entries(business_id,entry_date,entry_type,title,amount,payment_status,payer,usage_place,description,created_by,created_by_email)
  values(v_context.business_id,v_next_month,'opening_balance','Opening balance '||to_char(v_next_month,'YYYY-MM'),v_carry,'paid','system','general','Auto carry forward from '||to_char(v_period_month,'YYYY-MM'),p_actor_auth_user_id,p_actor_email)
  on conflict do nothing;

  return jsonb_build_object('success', true, 'message', 'Period closed. Next month opened with editable opening entry.', 'nextPeriod', v_next_month, 'openingBalance', v_carry);
exception when others then return jsonb_build_object('success', false, 'message', sqlerrm);
end;
$$;
