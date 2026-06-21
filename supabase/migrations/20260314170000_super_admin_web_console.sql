do $$
begin
  if to_regprocedure('public.is_super_admin()') is null then
    raise exception 'Dependência ausente: execute 20260314120000_saas_empresa_foundation.sql antes desta migration.';
  end if;

  if to_regclass('public.planos_saas') is null or to_regclass('public.assinaturas_saas') is null then
    raise exception 'Dependência ausente: execute as migrations SaaS comerciais antes desta migration.';
  end if;
end $$;

alter table public.tenant_users
  add column if not exists ativo boolean not null default true;

update public.tenant_users
set ativo = true
where ativo is null;

create or replace function public.current_tenant_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_claims jsonb;
  v_claim_tenant uuid;
  v_tenant uuid;
begin
  v_uid := auth.uid();

  begin
    v_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  exception when others then
    v_claims := null;
  end;

  begin
    v_claim_tenant := nullif(v_claims ->> 'tenant_id', '')::uuid;
  exception when others then
    v_claim_tenant := null;
  end;

  if v_claim_tenant is not null then
    if exists (
      select 1
      from public.tenant_users tu
      where tu.user_id = v_uid
        and tu.tenant_id = v_claim_tenant
        and coalesce(tu.ativo, true) = true
    ) then
      return v_claim_tenant;
    end if;
  end if;

  if v_uid is not null then
    select tu.tenant_id
      into v_tenant
      from public.tenant_users tu
     where tu.user_id = v_uid
       and tu.is_default = true
       and coalesce(tu.ativo, true) = true
     limit 1;

    if v_tenant is not null then
      return v_tenant;
    end if;

    select tu.tenant_id
      into v_tenant
      from public.tenant_users tu
     where tu.user_id = v_uid
       and coalesce(tu.ativo, true) = true
     order by tu.created_at asc
     limit 1;

    if v_tenant is not null then
      return v_tenant;
    end if;
  end if;

  return public.default_tenant_id();
end;
$$;

create or replace function public.user_belongs_to_tenant(p_tenant_id uuid)
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
      and tu.tenant_id = p_tenant_id
      and coalesce(tu.ativo, true) = true
  );
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
      and coalesce(tu.ativo, true) = true
  );
$$;

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
        and coalesce(tu.ativo, true) = true
    );
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
   and coalesce(tu.ativo, true) = true
  left join public.empresa_configuracoes ec
    on ec.empresa_id = t.id
  where t.id = public.current_empresa_id()
  limit 1;
$$;

