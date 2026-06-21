do $$
begin
  if to_regprocedure('public.get_my_empresa_commercial_context()') is null then
    raise exception 'Dependência ausente: execute 20260314140000_saas_commercial_foundation.sql antes desta migration.';
  end if;
end $$;

create or replace function public.get_active_planos_saas()
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
    ps.created_at
  from public.planos_saas ps
  where ps.ativo = true
  order by ps.valor asc, ps.created_at asc;
$$;

create or replace function public.get_my_empresa_onboarding_status()
returns table (
  empresa_id uuid,
  branding_ok boolean,
  whatsapp_ok boolean,
  tem_profissional boolean,
  tem_cliente boolean,
  tem_pedido boolean,
  checklist_concluido boolean
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      t.id as empresa_id,
      coalesce(ec.nome_exibicao, t.name) as nome_exibicao,
      t.logo_url,
      t.cor_primaria,
      t.cor_secundaria,
      ec.whatsapp
    from public.tenants t
    left join public.empresa_configuracoes ec on ec.empresa_id = t.id
    where t.id = public.current_empresa_id()
  )
  select
    status.empresa_id,
    status.branding_ok,
    status.whatsapp_ok,
    status.tem_profissional,
    status.tem_cliente,
    status.tem_pedido,
    (
      status.branding_ok
      and status.whatsapp_ok
      and status.tem_profissional
      and status.tem_cliente
      and status.tem_pedido
    ) as checklist_concluido
  from (
    select
      b.empresa_id,
      (
        nullif(trim(coalesce(b.nome_exibicao, '')), '') is not null
        and nullif(trim(coalesce(b.logo_url, '')), '') is not null
        and nullif(trim(coalesce(b.cor_primaria, '')), '') is not null
      ) as branding_ok,
      nullif(trim(coalesce(b.whatsapp, '')), '') is not null as whatsapp_ok,
      exists (
        select 1
        from public.profissionais pf
        where pf.tenant_id = b.empresa_id
      ) as tem_profissional,
      exists (
        select 1
        from public.profiles pr
        where pr.tenant_id = b.empresa_id
          and pr.role = 'cliente'
      ) as tem_cliente,
      exists (
        select 1
        from public.pedidos p
        where p.tenant_id = b.empresa_id
      ) as tem_pedido
    from base b
  ) status;
$$;

drop function if exists public.get_my_empresa_saas_subscription();

create or replace function public.get_my_empresa_saas_subscription()
returns table (
  empresa_id uuid,
  plano_id uuid,
  plano_nome text,
  plano_slug text,
  plano_valor numeric,
  limite_usuarios integer,
  limite_profissionais integer,
  limite_pedidos integer,
  limite_pedidos_mes integer,
  white_label boolean,
  suporte_prioritario boolean,
  acesso_financeiro_avancado boolean,
  acesso_relatorios boolean,
  assinatura_status text,
  trial_ativo boolean,
  trial_inicio timestamptz,
  trial_fim timestamptz,
  data_inicio timestamptz,
  data_fim timestamptz,
  gateway_customer_id text,
  gateway_subscription_id text
)
language sql
security definer
set search_path = public
as $$
  select
    a.empresa_id,
    ps.id as plano_id,
    ps.nome as plano_nome,
    ps.slug as plano_slug,
    ps.valor as plano_valor,
    ps.limite_usuarios,
    ps.limite_profissionais,
    ps.limite_pedidos,
    ps.limite_pedidos_mes,
    ps.white_label,
    ps.suporte_prioritario,
    ps.acesso_financeiro_avancado,
    ps.acesso_relatorios,
    a.status as assinatura_status,
    a.trial_ativo,
    a.trial_inicio,
    a.trial_fim,
    a.data_inicio,
    a.data_fim,
    a.gateway_customer_id,
    a.gateway_subscription_id
  from public.assinaturas_saas a
  left join public.planos_saas ps on ps.id = a.plano_id
  where a.empresa_id = public.current_empresa_id()
  order by a.created_at desc
  limit 1;
$$;

drop function if exists public.get_saas_empresa_detail(uuid);

