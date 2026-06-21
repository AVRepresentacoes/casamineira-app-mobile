create extension if not exists pgcrypto;

-- Evolui a base multi-tenant atual para semântica SaaS de empresa,
-- preservando tenant_id como chave canônica para evitar regressão.

alter table public.tenants
  add column if not exists logo_url text,
  add column if not exists cor_primaria text,
  add column if not exists cor_secundaria text,
  add column if not exists telefone text,
  add column if not exists email text,
  add column if not exists dominio text,
  add column if not exists ativa boolean not null default true;

update public.tenants
set ativa = case when status = 'active' then true else false end
where ativa is distinct from (status = 'active');

update public.tenants
set name = 'Casa Mineira Serviços'
where slug = 'default'
  and coalesce(nullif(trim(name), ''), 'Default Tenant') = 'Default Tenant';

update public.tenants t
set
  cor_primaria = coalesce(t.cor_primaria, b.primary_color),
  cor_secundaria = coalesce(t.cor_secundaria, b.secondary_color),
  logo_url = coalesce(t.logo_url, b.logo_url)
from public.app_branding b
where lower(b.tenant_slug) = lower(t.slug);

create table if not exists public.empresa_configuracoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.tenants(id) on delete cascade,
  nome_exibicao text,
  descricao text,
  whatsapp text,
  endereco text,
  cidade text,
  estado text,
  modo_marketplace boolean not null default true,
  modo_white_label boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id)
);

insert into public.empresa_configuracoes (
  empresa_id,
  nome_exibicao,
  descricao,
  whatsapp,
  modo_marketplace,
  modo_white_label
)
select
  t.id,
  case when t.slug = 'default' then 'Casa Mineira Serviços' else t.name end,
  case when t.slug = 'default' then 'Plataforma oficial da Casa Mineira Serviços' else null end,
  b.support_whatsapp,
  true,
  false
from public.tenants t
left join public.app_branding b on lower(b.tenant_slug) = lower(t.slug)
on conflict (empresa_id) do update
set
  nome_exibicao = coalesce(public.empresa_configuracoes.nome_exibicao, excluded.nome_exibicao),
  descricao = coalesce(public.empresa_configuracoes.descricao, excluded.descricao),
  whatsapp = coalesce(public.empresa_configuracoes.whatsapp, excluded.whatsapp);

create or replace function public.set_updated_at_empresa_configuracoes()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_empresa_configuracoes_updated_at on public.empresa_configuracoes;
create trigger trg_empresa_configuracoes_updated_at
before update on public.empresa_configuracoes
for each row
execute function public.set_updated_at_empresa_configuracoes();

alter table public.empresa_configuracoes enable row level security;

create or replace function public.current_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select public.current_tenant_id();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.role = 'super_admin'
  );
$$;

alter table public.tenant_users
  drop constraint if exists tenant_users_role_check;

alter table public.tenant_users
  add constraint tenant_users_role_check
  check (role in (
    'owner',
    'admin',
    'manager',
    'staff',
    'super_admin',
    'admin_empresa',
    'profissional',
    'cliente'
  ));

create or replace function public.is_empresa_admin(p_empresa_id uuid default public.current_empresa_id())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_super_admin()
    or exists (
      select 1
      from public.tenant_users tu
      where tu.user_id = auth.uid()
        and tu.tenant_id = p_empresa_id
        and tu.role in ('owner', 'admin', 'admin_empresa')
    );
$$;

drop policy if exists empresa_configuracoes_select_member on public.empresa_configuracoes;
create policy empresa_configuracoes_select_member
on public.empresa_configuracoes
for select
to authenticated
using (public.user_belongs_to_tenant(empresa_id));

drop policy if exists empresa_configuracoes_update_admin on public.empresa_configuracoes;
create policy empresa_configuracoes_update_admin
on public.empresa_configuracoes
for update
to authenticated
using (public.is_empresa_admin(empresa_id))
with check (public.is_empresa_admin(empresa_id));

drop policy if exists empresa_configuracoes_insert_admin on public.empresa_configuracoes;
create policy empresa_configuracoes_insert_admin
on public.empresa_configuracoes
for insert
to authenticated
with check (public.is_empresa_admin(empresa_id));

create or replace function public.current_empresa_slug()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when t.slug = 'default' then 'casa-mineira-servicos'
    else t.slug
  end
  from public.tenants t
  where t.id = public.current_empresa_id()
  limit 1;
$$;