create or replace function public.admin_web_get_dashboard()
returns table (
  total_empresas bigint,
  empresas_trial bigint,
  empresas_ativas bigint,
  empresas_inadimplentes bigint,
  empresas_canceladas bigint,
  total_usuarios bigint,
  total_profissionais bigint,
  total_clientes bigint,
  total_pedidos bigint,
  mrr_estimado numeric,
  arr_estimado numeric,
  planos_mais_usados jsonb,
  crescimento_empresas jsonb,
  crescimento_pedidos jsonb,
  assinaturas_por_status jsonb
)
language sql
security definer
set search_path = public
as $$
  with latest_assinaturas as (
    select distinct on (a.empresa_id)
      a.empresa_id,
      a.status,
      a.created_at,
      a.trial_ativo,
      a.trial_fim,
      a.plano_id
    from public.assinaturas_saas a
    order by a.empresa_id, a.created_at desc
  ),
  assinatura_base as (
    select
      la.empresa_id,
      la.status,
      la.trial_ativo,
      la.trial_fim,
      ps.slug as plano_slug,
      ps.nome as plano_nome,
      coalesce(ps.valor, 0) as valor
    from latest_assinaturas la
    left join public.planos_saas ps on ps.id = la.plano_id
  ),
  months as (
    select generate_series(
      date_trunc('month', now()) - interval '5 months',
      date_trunc('month', now()),
      interval '1 month'
    ) as month_ref
  ),
  empresas_growth as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'mes', to_char(m.month_ref, 'YYYY-MM'),
          'label', to_char(m.month_ref, 'Mon/YYYY'),
          'total', (
            select count(*)
            from public.tenants t
            where date_trunc('month', t.created_at) = m.month_ref
          )
        )
        order by m.month_ref
      ),
      '[]'::jsonb
    ) as payload
    from months m
  ),
  pedidos_growth as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'mes', to_char(m.month_ref, 'YYYY-MM'),
          'label', to_char(m.month_ref, 'Mon/YYYY'),
          'total', (
            select count(*)
            from public.pedidos p
            where date_trunc('month', p.created_at) = m.month_ref
          )
        )
        order by m.month_ref
      ),
      '[]'::jsonb
    ) as payload
    from months m
  ),
  planos_rank as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'slug', coalesce(plano_slug, 'sem-plano'),
          'nome', coalesce(plano_nome, 'Sem plano'),
          'total', total
        )
        order by total desc, coalesce(plano_nome, 'Sem plano')
      ),
      '[]'::jsonb
    ) as payload
    from (
      select
        plano_slug,
        plano_nome,
        count(*) as total
      from assinatura_base
      group by plano_slug, plano_nome
    ) ranked
  ),
  assinaturas_status as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'status', status,
          'total', total
        )
        order by status
      ),
      '[]'::jsonb
    ) as payload
    from (
      select
        coalesce(status, 'sem_assinatura') as status,
        count(*) as total
      from assinatura_base
      group by coalesce(status, 'sem_assinatura')
    ) grouped
  )
  select
    (select count(*) from public.tenants) as total_empresas,
    (select count(*) from assinatura_base where status = 'trial') as empresas_trial,
    (select count(*) from assinatura_base where status = 'ativa') as empresas_ativas,
    (select count(*) from assinatura_base where status = 'inadimplente') as empresas_inadimplentes,
    (select count(*) from assinatura_base where status = 'cancelada') as empresas_canceladas,
    (select count(*) from public.tenant_users tu where coalesce(tu.ativo, true) = true and tu.role <> 'super_admin') as total_usuarios,
    (select count(*) from public.profissionais pf where coalesce(pf.ativo, true) = true) as total_profissionais,
    (select count(*) from public.profiles pr where pr.role = 'cliente') as total_clientes,
    (select count(*) from public.pedidos) as total_pedidos,
    (select coalesce(sum(valor) filter (where status in ('ativa', 'inadimplente')), 0) from assinatura_base) as mrr_estimado,
    (select coalesce(sum(valor) filter (where status in ('ativa', 'inadimplente')), 0) * 12 from assinatura_base) as arr_estimado,
    (select payload from planos_rank) as planos_mais_usados,
    (select payload from empresas_growth) as crescimento_empresas,
    (select payload from pedidos_growth) as crescimento_pedidos,
    (select payload from assinaturas_status) as assinaturas_por_status
  where public.is_super_admin();
$$;

