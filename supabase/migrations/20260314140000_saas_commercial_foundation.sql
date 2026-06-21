do $$
begin
  if to_regprocedure('public.is_super_admin()') is null then
    raise exception 'Dependência ausente: execute 20260314120000_saas_empresa_foundation.sql antes desta migration.';
  end if;

  if to_regclass('public.planos_saas') is null or to_regclass('public.assinaturas_saas') is null then
    raise exception 'Dependência ausente: execute 20260314123000_saas_admin_billing.sql antes desta migration.';
  end if;
end $$;

alter table public.empresa_configuracoes
  add column if not exists segmento text;

alter table public.planos_saas
  add column if not exists slug text,
  add column if not exists descricao text,
  add column if not exists limite_pedidos_mes integer,
  add column if not exists acesso_financeiro_avancado boolean not null default false,
  add column if not exists acesso_relatorios boolean not null default false,
  add column if not exists ativo boolean not null default true;

with slug_candidates as (
  select
    id,
    case
      when lower(nome) like '%starter%' then 'starter'
      when lower(nome) like '%growth%' or lower(nome) like '%pro%' then 'pro'
      else 'enterprise'
    end as next_slug,
    row_number() over (
      partition by
        case
          when lower(nome) like '%starter%' then 'starter'
          when lower(nome) like '%growth%' or lower(nome) like '%pro%' then 'pro'
          else 'enterprise'
        end
      order by created_at, id
    ) as slug_rank
  from public.planos_saas
  where slug is null
)
update public.planos_saas p
set slug = c.next_slug
from slug_candidates c
where p.id = c.id
  and c.slug_rank = 1
  and not exists (
    select 1
    from public.planos_saas existing
    where existing.slug = c.next_slug
  );

update public.planos_saas
set
  nome = case slug
    when 'starter' then 'Starter'
    when 'pro' then 'Pro'
    else 'Enterprise'
  end,
  descricao = case slug
    when 'starter' then 'Entrada comercial para operação SaaS com limites básicos e trial inicial.'
    when 'pro' then 'Plano de crescimento com relatórios, mais capacidade operacional e branding ampliado.'
    else 'Plano corporativo com white-label completo, maior escala e prioridade.'
  end,
  valor = case slug
    when 'starter' then 199.90
    when 'pro' then 499.90
    else 1499.90
  end,
  limite_usuarios = case slug
    when 'starter' then 5
    when 'pro' then 20
    else null
  end,
  limite_profissionais = case slug
    when 'starter' then 25
    when 'pro' then 150
    else null
  end,
  limite_pedidos = case slug
    when 'starter' then 200
    when 'pro' then 3000
    else null
  end,
  limite_pedidos_mes = case slug
    when 'starter' then 200
    when 'pro' then 3000
    else null
  end,
  white_label = case slug
    when 'starter' then false
    else true
  end,
  suporte_prioritario = case slug
    when 'enterprise' then true
    when 'pro' then true
    else false
  end,
  acesso_financeiro_avancado = case slug
    when 'starter' then false
    else true
  end,
  acesso_relatorios = case slug
    when 'starter' then false
    else true
  end,
  ativo = true;

create unique index if not exists planos_saas_slug_uidx
  on public.planos_saas (slug);

alter table public.assinaturas_saas
  add column if not exists trial_ativo boolean not null default false,
  add column if not exists trial_inicio timestamptz,
  add column if not exists trial_fim timestamptz,
  add column if not exists gateway_customer_id text;

alter table public.assinaturas_saas
  drop constraint if exists assinaturas_saas_status_check;

alter table public.assinaturas_saas
  add constraint assinaturas_saas_status_check
  check (status in ('trial', 'ativa', 'inadimplente', 'cancelada', 'pausada', 'expirada'));

update public.assinaturas_saas
set
  trial_ativo = status = 'trial',
  trial_inicio = coalesce(trial_inicio, data_inicio),
  trial_fim = coalesce(trial_fim, case when status = 'trial' then data_inicio + interval '14 days' else data_fim end)
where trial_inicio is null
   or trial_fim is null
   or trial_ativo is distinct from (status = 'trial');

create table if not exists public.assinaturas_saas_historico (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid references public.assinaturas_saas(id) on delete cascade,
  empresa_id uuid not null references public.tenants(id) on delete cascade,
  plano_id uuid references public.planos_saas(id) on delete set null,
  status text not null,
  trial_ativo boolean not null default false,
  trial_inicio timestamptz,
  trial_fim timestamptz,
  gateway_customer_id text,
  gateway_subscription_id text,
  origem text not null default 'system',
  created_at timestamptz not null default now()
);

create index if not exists assinaturas_saas_historico_empresa_created_idx
  on public.assinaturas_saas_historico (empresa_id, created_at desc);

