alter table public.discount_codes
  add column if not exists early_reminder_sent_at timestamptz,
  add column if not exists early_reminder_sent_by uuid references auth.users(id) on delete set null,
  add column if not exists expiry_reminder_sent_at timestamptz,
  add column if not exists expiry_reminder_sent_by uuid references auth.users(id) on delete set null;

create index if not exists idx_discount_codes_reminder_workflow
  on public.discount_codes (business_id, status, expires_at)
  where status = 'active';