create or replace function public.admin_web_list_empresas(
  p_search text default null,
  p_status text default null
)
returns table (
  empresa_id uuid,
  nome text,
  slug text,
  ativa boolean,
  created_at timestamptz,
  plano_nome text,
  plano_slug text,
  assinatura_status text,
  trial_ativo boolean,
  trial_fim timestamptz,
  usuarios_qtd bigint,
  profissionais_qtd bigint,
  clientes_qtd bigint,
  pedidos_qtd bigint
)
language sql
security definer
set search_path = public
as $$
  with latest_assinaturas as (
    select distinct on (a.empresa_id)
      a.empresa_id,
      a.status,
      a.trial_ativo,
      a.trial_fim,
      a.plano_id
    from public.assinaturas_saas a
    order by a.empresa_id, a.created_at desc
  )
  select
    t.id as empresa_id,
    t.name as nome,
    case when t.slug = 'default' then 'casa-mineira-servicos' else t.slug end as slug,
    t.ativa,
    t.created_at,
    ps.nome as plano_nome,
    ps.slug as plano_slug,
    la.status as assinatura_status,
    la.trial_ativo,
    la.trial_fim,
    (
      select count(*)
      from public.tenant_users tu
      where tu.tenant_id = t.id
        and coalesce(tu.ativo, true) = true
    ) as usuarios_qtd,
    (
      select count(*)
      from public.profissionais pf
      where pf.tenant_id = t.id
    ) as profissionais_qtd,
    (
      select count(*)
      from public.profiles pr
      where pr.tenant_id = t.id
        and pr.role = 'cliente'
    ) as clientes_qtd,
    (
      select count(*)
      from public.pedidos p
      where p.tenant_id = t.id
    ) as pedidos_qtd
  from public.tenants t
  left join latest_assinaturas la on la.empresa_id = t.id
  left join public.planos_saas ps on ps.id = la.plano_id
  where public.is_super_admin()
    and (
      coalesce(trim(p_search), '') = ''
      or lower(t.name) like '%' || lower(trim(p_search)) || '%'
      or lower(t.slug) like '%' || lower(trim(p_search)) || '%'
      or lower(coalesce(ps.nome, '')) like '%' || lower(trim(p_search)) || '%'
    )
    and (
      coalesce(trim(p_status), '') = ''
      or lower(coalesce(la.status, 'sem_assinatura')) = lower(trim(p_status))
      or (
        lower(trim(p_status)) = 'suspensa'
        and t.ativa = false
      )
      or (
        lower(trim(p_status)) = 'ativa'
        and t.ativa = true
        and coalesce(la.status, '') = 'ativa'
      )
    )
  order by t.created_at desc;
$$;

