-- Production hardening: RLS, Storage guardrails and read-only security diagnostics.
-- Safe migration: no table drops, no destructive data changes.

-- =========================================================
-- 1) RLS gaps found in the static audit
-- =========================================================
alter table if exists public.wallets enable row level security;
alter table if exists public.wallet_transactions enable row level security;
alter table if exists public.assinaturas_saas_historico enable row level security;

revoke all on table public.wallets from anon;
revoke all on table public.wallet_transactions from anon;
revoke all on table public.assinaturas_saas_historico from anon;

grant select on table public.wallets to authenticated;
grant select on table public.wallet_transactions to authenticated;
grant select on table public.assinaturas_saas_historico to authenticated;

drop policy if exists wallets_select_own on public.wallets;
create policy wallets_select_own
on public.wallets
for select
to authenticated
using (
  user_id = auth.uid()
  and (
    tenant_id is null
    or tenant_id = public.current_tenant_id()
    or public.is_super_admin()
  )
);

drop policy if exists wallets_manage_super_admin on public.wallets;
create policy wallets_manage_super_admin
on public.wallets
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists wallet_transactions_select_own on public.wallet_transactions;
create policy wallet_transactions_select_own
on public.wallet_transactions
for select
to authenticated
using (
  user_id = auth.uid()
  and (
    tenant_id is null
    or tenant_id = public.current_tenant_id()
    or public.is_super_admin()
  )
);

drop policy if exists wallet_transactions_manage_super_admin on public.wallet_transactions;
create policy wallet_transactions_manage_super_admin
on public.wallet_transactions
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists assinaturas_saas_historico_select_member on public.assinaturas_saas_historico;
create policy assinaturas_saas_historico_select_member
on public.assinaturas_saas_historico
for select
to authenticated
using (
  empresa_id = public.current_empresa_id()
  or public.is_empresa_admin(empresa_id)
  or public.is_super_admin()
);

drop policy if exists assinaturas_saas_historico_manage_super_admin on public.assinaturas_saas_historico;
create policy assinaturas_saas_historico_manage_super_admin
on public.assinaturas_saas_historico
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- =========================================================
-- 2) Storage hardening for imagens
-- Existing public reads remain compatible. New writes are scoped by user prefix.
-- =========================================================
update storage.buckets
set
  public = true,
  file_size_limit = least(coalesce(file_size_limit, 10485760), 10485760),
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'imagens';

drop policy if exists imagens_auth_insert on storage.objects;
create policy imagens_auth_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'imagens'
  and (
    name like auth.uid()::text || '/%'
    or public.is_super_admin()
  )
);

drop policy if exists imagens_auth_update on storage.objects;
create policy imagens_auth_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'imagens'
  and (
    name like auth.uid()::text || '/%'
    or public.is_super_admin()
  )
)
with check (
  bucket_id = 'imagens'
  and (
    name like auth.uid()::text || '/%'
    or public.is_super_admin()
  )
);

drop policy if exists imagens_auth_delete on storage.objects;
create policy imagens_auth_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'imagens'
  and (
    name like auth.uid()::text || '/%'
    or public.is_super_admin()
  )
);

-- =========================================================
-- 3) Security Center diagnostics
-- Read-only RPC for super admins.
-- =========================================================
create or replace function public.get_supabase_security_center_status()
returns jsonb
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_missing_rls text[];
  v_public_buckets jsonb;
  v_storage_policies integer;
  v_policy_count integer;
  v_function_count integer;
  v_trigger_count integer;
  v_migration_count integer;
  v_realtime_tables integer;
begin
  if not public.is_super_admin() then
    raise exception 'Apenas super admin pode acessar o Security Center.';
  end if;

  select coalesce(array_agg(c.relname order by c.relname), '{}')
    into v_missing_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relrowsecurity = false
    and c.relname not like 'schema_%';

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', b.id,
    'name', b.name,
    'public', b.public,
    'file_size_limit', b.file_size_limit,
    'allowed_mime_types', b.allowed_mime_types
  ) order by b.id), '[]'::jsonb)
    into v_public_buckets
  from storage.buckets b
  where b.public = true;

  select count(*) into v_storage_policies
  from pg_policies
  where schemaname = 'storage' and tablename = 'objects';

  select count(*) into v_policy_count
  from pg_policies
  where schemaname = 'public';

  select count(*) into v_function_count
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public';

  select count(*) into v_trigger_count
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where not t.tgisinternal
    and n.nspname = 'public';

  select count(*) into v_migration_count
  from supabase_migrations.schema_migrations;

  select count(*) into v_realtime_tables
  from pg_publication_tables
  where pubname = 'supabase_realtime';

  return jsonb_build_object(
    'generated_at', now(),
    'connection', jsonb_build_object('status', 'green', 'explanation', 'RPC executada com sucesso.'),
    'database', jsonb_build_object('status', case when array_length(v_missing_rls, 1) is null then 'green' else 'yellow' end, 'missing_rls', v_missing_rls),
    'auth', jsonb_build_object('status', 'green', 'explanation', 'JWT autenticado e super admin validado.'),
    'storage', jsonb_build_object('status', case when v_storage_policies >= 4 then 'green' else 'yellow' end, 'storage_policies', v_storage_policies),
    'realtime', jsonb_build_object('status', case when v_realtime_tables > 0 then 'green' else 'yellow' end, 'published_tables', v_realtime_tables),
    'cors', jsonb_build_object('status', 'yellow', 'explanation', 'CORS depende do secret EDGE_ALLOWED_ORIGINS nas Edge Functions.'),
    'edge_functions', jsonb_build_object('status', 'yellow', 'explanation', 'Status runtime deve ser validado via health endpoint/CLI.'),
    'buckets', jsonb_build_object('status', case when jsonb_array_length(v_public_buckets) = 0 then 'green' else 'yellow' end, 'public_buckets', v_public_buckets),
    'policies', jsonb_build_object('status', case when v_policy_count > 0 then 'green' else 'red' end, 'count', v_policy_count),
    'variables', jsonb_build_object('status', 'yellow', 'explanation', 'Secrets nao sao legiveis via SQL; validar via painel e health endpoint.'),
    'keys', jsonb_build_object('status', 'yellow', 'explanation', 'Rotacao e exposicao devem ser avaliadas fora do banco.'),
    'migrations', jsonb_build_object('status', case when v_migration_count > 0 then 'green' else 'yellow' end, 'count', v_migration_count),
    'triggers', jsonb_build_object('status', case when v_trigger_count > 0 then 'green' else 'yellow' end, 'count', v_trigger_count),
    'backups', jsonb_build_object('status', 'yellow', 'explanation', 'Backups/PITR devem ser conferidos no painel Supabase.')
  );
end;
$$;

revoke all on function public.get_supabase_security_center_status() from public;
grant execute on function public.get_supabase_security_center_status() to authenticated;

