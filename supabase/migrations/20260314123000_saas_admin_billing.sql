create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.empresa_configuracoes') is null then
    raise exception 'Execute antes a migration 20260314120000_saas_empresa_foundation.sql';
  end if;

  perform 1
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'is_super_admin';

  if not found then
    raise exception 'Execute antes a migration 20260314120000_saas_empresa_foundation.sql';
  end if;
end $$;

create table if not exists public.planos_saas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  valor numeric(12,2) not null default 0,
  limite_usuarios integer,
  limite_profissionais integer,
  limite_pedidos integer,
  white_label boolean not null default false,
  suporte_prioritario boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.assinaturas_saas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.tenants(id) on delete cascade,
  plano_id uuid references public.planos_saas(id) on delete set null,
  status text not null default 'trial',
  data_inicio timestamptz not null default now(),
  data_fim timestamptz,
  gateway_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assinaturas_saas_status_check check (status in ('trial', 'ativa', 'inadimplente', 'cancelada'))
);

create unique index if not exists assinaturas_saas_empresa_ativa_uidx
  on public.assinaturas_saas (empresa_id)
  where status in ('trial', 'ativa', 'inadimplente');

create index if not exists assinaturas_saas_empresa_created_idx
  on public.assinaturas_saas (empresa_id, created_at desc);

create or replace function public.set_updated_at_assinaturas_saas()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_assinaturas_saas_updated_at on public.assinaturas_saas;
create trigger trg_assinaturas_saas_updated_at
before update on public.assinaturas_saas
for each row
execute function public.set_updated_at_assinaturas_saas();

insert into public.planos_saas (
  nome,
  valor,
  limite_usuarios,
  limite_profissionais,
  limite_pedidos,
  white_label,
  suporte_prioritario
)
values
  ('Starter SaaS', 199.90, 5, 25, 200, false, false),
  ('Growth SaaS', 499.90, 20, 150, 3000, true, true),
  ('Enterprise SaaS', 1499.90, null, null, null, true, true)
on conflict do nothing;

insert into public.assinaturas_saas (
  empresa_id,
  plano_id,
  status,
  data_inicio
)
select
  t.id,
  (
    select ps.id
    from public.planos_saas ps
    where ps.nome = 'Starter SaaS'
    limit 1
  ),
  'ativa',
  now()
from public.tenants t
where not exists (
  select 1
  from public.assinaturas_saas a
  where a.empresa_id = t.id
    and a.status in ('trial', 'ativa', 'inadimplente')
);

alter table public.planos_saas enable row level security;
alter table public.assinaturas_saas enable row level security;

drop policy if exists planos_saas_select_authenticated on public.planos_saas;
create policy planos_saas_select_authenticated
on public.planos_saas
for select
to authenticated
using (true);

drop policy if exists assinaturas_saas_select_member on public.assinaturas_saas;
create policy assinaturas_saas_select_member
on public.assinaturas_saas
for select
to authenticated
using (public.user_belongs_to_tenant(empresa_id) or public.is_super_admin());

drop policy if exists assinaturas_saas_manage_admin on public.assinaturas_saas;
create policy assinaturas_saas_manage_admin
on public.assinaturas_saas
for all
to authenticated
using (public.is_empresa_admin(empresa_id) or public.is_super_admin())
with check (public.is_empresa_admin(empresa_id) or public.is_super_admin());

create or replace function public.get_saas_empresas_overview()
returns table (
  empresa_id uuid,
  slug text,
  nome text,
  ativa boolean,
  usuarios_qtd bigint,
  pedidos_qtd bigint,
  plano_nome text,
  assinatura_status text
)
language sql
security definer
set search_path = public
as $$
  select
    t.id as empresa_id,
    case when t.slug = 'default' then 'casa-mineira-servicos' else t.slug end as slug,
    t.name as nome,
    t.ativa,
    (
      select count(*)
      from public.tenant_users tu
      where tu.tenant_id = t.id
    ) as usuarios_qtd,
    (
      select count(*)
      from public.pedidos p
      where p.tenant_id = t.id
    ) as pedidos_qtd,
    ps.nome as plano_nome,
    a.status as assinatura_status
  from public.tenants t
  left join lateral (
    select a1.*
    from public.assinaturas_saas a1
    where a1.empresa_id = t.id
    order by a1.created_at desc
    limit 1
  ) a on true
  left join public.planos_saas ps on ps.id = a.plano_id
  where public.is_super_admin()
  order by t.created_at asc;
