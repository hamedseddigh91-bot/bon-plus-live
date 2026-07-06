create table if not exists public.user_module_permissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  business_user_id uuid not null references public.business_users(id) on delete cascade,
  module_key text not null,
  can_view boolean not null default false,
  can_edit boolean not null default false,
  updated_by_auth_user_id uuid null,
  updated_by_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_module_permissions_edit_requires_view check (not can_edit or can_view),
  constraint user_module_permissions_unique unique (business_user_id, module_key)
);

create index if not exists user_module_permissions_business_idx on public.user_module_permissions(business_id);
create index if not exists user_module_permissions_user_idx on public.user_module_permissions(business_user_id);

alter table public.user_module_permissions enable row level security;
