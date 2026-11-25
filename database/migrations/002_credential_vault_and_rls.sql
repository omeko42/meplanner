-- =============================================================================
-- MEPlanner — Migration 002: Credential Vault + RLS lockdown
-- =============================================================================
-- Jalankan di Supabase SQL Editor (atau `psql`) sebagai postgres role.
-- Idempotent: aman dijalankan berkali-kali.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABEL CREDENTIAL (password_hash TIDAK PERNAH ada di wedding_state lagi)
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

-- -----------------------------------------------------------------------------
-- 2. RLS: tabel ini HANYA boleh diakses service_role (server).
--    Tidak ada grant ke anon/authenticated — browser tidak boleh bisa baca
--    password hash sama sekali.
-- -----------------------------------------------------------------------------
alter table public.app_user_credentials enable row level security;

drop policy if exists "app_user_credentials_public_access" on public.app_user_credentials;

revoke all on table public.app_user_credentials from anon, authenticated;

grant all on table public.app_user_credentials to service_role;

-- -----------------------------------------------------------------------------
-- 3. TABEL VERIFIKASI EMAIL + RESET PASSWORD
-- -----------------------------------------------------------------------------
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

alter table public.app_email_tokens enable row level security;
drop policy if exists "app_email_tokens_public_access" on public.app_email_tokens;
revoke all on table public.app_email_tokens from anon, authenticated;
grant all on table public.app_email_tokens to service_role;

-- -----------------------------------------------------------------------------
-- 4. TABEL PAYMENT ORDERS (server-authoritative)
--    Amount, currency, recipient dan expiry TIDAK PERNAH berasal dari browser.
-- -----------------------------------------------------------------------------
create table if not exists public.app_payment_orders (
  id text primary key,                -- order_id
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
-- 5. RLS LOCKDOWN untuk tabel yang sudah ada.
--    Sebelumnya semua policy `using (true) with check (true)` untuk role anon,
--    artinya siapa pun bisa read/write/tamper seluruh database lewat anon key
--    yang bocor ke browser bundle.
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'wedding_state', 'wedding_settings', 'wedding_media', 'wedding_tasks',
    'wedding_guests', 'wedding_wishes', 'wedding_budgets', 'wedding_users',
    'wedding_payments'
  ]
  loop
    if to_regclass(format('public.%I', t)) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    -- Buang seluruh policy lama yang menyalakan akses publik.
    execute format(
      'do $inner$ declare p record; begin
         for p in select policyname from pg_policies
                   where schemaname = ''public'' and tablename = %L
         loop
           execute format(''drop policy if exists %%I on public.%%I'', p.policyname, %L);
         end loop;
       end $inner$', t, t
    );

    -- Cabut hak anon/authenticated. Akses hanya lewat service_role (server).
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 6. STORAGE: bucket media tidak boleh bisa ditulis browser memakai anon key.
--    Unggahan wajib lewat route server (/api/...).
-- -----------------------------------------------------------------------------
do $$
declare
  b record;
begin
  for b in select id from storage.buckets loop
    execute format(
      'do $inner$ declare p record; begin
         for p in select policyname from pg_policies
                   where schemaname = ''storage'' and tablename = ''objects''
                     and policyname like ''%%wedding%%''
         loop
           execute format(''drop policy if exists %%I on storage.objects'', p.policyname);
         end loop;
       end $inner$'
    );
  end loop;
end $$;

-- Bucket tetap bisa dibaca publik (foto undangan tampil di halaman publik),
-- tetapi TIDAK bisa ditulis/diubah/dihapus oleh anon.
drop policy if exists "wedding_media_public_read" on storage.objects;
create policy "wedding_media_public_read"
  on storage.objects for select to public
  using (bucket_id in ('wedding-media', 'wedding'));

revoke insert, update, delete on storage.objects from anon, authenticated;
grant select on storage.objects to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. VERIFIKASI
-- -----------------------------------------------------------------------------
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