$$;

create or replace function public.saas_admin_create_empresa(
  p_nome text,
  p_slug text,
  p_admin_user_id uuid default null,
  p_dominio text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_plan_id uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Acesso restrito ao super admin';
  end if;

  insert into public.tenants (
    slug,
    name,
    status,
    plan_code,
    dominio,
    ativa
  )
  values (
    lower(trim(p_slug)),
    trim(p_nome),
    'active',
    'starter',
    nullif(trim(coalesce(p_dominio, '')), ''),
    true
  )
  returning id into v_empresa_id;

  insert into public.empresa_configuracoes (
    empresa_id,
    nome_exibicao,
    modo_marketplace,
    modo_white_label
  )
  values (
    v_empresa_id,
    trim(p_nome),
    true,
    false
  )
  on conflict (empresa_id) do nothing;

  select id into v_plan_id
  from public.planos_saas
  where nome = 'Starter SaaS'
  limit 1;

  insert into public.assinaturas_saas (
    empresa_id,
    plano_id,
    status,
    data_inicio
  )
  values (
    v_empresa_id,
    v_plan_id,
    'trial',
    now()
  );

  if p_admin_user_id is not null then
    insert into public.tenant_users (
      tenant_id,
      user_id,
      role,
      is_default
    )
    values (
      v_empresa_id,
      p_admin_user_id,
      'admin_empresa',
      false
    )
    on conflict (tenant_id, user_id) do update
      set role = 'admin_empresa';
  end if;

  return v_empresa_id;
end;
$$;

create or replace function public.saas_admin_set_empresa_status(
  p_empresa_id uuid,
  p_ativa boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Acesso restrito ao super admin';
  end if;

  update public.tenants
  set
    ativa = p_ativa,
    status = case when p_ativa then 'active' else 'suspended' end
  where id = p_empresa_id;
end;
$$;

create or replace function public.saas_admin_upsert_empresa_branding(
  p_empresa_id uuid,
  p_nome_exibicao text default null,
  p_descricao text default null,
  p_logo_url text default null,
  p_cor_primaria text default null,
  p_cor_secundaria text default null,
  p_whatsapp text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Acesso restrito ao super admin';
  end if;

  update public.tenants
  set
    logo_url = coalesce(nullif(trim(coalesce(p_logo_url, '')), ''), logo_url),
    cor_primaria = coalesce(nullif(trim(coalesce(p_cor_primaria, '')), ''), cor_primaria),
    cor_secundaria = coalesce(nullif(trim(coalesce(p_cor_secundaria, '')), ''), cor_secundaria)
  where id = p_empresa_id;

  insert into public.empresa_configuracoes (
    empresa_id,
    nome_exibicao,
    descricao,
    whatsapp
  )
  values (
    p_empresa_id,
    nullif(trim(coalesce(p_nome_exibicao, '')), ''),
    nullif(trim(coalesce(p_descricao, '')), ''),
    nullif(trim(coalesce(p_whatsapp, '')), '')
  )
  on conflict (empresa_id) do update
  set
    nome_exibicao = coalesce(excluded.nome_exibicao, public.empresa_configuracoes.nome_exibicao),
    descricao = coalesce(excluded.descricao, public.empresa_configuracoes.descricao),
    whatsapp = coalesce(excluded.whatsapp, public.empresa_configuracoes.whatsapp);
end;
$$;

revoke all on function public.get_saas_empresas_overview() from public;
revoke all on function public.saas_admin_create_empresa(text, text, uuid, text) from public;
revoke all on function public.saas_admin_set_empresa_status(uuid, boolean) from public;
revoke all on function public.saas_admin_upsert_empresa_branding(uuid, text, text, text, text, text, text) from public;

grant execute on function public.get_saas_empresas_overview() to authenticated;
grant execute on function public.saas_admin_create_empresa(text, text, uuid, text) to authenticated;
grant execute on function public.saas_admin_set_empresa_status(uuid, boolean) to authenticated;
grant execute on function public.saas_admin_upsert_empresa_branding(uuid, text, text, text, text, text, text) to authenticated;
