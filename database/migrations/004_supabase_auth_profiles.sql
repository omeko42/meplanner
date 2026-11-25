-- =============================================================================
-- MEPlanner — Migration 004: Supabase Auth identity mapping
-- =============================================================================
-- Prasyarat: 002_credential_vault_and_rls.sql + 003_multi_tenant.sql
--
-- This adds the app-owned role/profile mapping. Supabase Auth proves who the
-- user is; this table (plus tenant_memberships) decides what they may do.
-- Roles are never copied from user_metadata.
-- =============================================================================

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

-- Profile writes are server-only: clients cannot self-assign SUPERADMIN,
-- OWNER, or another tenant. All inserts / updates use service_role on the API.