create or replace function public.get_saas_empresa_detail(
  p_empresa_id uuid
)
returns table (
  empresa_id uuid,
  slug text,
  nome text,
  ativa boolean,
  dominio text,
  telefone text,
  email text,
  logo_url text,
  cor_primaria text,
  cor_secundaria text,
  nome_exibicao text,
  descricao text,
  whatsapp text,
  endereco text,
  cidade text,
  estado text,
  modo_marketplace boolean,
  modo_white_label boolean,
  usuarios_qtd bigint,
  pedidos_qtd bigint,
  plano_id uuid,
  plano_nome text,
  plano_valor numeric,
  limite_usuarios integer,
  limite_profissionais integer,
  limite_pedidos integer,
  limite_pedidos_mes integer,
  white_label boolean,
  suporte_prioritario boolean,
  assinatura_id uuid,
  assinatura_status text,
  trial_ativo boolean,
  trial_inicio timestamptz,
  trial_fim timestamptz,
  data_inicio timestamptz,
  data_fim timestamptz,
  gateway_customer_id text,
  gateway_subscription_id text
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
    t.dominio,
    t.telefone,
    t.email,
    t.logo_url,
    t.cor_primaria,
    t.cor_secundaria,
    ec.nome_exibicao,
    ec.descricao,
    ec.whatsapp,
    ec.endereco,
    ec.cidade,
    ec.estado,
    coalesce(ec.modo_marketplace, true) as modo_marketplace,
    coalesce(ec.modo_white_label, false) as modo_white_label,
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
    ps.id as plano_id,
    ps.nome as plano_nome,
    ps.valor as plano_valor,
    ps.limite_usuarios,
    ps.limite_profissionais,
    ps.limite_pedidos,
    ps.limite_pedidos_mes,
    ps.white_label,
    ps.suporte_prioritario,
    a.id as assinatura_id,
    a.status as assinatura_status,
    a.trial_ativo,
    a.trial_inicio,
    a.trial_fim,
    a.data_inicio,
    a.data_fim,
    a.gateway_customer_id,
    a.gateway_subscription_id
  from public.tenants t
  left join public.empresa_configuracoes ec on ec.empresa_id = t.id
  left join lateral (
    select a1.*
    from public.assinaturas_saas a1
    where a1.empresa_id = t.id
    order by a1.created_at desc
    limit 1
  ) a on true
  left join public.planos_saas ps on ps.id = a.plano_id
  where t.id = p_empresa_id
    and public.is_super_admin();
$$;

create or replace function public.empresa_has_feature(
  p_feature text,
  p_empresa_id uuid default public.current_empresa_id()
)
returns boolean
language sql
security definer
set search_path = public
as $$
  with ctx as (
    select *
    from public.get_empresa_saas_context(p_empresa_id)
  )
  select case lower(coalesce(p_feature, ''))
    when 'white_label' then coalesce((select white_label from ctx), false)
    when 'relatorios' then coalesce((select acesso_relatorios from ctx), false)
    when 'financeiro_avancado' then coalesce((select acesso_financeiro_avancado from ctx), false)
    when 'suporte_prioritario' then coalesce((select suporte_prioritario from ctx), false)
    else false
  end;
$$;

create or replace function public.assert_current_empresa_plan_allows(
  p_action text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ctx record;
begin
  select *
    into v_ctx
  from public.get_my_empresa_commercial_context()
  limit 1;

  if v_ctx is null then
    raise exception 'Contexto comercial da empresa não encontrado.';
  end if;

  if coalesce(v_ctx.assinatura_bloqueada, false) then
    raise exception 'A assinatura da empresa está bloqueada. Regularize ou faça upgrade para continuar.';
  end if;

  case lower(coalesce(p_action, ''))
    when 'create_user' then
      if v_ctx.limite_usuarios is not null and v_ctx.usuarios_usados >= v_ctx.limite_usuarios then
        raise exception 'Seu plano atingiu o limite de usuários.';
      end if;
    when 'create_profissional' then
      if v_ctx.limite_profissionais is not null and v_ctx.profissionais_usados >= v_ctx.limite_profissionais then
        raise exception 'Seu plano atingiu o limite de profissionais.';
      end if;
    when 'create_pedido' then
      if v_ctx.limite_pedidos_mes is not null and v_ctx.pedidos_mes_usados >= v_ctx.limite_pedidos_mes then
        raise exception 'Seu plano atingiu o limite mensal de pedidos.';
      end if;
    when 'use_white_label' then
      if not coalesce(v_ctx.white_label, false) then
        raise exception 'White-label disponível apenas nos planos Pro e Enterprise.';
      end if;
    when 'use_relatorios' then
      if not coalesce(v_ctx.acesso_relatorios, false) then
        raise exception 'Relatórios avançados disponíveis apenas nos planos Pro e Enterprise.';
      end if;
    when 'use_financeiro_avancado' then
      if not coalesce(v_ctx.acesso_financeiro_avancado, false) then
        raise exception 'Financeiro avançado disponível apenas nos planos Pro e Enterprise.';
      end if;
    else
      null;
  end case;
end;
$$;

create or replace function public.preview_saas_plan_change(
  p_empresa_id uuid,
  p_plano_id uuid
)
returns table (
  plano_atual_id uuid,
  plano_atual_slug text,
  plano_atual_nome text,
  novo_plano_id uuid,
  novo_plano_slug text,
  novo_plano_nome text,
  can_apply boolean,
  requires_attention boolean,
  motivo text,
  usuarios_usados integer,
  profissionais_usados integer,
  pedidos_mes_usados integer,
  limite_usuarios_novo integer,
  limite_profissionais_novo integer,
  limite_pedidos_mes_novo integer
)
language sql
security definer
set search_path = public
as $$
  with atual as (
    select *
    from public.get_empresa_saas_context(p_empresa_id)
  ),
  novo as (
    select *
    from public.planos_saas
    where id = p_plano_id
      and ativo = true
    limit 1
  )
  select
    a.plano_id as plano_atual_id,
    a.plano_slug as plano_atual_slug,
    a.plano_nome as plano_atual_nome,
    n.id as novo_plano_id,
    n.slug as novo_plano_slug,
    n.nome as novo_plano_nome,
    case
      when n.id is null then false
      when n.limite_usuarios is not null and a.usuarios_usados > n.limite_usuarios then false
      when n.limite_profissionais is not null and a.profissionais_usados > n.limite_profissionais then false
      when n.limite_pedidos_mes is not null and a.pedidos_mes_usados > n.limite_pedidos_mes then false
      else true
    end as can_apply,
    case
      when n.id is null then true
      when a.plano_id is distinct from n.id and (
        (n.limite_usuarios is not null and a.usuarios_usados > n.limite_usuarios)
        or (n.limite_profissionais is not null and a.profissionais_usados > n.limite_profissionais)
        or (n.limite_pedidos_mes is not null and a.pedidos_mes_usados > n.limite_pedidos_mes)
      ) then true
      else false
    end as requires_attention,
    case
      when n.id is null then 'Plano selecionado não está ativo.'
      when n.limite_usuarios is not null and a.usuarios_usados > n.limite_usuarios then 'A empresa já usa mais usuários do que o novo plano permite.'
      when n.limite_profissionais is not null and a.profissionais_usados > n.limite_profissionais then 'A empresa já usa mais profissionais do que o novo plano permite.'
      when n.limite_pedidos_mes is not null and a.pedidos_mes_usados > n.limite_pedidos_mes then 'A empresa já excede o limite mensal de pedidos do novo plano.'
      else null
    end as motivo,
    a.usuarios_usados,
    a.profissionais_usados,
    a.pedidos_mes_usados,
    n.limite_usuarios as limite_usuarios_novo,
    n.limite_profissionais as limite_profissionais_novo,
    n.limite_pedidos_mes as limite_pedidos_mes_novo
  from atual a
  cross join novo n;
$$;

create or replace function public.preview_current_empresa_plan_change(
  p_plano_id uuid
)
returns table (
  plano_atual_id uuid,
  plano_atual_slug text,
  plano_atual_nome text,
  novo_plano_id uuid,
  novo_plano_slug text,
  novo_plano_nome text,
  can_apply boolean,
  requires_attention boolean,
  motivo text,
  usuarios_usados integer,
  profissionais_usados integer,
  pedidos_mes_usados integer,
  limite_usuarios_novo integer,
  limite_profissionais_novo integer,
  limite_pedidos_mes_novo integer
)
language sql
security definer
set search_path = public
as $$
  select *
  from public.preview_saas_plan_change(public.current_empresa_id(), p_plano_id);
$$;

create or replace function public.change_current_empresa_plan(
  p_plano_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_preview record;
begin
  v_empresa_id := public.current_empresa_id();

  if not public.is_empresa_admin(v_empresa_id) then
    raise exception 'Acesso restrito ao admin da empresa';
  end if;

  select *
    into v_preview
  from public.preview_saas_plan_change(v_empresa_id, p_plano_id)
  limit 1;

  if v_preview is null then
    raise exception 'Não foi possível validar a troca de plano.';
  end if;

  if not coalesce(v_preview.can_apply, false) then
    raise exception '%', coalesce(v_preview.motivo, 'O novo plano não pode ser aplicado agora.');
  end if;

  update public.assinaturas_saas
  set
    plano_id = p_plano_id,
    status = case
      when status = 'trial' then 'trial'
      when status = 'cancelada' then 'ativa'
      when status = 'expirada' then 'ativa'
      else status
    end,
    trial_ativo = case when status = 'trial' then trial_ativo else false end
  where id = (
    select a.id
    from public.assinaturas_saas a
    where a.empresa_id = v_empresa_id
    order by a.created_at desc
    limit 1
  );
end;
$$;

revoke all on function public.get_active_planos_saas() from public;
revoke all on function public.get_my_empresa_onboarding_status() from public;
revoke all on function public.empresa_has_feature(text, uuid) from public;
revoke all on function public.assert_current_empresa_plan_allows(text) from public;
revoke all on function public.preview_saas_plan_change(uuid, uuid) from public;
revoke all on function public.preview_current_empresa_plan_change(uuid) from public;
revoke all on function public.change_current_empresa_plan(uuid) from public;

grant execute on function public.get_active_planos_saas() to authenticated;
grant execute on function public.get_my_empresa_onboarding_status() to authenticated;
grant execute on function public.empresa_has_feature(text, uuid) to authenticated;
grant execute on function public.assert_current_empresa_plan_allows(text) to authenticated;
grant execute on function public.preview_saas_plan_change(uuid, uuid) to authenticated;
grant execute on function public.preview_current_empresa_plan_change(uuid) to authenticated;
grant execute on function public.change_current_empresa_plan(uuid) to authenticated;