create or replace function public.get_my_empresa_context()
returns table (
  empresa_id uuid,
  tenant_id uuid,
  slug text,
  tenant_slug text,
  nome text,
  nome_exibicao text,
  descricao text,
  logo_url text,
  cor_primaria text,
  cor_secundaria text,
  telefone text,
  email text,
  dominio text,
  whatsapp text,
  ativa boolean,
  modo_marketplace boolean,
  modo_white_label boolean,
  role text
)
language sql
security definer
set search_path = public
as $$
  select
    t.id as empresa_id,
    t.id as tenant_id,
    case when t.slug = 'default' then 'casa-mineira-servicos' else t.slug end as slug,
    t.slug as tenant_slug,
    t.name as nome,
    coalesce(ec.nome_exibicao, t.name) as nome_exibicao,
    ec.descricao,
    t.logo_url,
    coalesce(t.cor_primaria, '#facc15') as cor_primaria,
    coalesce(t.cor_secundaria, '#020617') as cor_secundaria,
    t.telefone,
    t.email,
    t.dominio,
    ec.whatsapp,
    t.ativa,
    ec.modo_marketplace,
    ec.modo_white_label,
    tu.role
  from public.tenants t
  inner join public.tenant_users tu
    on tu.tenant_id = t.id
   and tu.user_id = auth.uid()
  left join public.empresa_configuracoes ec
    on ec.empresa_id = t.id
  where t.id = public.current_empresa_id()
  limit 1;
$$;

do $$
declare
  v_empresas_kind "char";
  v_empresa_usuarios_kind "char";
begin
  select c.relkind
    into v_empresas_kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'empresas'
  limit 1;

  if v_empresas_kind is null or v_empresas_kind in ('v', 'm') then
    execute $view$
      create or replace view public.empresas as
      select
        t.id,
        case when t.slug = 'default' then 'casa-mineira-servicos' else t.slug end as slug,
        t.name as nome,
        t.logo_url,
        coalesce(t.cor_primaria, '#facc15') as cor_primaria,
        coalesce(t.cor_secundaria, '#020617') as cor_secundaria,
        t.telefone,
        t.email,
        t.dominio,
        t.ativa,
        t.created_at
      from public.tenants t
    $view$;
  end if;

  select c.relkind
    into v_empresa_usuarios_kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'empresa_usuarios'
  limit 1;

  if v_empresa_usuarios_kind is null or v_empresa_usuarios_kind in ('v', 'm') then
    execute $view$
      create or replace view public.empresa_usuarios as
      select
        tu.id,
        tu.tenant_id as empresa_id,
        tu.user_id,
        case
          when tu.role = 'super_admin' then 'super_admin'
          when tu.role in ('owner', 'admin', 'admin_empresa') then 'admin_empresa'
          when pr.role = 'cliente' then 'cliente'
          when pr.role = 'profissional' then 'profissional'
          else 'cliente'
        end as role,
        true as ativo,
        tu.created_at
      from public.tenant_users tu
      left join public.profiles pr on pr.id = tu.user_id
    $view$;
  end if;
end $$;

grant select on public.empresas to authenticated;
grant select on public.empresa_usuarios to authenticated;

revoke all on function public.current_empresa_id() from public;
revoke all on function public.current_empresa_slug() from public;
revoke all on function public.is_super_admin() from public;
revoke all on function public.is_empresa_admin(uuid) from public;
revoke all on function public.get_my_empresa_context() from public;

grant execute on function public.current_empresa_id() to authenticated;
grant execute on function public.current_empresa_slug() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_empresa_admin(uuid) to authenticated;
grant execute on function public.get_my_empresa_context() to authenticated;

-- Reforço compatível: garante tenant_id nas tabelas centrais esperadas pelo fluxo atual.
do $$
declare
  v_default_tenant uuid;
  v_table text;
  v_tables text[] := array[
    'profiles',
    'pedidos',
    'propostas',
    'comissoes',
    'avaliacoes',
    'pagamentos',
    'profissionais',
    'servicos',
    'portfolio',
    'contratos'
  ];
begin
  v_default_tenant := public.default_tenant_id();

  foreach v_table in array v_tables loop
    if to_regclass('public.' || v_table) is null then
      continue;
    end if;

    execute format('alter table public.%I add column if not exists tenant_id uuid', v_table);
    execute format('update public.%I set tenant_id = %L where tenant_id is null', v_table, v_default_tenant);
    execute format('alter table public.%I alter column tenant_id set default public.default_tenant_id()', v_table);

    begin
      execute format(
        'alter table public.%I add constraint %I foreign key (tenant_id) references public.tenants(id) not valid',
        v_table,
        v_table || '_tenant_id_fkey'
      );
    exception when duplicate_object then
      null;
    end;

    begin
      execute format('alter table public.%I validate constraint %I', v_table, v_table || '_tenant_id_fkey');
    exception when undefined_object then
      null;
    end;

    execute format(
      'create index if not exists %I on public.%I (tenant_id)',
      v_table || '_tenant_scope_idx',
      v_table
    );
  end loop;
end $$;