create or replace function public.sync_assinatura_saas_historico()
returns trigger
language plpgsql
as $$
begin
  insert into public.assinaturas_saas_historico (
    assinatura_id,
    empresa_id,
    plano_id,
    status,
    trial_ativo,
    trial_inicio,
    trial_fim,
    gateway_customer_id,
    gateway_subscription_id,
    origem
  )
  values (
    new.id,
    new.empresa_id,
    new.plano_id,
    new.status,
    new.trial_ativo,
    new.trial_inicio,
    new.trial_fim,
    new.gateway_customer_id,
    new.gateway_subscription_id,
    tg_op
  );

  return new;
end;
$$;

drop trigger if exists trg_assinaturas_saas_historico on public.assinaturas_saas;
create trigger trg_assinaturas_saas_historico
after insert or update on public.assinaturas_saas
for each row
execute function public.sync_assinatura_saas_historico();

insert into public.assinaturas_saas_historico (
  assinatura_id,
  empresa_id,
  plano_id,
  status,
  trial_ativo,
  trial_inicio,
  trial_fim,
  gateway_customer_id,
  gateway_subscription_id,
  origem
)
select
  a.id,
  a.empresa_id,
  a.plano_id,
  a.status,
  a.trial_ativo,
  a.trial_inicio,
  a.trial_fim,
  a.gateway_customer_id,
  a.gateway_subscription_id,
  'backfill'
from public.assinaturas_saas a
where not exists (
  select 1
  from public.assinaturas_saas_historico h
  where h.assinatura_id = a.id
);

create or replace function public.get_empresa_saas_usage(p_empresa_id uuid)
returns table (
  usuarios_usados integer,
  profissionais_usados integer,
  pedidos_mes_usados integer,
  pedidos_mes_referencia date
)
language sql
security definer
set search_path = public
as $$
  with ref as (
    select date_trunc('month', now())::date as mes_ref
  )
  select
    (
      select count(*)::int
      from public.tenant_users tu
      where tu.tenant_id = p_empresa_id
        and tu.role <> 'super_admin'
    ) as usuarios_usados,
    (
      select count(*)::int
      from public.profissionais pf
      where pf.tenant_id = p_empresa_id
    ) as profissionais_usados,
    (
      select count(*)::int
      from public.pedidos p, ref
      where p.tenant_id = p_empresa_id
        and p.created_at >= ref.mes_ref
        and p.created_at < (ref.mes_ref + interval '1 month')
    ) as pedidos_mes_usados,
    (select mes_ref from ref) as pedidos_mes_referencia;
$$;

create or replace function public.get_empresa_saas_context(p_empresa_id uuid)
returns table (
  empresa_id uuid,
  plano_id uuid,
  plano_nome text,
  plano_slug text,
  plano_valor numeric,
  plano_descricao text,
  assinatura_status text,
  trial_ativo boolean,
  trial_inicio timestamptz,
  trial_fim timestamptz,
  trial_expirado boolean,
  assinatura_bloqueada boolean,
  limite_usuarios integer,
  limite_profissionais integer,
  limite_pedidos_mes integer,
  usuarios_usados integer,
  profissionais_usados integer,
  pedidos_mes_usados integer,
  white_label boolean,
  suporte_prioritario boolean,
  acesso_financeiro_avancado boolean,
  acesso_relatorios boolean,
  usuarios_restantes integer,
  profissionais_restantes integer,
  pedidos_mes_restantes integer
)
language sql
security definer
set search_path = public
as $$
  with assinatura as (
    select a.*
    from public.assinaturas_saas a
    where a.empresa_id = p_empresa_id
    order by a.created_at desc
    limit 1
  ),
  plano as (
    select ps.*
    from public.planos_saas ps
    join assinatura a on a.plano_id = ps.id
  ),
  uso as (
    select *
    from public.get_empresa_saas_usage(p_empresa_id)
  )
  select
    p_empresa_id as empresa_id,
    pl.id as plano_id,
    pl.nome as plano_nome,
    pl.slug as plano_slug,
    pl.valor as plano_valor,
    pl.descricao as plano_descricao,
    a.status as assinatura_status,
    a.trial_ativo,
    a.trial_inicio,
    a.trial_fim,
    case
      when a.trial_ativo and a.trial_fim is not null and a.trial_fim < now() then true
      else false
    end as trial_expirado,
    case
      when a.status in ('inadimplente', 'cancelada', 'pausada', 'expirada') then true
      when a.trial_ativo and a.trial_fim is not null and a.trial_fim < now() then true
      else false
    end as assinatura_bloqueada,
    pl.limite_usuarios,
    pl.limite_profissionais,
    pl.limite_pedidos_mes,
    u.usuarios_usados,
    u.profissionais_usados,
    u.pedidos_mes_usados,
    pl.white_label,
    pl.suporte_prioritario,
    pl.acesso_financeiro_avancado,
    pl.acesso_relatorios,
    case
      when pl.limite_usuarios is null then null
      else greatest(pl.limite_usuarios - u.usuarios_usados, 0)
    end as usuarios_restantes,
    case
      when pl.limite_profissionais is null then null
      else greatest(pl.limite_profissionais - u.profissionais_usados, 0)
    end as profissionais_restantes,
    case
      when pl.limite_pedidos_mes is null then null
      else greatest(pl.limite_pedidos_mes - u.pedidos_mes_usados, 0)
    end as pedidos_mes_restantes
  from assinatura a
  left join plano pl on true
  left join uso u on true;
