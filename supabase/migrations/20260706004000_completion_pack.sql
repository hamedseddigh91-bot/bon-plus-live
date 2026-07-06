-- Bon Plus completion pack: logo storage, loyalty rule labels, follow-up WhatsApp template,
-- and external review integration registry/import deduplication.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-assets',
  'business-assets',
  true,
  5242880,
  array['image/png','image/jpeg','image/webp','image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.loyalty_program_rules
  add column if not exists reward_label text null;

insert into public.whatsapp_message_templates (
  business_id, template_key, label, message_fa, message_ar, message_en, sort_order
)
select
  b.id,
  'followup',
  'Follow-up message',
  'سلام {customer_name}، برای پیگیری بازخورد شما پیام می‌دهیم. موضوع شما در حال بررسی است و نتیجه را با شما در میان می‌گذاریم.',
  'مرحباً {customer_name}، نتواصل معك لمتابعة ملاحظاتك. يتم الآن مراجعة الموضوع وسنشاركك النتيجة.',
  'Hi {customer_name}, we are following up on your feedback. Your case is being reviewed and we will share the outcome with you.',
  35
from public.businesses b
on conflict (business_id, template_key) do nothing;

create table if not exists public.external_review_integrations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  provider text not null check (provider in ('google','talabat')),
  is_enabled boolean not null default false,
  account_id text null,
  location_id text null,
  business_slug text null,
  last_synced_at timestamptz null,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, provider)
);

create table if not exists public.external_review_imports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  provider text not null check (provider in ('google','talabat')),
  external_review_id text not null,
  reviewer_name text null,
  rating numeric null,
  comment text null,
  review_created_at timestamptz null,
  feedback_submission_id uuid null references public.feedback_submissions(id) on delete set null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (business_id, provider, external_review_id)
);

create index if not exists external_review_integrations_enabled_idx
  on public.external_review_integrations(provider, is_enabled);
create index if not exists external_review_imports_business_created_idx
  on public.external_review_imports(business_id, created_at desc);

alter table public.external_review_integrations enable row level security;
alter table public.external_review_imports enable row level security;

insert into public.external_review_integrations (business_id, provider, business_slug)
select id, 'google', slug from public.businesses
on conflict (business_id, provider) do nothing;
insert into public.external_review_integrations (business_id, provider, business_slug)
select id, 'talabat', slug from public.businesses
on conflict (business_id, provider) do nothing;

alter table public.loyalty_customer_counters
  add column if not exists pending_rewards integer not null default 0 check (pending_rewards >= 0);

create table if not exists public.loyalty_reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  counter_id uuid not null references public.loyalty_customer_counters(id) on delete cascade,
  phone text not null,
  rule_id uuid not null references public.loyalty_program_rules(id) on delete cascade,
  reward_type text not null,
  reward_value numeric not null default 0,
  reward_label text null,
  redeemed_at timestamptz not null default now(),
  redeemed_by uuid null,
  redeemed_by_email text null
);

create index if not exists loyalty_reward_redemptions_business_idx
  on public.loyalty_reward_redemptions(business_id, redeemed_at desc);
alter table public.loyalty_reward_redemptions enable row level security;
