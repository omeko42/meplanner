-- =============================================================================
-- MEPlanner — Migration 003: True multi-tenant model (Supabase Auth)
-- =============================================================================
-- Menjalankan migrasi ini berarti:
--   1. Auth/JWT Supabase menjadi sumber kebenaran identitas.
--   2. Setiap baris data memiliki tenant_id dan hanya bisa diakses oleh
--      anggota tenant tersebut (RLS berbasis auth.uid()).
--   3. Snapshot JSON lama (wedding_state) tetap ada sebagai sumber data
--      backfill, lalu menjadi read-only.
--
-- Prasyarat: 002_credential_vault_and_rls.sql sudah dijalankan.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABEL TENANT & KEANGGOTAAN
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
drop policy if exists "tenants_service_write" on public.tenants;
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
drop policy if exists "tenant_memberships_service_write" on public.tenant_memberships;
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

-- -----------------------------------------------------------------------------
-- 2. HELPER: apakah user ini anggota tenant (dipakai oleh semua policy di bawah)
-- -----------------------------------------------------------------------------
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
-- 3. TABEL DATA PER-TENANT
--    Snapshots lama (wedding_state) dipindah ke sini lewat backfill terpisah.
-- -----------------------------------------------------------------------------
create table if not exists public.tenant_guests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  guest_key text not null,               -- id lama (dari JSON), unik per tenant
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

-- Pengaturan per-tenant tetap JSONB karena UI punya >100 field pengaturan;
-- yang di-query per-field (tamu, doa, tugas, budget) dipisah ke tabel.
create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4. RLS PER-TENANT: hanya anggota tenant yang boleh baca/tulis barisnya
-- -----------------------------------------------------------------------------
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

    -- Baca: anggota tenant aktif.
    execute format(
      'create policy "%1$s_tenant_read" on public.%1$I
         for select to authenticated
         using (public.is_tenant_member(tenant_id))', t
    );

    -- Tulis: hanya admin tenant (bukan Panitia untuk tabel budget).
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

-- Budget: Panther Committee (Panitia) tidak boleh menghapus/menulis budget.
drop policy if exists "tenant_budget_items_tenant_delete" on public.tenant_budget_items;
create policy "tenant_budget_items_tenant_delete" on public.tenant_budget_items
  for delete to authenticated
  using (public.is_tenant_admin(tenant_id));

-- -----------------------------------------------------------------------------
-- 5. AUDIT LOG SERVER-SIDE (sebelumnya hanya client-side)
-- -----------------------------------------------------------------------------
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
-- 6. SNAPSHOT LAMA: JADI READ-ONLY
--    Data lama masih dipakai selama masa transisi backfill.
-- -----------------------------------------------------------------------------
revoke all on public.wedding_state from anon, authenticated;
grant all on public.wedding_state to service_role;

-- -----------------------------------------------------------------------------
-- 7. VERIFIKASI
-- -----------------------------------------------------------------------------
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename like 'tenant%'
order by tablename, policyname;