$$;

create or replace function public.get_my_empresa_commercial_context()
returns table (
  empresa_id uuid,
  plano_id uuid,
  plano_nome text,
  plano_slug text,
  plano_valor numeric,
  plano_descricao text,
  assinatura_status text,
  trial_ativo boolean,
  trial_inicio timestamptz,
  trial_fim timestamptz,
  trial_expirado boolean,
  assinatura_bloqueada boolean,
  limite_usuarios integer,
  limite_profissionais integer,
  limite_pedidos_mes integer,
  usuarios_usados integer,
  profissionais_usados integer,
  pedidos_mes_usados integer,
  white_label boolean,
  suporte_prioritario boolean,
  acesso_financeiro_avancado boolean,
  acesso_relatorios boolean,
  usuarios_restantes integer,
  profissionais_restantes integer,
  pedidos_mes_restantes integer
)
language sql
security definer
set search_path = public
as $$
  select *
  from public.get_empresa_saas_context(public.current_empresa_id());
$$;

create or replace function public.get_saas_commercial_metrics()
returns table (
  empresas_trial bigint,
  empresas_ativas bigint,
  empresas_inadimplentes bigint,
  empresas_canceladas bigint,
  empresas_pausadas bigint,
  empresas_expiradas bigint,
  mrr_estimado numeric,
  starter_qtd bigint,
  pro_qtd bigint,
  enterprise_qtd bigint
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      a.status,
      coalesce(ps.slug, 'starter') as plano_slug,
      coalesce(ps.valor, 0) as valor
    from public.assinaturas_saas a
    left join public.planos_saas ps on ps.id = a.plano_id
    where a.id in (
      select a2.id
      from (
        select
          empresa_id,
          max(created_at) as created_at
        from public.assinaturas_saas
        group by empresa_id
      ) last
      join public.assinaturas_saas a2
        on a2.empresa_id = last.empresa_id
       and a2.created_at = last.created_at
    )
  )
  select
    count(*) filter (where status = 'trial') as empresas_trial,
    count(*) filter (where status = 'ativa') as empresas_ativas,
    count(*) filter (where status = 'inadimplente') as empresas_inadimplentes,
    count(*) filter (where status = 'cancelada') as empresas_canceladas,
    count(*) filter (where status = 'pausada') as empresas_pausadas,
    count(*) filter (where status = 'expirada') as empresas_expiradas,
    coalesce(sum(valor) filter (where status in ('ativa', 'inadimplente')), 0) as mrr_estimado,
    count(*) filter (where plano_slug = 'starter') as starter_qtd,
    count(*) filter (where plano_slug = 'pro') as pro_qtd,
    count(*) filter (where plano_slug = 'enterprise') as enterprise_qtd
  from base
  where public.is_super_admin();
$$;