create or replace function public.admin_web_list_planos()
returns table (
  id uuid,
  nome text,
  slug text,
  valor numeric,
  descricao text,
  limite_usuarios integer,
  limite_profissionais integer,
  limite_pedidos integer,
  limite_pedidos_mes integer,
  white_label boolean,
  suporte_prioritario boolean,
  acesso_financeiro_avancado boolean,
  acesso_relatorios boolean,
  ativo boolean,
  empresas_qtd bigint,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    ps.id,
    ps.nome,
    ps.slug,
    ps.valor,
    ps.descricao,
    ps.limite_usuarios,
    ps.limite_profissionais,
    ps.limite_pedidos,
    ps.limite_pedidos_mes,
    ps.white_label,
    ps.suporte_prioritario,
    ps.acesso_financeiro_avancado,
    ps.acesso_relatorios,
    ps.ativo,
    (
      select count(*)
      from public.assinaturas_saas a
      where a.plano_id = ps.id
        and a.id in (
          select distinct on (a2.empresa_id) a2.id
          from public.assinaturas_saas a2
          order by a2.empresa_id, a2.created_at desc
        )
    ) as empresas_qtd,
    ps.created_at
  from public.planos_saas ps
  where public.is_super_admin()
  order by ps.valor asc, ps.created_at asc;
$$;

create or replace function public.admin_web_upsert_plano(
  p_nome text,
  p_slug text,
  p_valor numeric,
  p_plano_id uuid default null,
  p_descricao text default null,
  p_limite_usuarios integer default null,
  p_limite_profissionais integer default null,
  p_limite_pedidos integer default null,
  p_limite_pedidos_mes integer default null,
  p_white_label boolean default false,
  p_suporte_prioritario boolean default false,
  p_acesso_financeiro_avancado boolean default false,
  p_acesso_relatorios boolean default false,
  p_ativo boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plano_id uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Acesso restrito ao super admin';
  end if;

  if nullif(trim(coalesce(p_nome, '')), '') is null then
    raise exception 'Nome do plano é obrigatório.';
  end if;

  if nullif(trim(coalesce(p_slug, '')), '') is null then
    raise exception 'Slug do plano é obrigatório.';
  end if;

  if p_plano_id is null then
    insert into public.planos_saas (
      nome,
      slug,
      valor,
      descricao,
      limite_usuarios,
      limite_profissionais,
      limite_pedidos,
      limite_pedidos_mes,
      white_label,
      suporte_prioritario,
      acesso_financeiro_avancado,
      acesso_relatorios,
      ativo
    )
    values (
      trim(p_nome),
      lower(trim(p_slug)),
      coalesce(p_valor, 0),
      nullif(trim(coalesce(p_descricao, '')), ''),
      p_limite_usuarios,
      p_limite_profissionais,
      p_limite_pedidos,
      p_limite_pedidos_mes,
      coalesce(p_white_label, false),
      coalesce(p_suporte_prioritario, false),
      coalesce(p_acesso_financeiro_avancado, false),
      coalesce(p_acesso_relatorios, false),
      coalesce(p_ativo, true)
    )
    returning id into v_plano_id;
  else
    update public.planos_saas
    set
      nome = trim(p_nome),
      slug = lower(trim(p_slug)),
      valor = coalesce(p_valor, 0),
      descricao = nullif(trim(coalesce(p_descricao, '')), ''),
      limite_usuarios = p_limite_usuarios,
      limite_profissionais = p_limite_profissionais,
      limite_pedidos = p_limite_pedidos,
      limite_pedidos_mes = p_limite_pedidos_mes,
      white_label = coalesce(p_white_label, false),
      suporte_prioritario = coalesce(p_suporte_prioritario, false),
      acesso_financeiro_avancado = coalesce(p_acesso_financeiro_avancado, false),
      acesso_relatorios = coalesce(p_acesso_relatorios, false),
      ativo = coalesce(p_ativo, true)
    where id = p_plano_id;

    v_plano_id := p_plano_id;
  end if;

  return v_plano_id;
end;
$$;

create or replace function public.admin_web_set_plano_active(
  p_plano_id uuid,
  p_ativo boolean
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

  update public.planos_saas
  set ativo = p_ativo
  where id = p_plano_id;
end;
$$;

create or replace function public.admin_web_list_assinaturas(
  p_search text default null,
  p_status text default null
)
returns table (
  assinatura_id uuid,
  empresa_id uuid,
  empresa_nome text,
  empresa_slug text,
  plano_id uuid,
  plano_nome text,
  plano_slug text,
  status text,
  trial_ativo boolean,
  trial_inicio timestamptz,
  trial_fim timestamptz,
  data_inicio timestamptz,
  data_fim timestamptz,
  gateway_customer_id text,
  gateway_subscription_id text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    a.id as assinatura_id,
    t.id as empresa_id,
    t.name as empresa_nome,
    case when t.slug = 'default' then 'casa-mineira-servicos' else t.slug end as empresa_slug,
    ps.id as plano_id,
    ps.nome as plano_nome,
    ps.slug as plano_slug,
    a.status,
    a.trial_ativo,
    a.trial_inicio,
    a.trial_fim,
    a.data_inicio,
    a.data_fim,
    a.gateway_customer_id,
    a.gateway_subscription_id,
    a.created_at
  from public.assinaturas_saas a
  join public.tenants t on t.id = a.empresa_id
  left join public.planos_saas ps on ps.id = a.plano_id
  where public.is_super_admin()
    and (
      coalesce(trim(p_search), '') = ''
      or lower(t.name) like '%' || lower(trim(p_search)) || '%'
      or lower(t.slug) like '%' || lower(trim(p_search)) || '%'
      or lower(coalesce(ps.nome, '')) like '%' || lower(trim(p_search)) || '%'
    )
    and (
      coalesce(trim(p_status), '') = ''
      or lower(a.status) = lower(trim(p_status))
    )
  order by a.created_at desc;
$$;

create or replace function public.admin_web_update_assinatura(
  p_assinatura_id uuid,
  p_plano_id uuid default null,
  p_status text default null,
  p_trial_ativo boolean default null,
  p_trial_fim timestamptz default null,
  p_data_fim timestamptz default null,
  p_gateway_customer_id text default null,
  p_gateway_subscription_id text default null
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
    plano_id = coalesce(p_plano_id, plano_id),
    status = coalesce(p_status, status),
    trial_ativo = coalesce(p_trial_ativo, trial_ativo),
    trial_fim = coalesce(p_trial_fim, trial_fim),
    data_fim = coalesce(p_data_fim, data_fim),
    gateway_customer_id = case
      when p_gateway_customer_id is null then gateway_customer_id
      else nullif(trim(p_gateway_customer_id), '')
    end,
    gateway_subscription_id = case
      when p_gateway_subscription_id is null then gateway_subscription_id
      else nullif(trim(p_gateway_subscription_id), '')
    end
  where id = p_assinatura_id;
end;
$$;

create or replace function public.admin_web_list_usuarios(
  p_search text default null,
  p_empresa_id uuid default null,
  p_role text default null
)
returns table (
  tenant_user_id uuid,
  user_id uuid,
  nome text,
  email text,
  empresa_id uuid,
  empresa_nome text,
  role text,
  ativo boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    tu.id as tenant_user_id,
    tu.user_id,
    coalesce(pr.name, au.raw_user_meta_data ->> 'name', 'Usuário') as nome,
    au.email,
    t.id as empresa_id,
    t.name as empresa_nome,
    tu.role,
    coalesce(tu.ativo, true) as ativo,
    tu.created_at,
    au.last_sign_in_at
  from public.tenant_users tu
  join public.tenants t on t.id = tu.tenant_id
  left join public.profiles pr on pr.id = tu.user_id
  left join auth.users au on au.id = tu.user_id
  where public.is_super_admin()
    and (
      coalesce(trim(p_search), '') = ''
      or lower(coalesce(pr.name, au.email, '')) like '%' || lower(trim(p_search)) || '%'
      or lower(coalesce(au.email, '')) like '%' || lower(trim(p_search)) || '%'
      or lower(coalesce(t.name, '')) like '%' || lower(trim(p_search)) || '%'
    )
    and (
      p_empresa_id is null
      or tu.tenant_id = p_empresa_id
    )
    and (
      coalesce(trim(p_role), '') = ''
      or lower(tu.role) = lower(trim(p_role))
    )
  order by tu.created_at desc;
$$;

create or replace function public.admin_web_set_tenant_user_active(
  p_tenant_user_id uuid,
  p_ativo boolean
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

  update public.tenant_users
  set
    ativo = p_ativo,
    is_default = case when p_ativo then is_default else false end
  where id = p_tenant_user_id;
end;
$$;

revoke all on function public.admin_web_get_dashboard() from public;
revoke all on function public.admin_web_list_empresas(text, text) from public;
revoke all on function public.admin_web_list_planos() from public;
revoke all on function public.admin_web_upsert_plano(text, text, numeric, uuid, text, integer, integer, integer, integer, boolean, boolean, boolean, boolean, boolean) from public;
revoke all on function public.admin_web_set_plano_active(uuid, boolean) from public;
revoke all on function public.admin_web_list_assinaturas(text, text) from public;
revoke all on function public.admin_web_update_assinatura(uuid, uuid, text, boolean, timestamptz, timestamptz, text, text) from public;
revoke all on function public.admin_web_list_usuarios(text, uuid, text) from public;
revoke all on function public.admin_web_set_tenant_user_active(uuid, boolean) from public;

grant execute on function public.admin_web_get_dashboard() to authenticated;
grant execute on function public.admin_web_list_empresas(text, text) to authenticated;
grant execute on function public.admin_web_list_planos() to authenticated;
grant execute on function public.admin_web_upsert_plano(text, text, numeric, uuid, text, integer, integer, integer, integer, boolean, boolean, boolean, boolean, boolean) to authenticated;
grant execute on function public.admin_web_set_plano_active(uuid, boolean) to authenticated;
grant execute on function public.admin_web_list_assinaturas(text, text) to authenticated;
grant execute on function public.admin_web_update_assinatura(uuid, uuid, text, boolean, timestamptz, timestamptz, text, text) to authenticated;
grant execute on function public.admin_web_list_usuarios(text, uuid, text) to authenticated;
grant execute on function public.admin_web_set_tenant_user_active(uuid, boolean) to authenticated;
