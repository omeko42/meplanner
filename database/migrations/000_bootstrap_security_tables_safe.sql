-- =============================================================================
-- MEPlanner — All-in-One Safe Security Bootstrap (002 + 003 + 004 Tables & RLS)
-- =============================================================================
-- Jalankan file INI SATU KALI di Supabase Dashboard -> SQL Editor -> Run.
--
-- Kenapa aman untuk production?
--   1. Idempotent (aman dijalankan ulang berkali-kali).
--   2. Membuat semua tabel baru secara berurutan (tidak akan kena error
--      "relation public.tenants does not exist").
--   3. Menyalakan RLS ketat pada seluruh tabel baru (`app_user_credentials`,
--      `app_email_tokens`, `app_payment_orders`, `tenants`, `tenant_*`,
--      `audit_logs`, `app_user_profiles`).
--   4. TIDAK mencabut akses anon pada tabel legacy `wedding_state` dulu,
--      sehingga undangan publik tamu yang sudah tersebar tetap 100% live
--      sampai `SUPABASE_SERVICE_ROLE_KEY` sudah dipastikan terpasang di Vercel.
--      Setelah `SUPABASE_SERVICE_ROLE_KEY` terpasang di Vercel, jalankan
--      `002_credential_vault_and_rls.sql` untuk mengunci penuh tabel legacy.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- BAGIAN A: Credential Vault, Email Tokens & Server-Authoritative Payment Orders
-- -----------------------------------------------------------------------------
create table if not exists public.app_user_credentials (
  user_id text primary key,
  username text not null,
  email text,
  password_hash text not null,
  role text not null default 'PANITIA',
  client_id text,
  updated_at timestamptz not null default now()
);

create index if not exists app_user_credentials_username_idx
  on public.app_user_credentials (lower(username));
create index if not exists app_user_credentials_email_idx
  on public.app_user_credentials (lower(email));

alter table public.app_user_credentials enable row level security;
drop policy if exists "app_user_credentials_public_access" on public.app_user_credentials;
revoke all on table public.app_user_credentials from anon, authenticated;
grant all on table public.app_user_credentials to service_role;

create table if not exists public.app_email_tokens (
  id text primary key,
  email text not null,
  token_hash text not null,
  purpose text not null, -- 'VERIFY_EMAIL' | 'RESET_PASSWORD'
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists app_email_tokens_lookup_idx
  on public.app_email_tokens (email, purpose, consumed_at);
create index if not exists app_email_tokens_hash_idx
  on public.app_email_tokens (token_hash);

alter table public.app_email_tokens enable row level security;
drop policy if exists "app_email_tokens_public_access" on public.app_email_tokens;
revoke all on table public.app_email_tokens from anon, authenticated;
grant all on table public.app_email_tokens to service_role;

create table if not exists public.app_payment_orders (
  id text primary key,
  idempotency_key text not null unique,
  package_id text not null,
  package_tier text not null,
  currency text not null,
  amount_numeric numeric not null,
  channel_category text not null,
  channel_target_account text not null,
  buyer_email text not null,
  buyer_couple_name text,
  status text not null default 'PENDING_VERIFICATION',
  verified_at timestamptz,
  verified_by text,
  tx_reference text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_payment_orders_lookup_idx
  on public.app_payment_orders (idempotency_key, status);

alter table public.app_payment_orders enable row level security;
drop policy if exists "app_payment_orders_public_access" on public.app_payment_orders;
revoke all on table public.app_payment_orders from anon, authenticated;
grant all on table public.app_payment_orders to service_role;

-- -----------------------------------------------------------------------------
-- BAGIAN B: Multi-Tenant Core (`tenants` + `tenant_memberships` + Helpers)
-- -----------------------------------------------------------------------------
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  package_tier text not null default 'STARTER',
  owner_user_id uuid references auth.users(id) on delete set null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'PANITIA',  -- SUPERADMIN | OWNER | MEMPELAI | PANITIA
  status text not null default 'ACTIVE', -- ACTIVE | INVITED | SUSPENDED
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index if not exists tenant_memberships_user_idx
  on public.tenant_memberships (user_id, status);

alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;

drop policy if exists "tenants_member_read" on public.tenants;
create policy "tenants_member_read" on public.tenants
  for select to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships m
      where m.tenant_id = tenants.id
        and m.user_id = auth.uid()
        and m.status = 'ACTIVE'
    )
  );

drop policy if exists "tenant_memberships_member_read" on public.tenant_memberships;
create policy "tenant_memberships_member_read" on public.tenant_memberships
  for select to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships m
      where m.user_id = auth.uid()
        and m.tenant_id = tenant_memberships.tenant_id
        and m.status = 'ACTIVE'
    )
  );

revoke all on public.tenants from anon;
revoke all on public.tenant_memberships from anon;
grant select on public.tenants to authenticated;
grant select on public.tenant_memberships to authenticated;
grant all on public.tenants to service_role;
grant all on public.tenant_memberships to service_role;

create or replace function public.is_tenant_member(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships m
    where m.tenant_id = target_tenant
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
  );
$$;

create or replace function public.is_tenant_admin(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships m
    where m.tenant_id = target_tenant
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
      and m.role in ('SUPERADMIN', 'OWNER', 'MEMPELAI')
  );
$$;

revoke all on function public.is_tenant_member(uuid) from public;
revoke all on function public.is_tenant_admin(uuid) from public;
grant execute on function public.is_tenant_member(uuid) to authenticated, service_role;
grant execute on function public.is_tenant_admin(uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- BAGIAN C: Tabel Data Per-Tenant + RLS
-- -----------------------------------------------------------------------------
create table if not exists public.tenant_guests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  guest_key text not null,
  guest_name text not null,
  guest_type text,
  rsvp_status text,
  attendance_status text,
  pax integer default 1,
  phone text,
  address text,
  invitation_code text,
  invitation_token text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, guest_key)
);