create or replace function public.saas_admin_extend_trial(
  p_empresa_id uuid,
  p_extra_days integer default 7
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

  update public.assinaturas_saas
  set
    trial_ativo = true,
    trial_inicio = coalesce(trial_inicio, now()),
    trial_fim = coalesce(trial_fim, now()) + make_interval(days => greatest(coalesce(p_extra_days, 7), 1)),
    status = 'trial'
  where id = (
    select a.id
    from public.assinaturas_saas a
    where a.empresa_id = p_empresa_id
    order by a.created_at desc
    limit 1
  );
end;
$$;

create or replace function public.onboard_my_saas_empresa(
  p_empresa_nome text,
  p_segmento text default null,
  p_cidade text default null,
  p_estado text default null,
  p_whatsapp text default null,
  p_empresa_email text default null,
  p_admin_nome text default null,
  p_plano_slug text default 'starter',
  p_trial_dias integer default 14
)
returns table (
  empresa_id uuid,
  tenant_slug text,
  assinatura_id uuid,
  plano_slug text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_empresa_id uuid;
  v_assinatura_id uuid;
  v_slug text;
  v_plan_id uuid;
  v_plan_slug text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário autenticado é obrigatório para onboarding.';
  end if;

  if exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = v_uid
      and tu.role in ('owner', 'admin', 'admin_empresa')
  ) then
    raise exception 'Sua conta já está vinculada a uma empresa administrada.';
  end if;

  v_slug := lower(trim(regexp_replace(coalesce(p_empresa_nome, ''), '[^a-zA-Z0-9]+', '-', 'g')));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then
    v_slug := 'empresa';
  end if;

  if exists (select 1 from public.tenants t where lower(t.slug) = lower(v_slug)) then
    v_slug := v_slug || '-' || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6);
  end if;

  select ps.id, ps.slug
    into v_plan_id, v_plan_slug
  from public.planos_saas ps
  where ps.slug = lower(coalesce(p_plano_slug, 'starter'))
    and ps.ativo = true
  order by ps.valor asc
  limit 1;

  if v_plan_id is null then
    select ps.id, ps.slug
      into v_plan_id, v_plan_slug
    from public.planos_saas ps
    where ps.slug = 'starter'
    limit 1;
  end if;

  insert into public.tenants (
    slug,
    name,
    status,
    plan_code,
    email,
    ativa
  )
  values (
    v_slug,
    trim(p_empresa_nome),
    'active',
    coalesce(v_plan_slug, 'starter'),
    nullif(trim(coalesce(p_empresa_email, '')), ''),
    true
  )
  returning id into v_empresa_id;

  insert into public.empresa_configuracoes (
    empresa_id,
    nome_exibicao,
    descricao,
    whatsapp,
    cidade,
    estado,
    segmento,
    modo_marketplace,
    modo_white_label
  )
  values (
    v_empresa_id,
    trim(p_empresa_nome),
    nullif(trim(coalesce(p_segmento, '')), ''),
    nullif(trim(coalesce(p_whatsapp, '')), ''),
    nullif(trim(coalesce(p_cidade, '')), ''),
    nullif(trim(coalesce(p_estado, '')), ''),
    nullif(trim(coalesce(p_segmento, '')), ''),
    true,
    false
  );

  insert into public.tenant_users (
    tenant_id,
    user_id,
    role,
    is_default
  )
  values (
    v_empresa_id,
    v_uid,
    'admin_empresa',
    true
  )
  on conflict (tenant_id, user_id) do update
  set role = 'admin_empresa',
      is_default = true;

  update public.tenant_users
  set is_default = false
  where user_id = v_uid
    and tenant_id <> v_empresa_id
    and is_default = true;

  insert into public.profiles (
    id,
    tenant_id,
    name,
    role
  )
  values (
    v_uid,
    v_empresa_id,
    coalesce(nullif(trim(coalesce(p_admin_nome, '')), ''), 'Admin Empresa'),
    'profissional'
  )
  on conflict (id) do update
  set
    tenant_id = excluded.tenant_id,
    name = coalesce(public.profiles.name, excluded.name),
    role = coalesce(public.profiles.role, excluded.role);

  insert into public.profissionais (
    user_id,
    tenant_id,
    ativo,
    disponivel
  )
  values (
    v_uid,
    v_empresa_id,
    true,
    false
  )
  on conflict (user_id) do update
  set tenant_id = excluded.tenant_id;

  insert into public.assinaturas_saas (
    empresa_id,
    plano_id,
    status,
    trial_ativo,
    trial_inicio,
    trial_fim,
    data_inicio
  )
  values (
    v_empresa_id,
    v_plan_id,
    'trial',
    true,
    now(),
    now() + make_interval(days => greatest(coalesce(p_trial_dias, 14), 1)),
    now()
  )
  returning id into v_assinatura_id;

  return query
  select
    v_empresa_id,
    v_slug,
    v_assinatura_id,
    v_plan_slug;
end;
$$;

revoke all on function public.get_empresa_saas_usage(uuid) from public;
revoke all on function public.get_empresa_saas_context(uuid) from public;
revoke all on function public.get_my_empresa_commercial_context() from public;
revoke all on function public.get_saas_commercial_metrics() from public;
revoke all on function public.saas_admin_extend_trial(uuid, integer) from public;
revoke all on function public.onboard_my_saas_empresa(text, text, text, text, text, text, text, text, integer) from public;

grant execute on function public.get_empresa_saas_usage(uuid) to authenticated;
grant execute on function public.get_empresa_saas_context(uuid) to authenticated;
grant execute on function public.get_my_empresa_commercial_context() to authenticated;
grant execute on function public.get_saas_commercial_metrics() to authenticated;
grant execute on function public.saas_admin_extend_trial(uuid, integer) to authenticated;
grant execute on function public.onboard_my_saas_empresa(text, text, text, text, text, text, text, text, integer) to authenticated;