create table if not exists public.tenant_wishes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  wish_key text not null,
  guest_name text not null,
  message text,
  rsvp_status text,
  is_pinned boolean default false,
  is_moderated boolean default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, wish_key)
);

create table if not exists public.tenant_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  task_key text not null,
  title text not null,
  category text,
  status text,
  done boolean default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, task_key)
);

create table if not exists public.tenant_budget_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  item_key text not null,
  category text,
  item_name text not null,
  estimated_cost numeric default 0,
  actual_cost numeric default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, item_key)
);

create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array[
    'tenant_guests', 'tenant_wishes', 'tenant_tasks',
    'tenant_budget_items', 'tenant_settings'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'do $inner$ declare p record; begin
         for p in select policyname from pg_policies
                   where schemaname = ''public'' and tablename = %L
         loop
           execute format(''drop policy if exists %%I on public.%%I'', p.policyname, %L);
         end loop;
       end $inner$', t, t
    );

    execute format(
      'create policy "%1$s_tenant_read" on public.%1$I
         for select to authenticated
         using (public.is_tenant_member(tenant_id))', t
    );
    execute format(
      'create policy "%1$s_tenant_write" on public.%1$I
         for insert to authenticated
         with check (public.is_tenant_member(tenant_id))', t
    );
    execute format(
      'create policy "%1$s_tenant_update" on public.%1$I
         for update to authenticated
         using (public.is_tenant_member(tenant_id))
         with check (public.is_tenant_member(tenant_id))', t
    );
    execute format(
      'create policy "%1$s_tenant_delete" on public.%1$I
         for delete to authenticated
         using (public.is_tenant_admin(tenant_id))', t
    );

    execute format('revoke all on table public.%I from anon', t);
    execute format('grant all on table public.%I to service_role', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
  end loop;
end $$;

-- Budget: Panitia (non-admin) tidak boleh membaca, menulis, mengubah, atau menghapus budget.
drop policy if exists "tenant_budget_items_tenant_read" on public.tenant_budget_items;
create policy "tenant_budget_items_tenant_read" on public.tenant_budget_items
  for select to authenticated
  using (public.is_tenant_admin(tenant_id));

drop policy if exists "tenant_budget_items_tenant_write" on public.tenant_budget_items;
create policy "tenant_budget_items_tenant_write" on public.tenant_budget_items
  for insert to authenticated
  with check (public.is_tenant_admin(tenant_id));

drop policy if exists "tenant_budget_items_tenant_update" on public.tenant_budget_items;
create policy "tenant_budget_items_tenant_update" on public.tenant_budget_items
  for update to authenticated
  using (public.is_tenant_admin(tenant_id))
  with check (public.is_tenant_admin(tenant_id));

drop policy if exists "tenant_budget_items_tenant_delete" on public.tenant_budget_items;
create policy "tenant_budget_items_tenant_delete" on public.tenant_budget_items
  for delete to authenticated
  using (public.is_tenant_admin(tenant_id));

-- Audit Log server-side
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_label text,
  module text,
  action text,
  status text,
  summary text,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_tenant_created_idx
  on public.audit_logs (tenant_id, created_at desc);

alter table public.audit_logs enable row level security;
drop policy if exists "audit_logs_tenant_read" on public.audit_logs;
create policy "audit_logs_tenant_read" on public.audit_logs
  for select to authenticated
  using (public.is_tenant_member(tenant_id));
revoke all on public.audit_logs from anon;
grant all on public.audit_logs to service_role;
grant select on public.audit_logs to authenticated;

-- -----------------------------------------------------------------------------
-- BAGIAN D: Supabase Auth Identity Mapping (`app_user_profiles` - Migration 004)
-- -----------------------------------------------------------------------------
create table if not exists public.app_user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  username text not null unique,
  full_name text not null,
  role text not null default 'PANITIA',
  jabatan text not null default 'Panitia',
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  client_id text not null,
  client_name text not null,
  is_default_user boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_user_profiles_tenant_idx
  on public.app_user_profiles (tenant_id, is_active);
create index if not exists app_user_profiles_email_idx
  on public.app_user_profiles (lower(email));

alter table public.app_user_profiles enable row level security;

drop policy if exists "app_user_profiles_self_read" on public.app_user_profiles;
create policy "app_user_profiles_self_read" on public.app_user_profiles
  for select to authenticated
  using (auth_user_id = auth.uid());

revoke all on public.app_user_profiles from anon;
grant select on public.app_user_profiles to authenticated;
grant all on public.app_user_profiles to service_role;

-- -----------------------------------------------------------------------------
-- BAGIAN E: Seed Default Tenant (aman / idempotent)
-- -----------------------------------------------------------------------------
insert into public.tenants (slug, display_name, package_tier)
values
  ('client-utama', 'Klien Utama', 'ROYAL_VIP'),
  ('client-demo', 'Klien Demo', 'ROYAL_VIP')
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- VERIFIKASI: pastikan seluruh tabel baru telah terbentuk
-- -----------------------------------------------------------------------------
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'app_user_credentials', 'app_email_tokens', 'app_payment_orders',
    'tenants', 'tenant_memberships', 'tenant_guests', 'tenant_wishes',
    'tenant_tasks', 'tenant_budget_items', 'tenant_settings',
    'audit_logs', 'app_user_profiles'
  )
order by table_name;
