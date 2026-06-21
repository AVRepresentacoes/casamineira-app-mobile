do $$
begin
  if to_regprocedure('public.is_super_admin()') is null then
    raise exception 'Dependência ausente: execute 20260314120000_saas_empresa_foundation.sql antes desta migration.';
  end if;

  if to_regclass('public.assinaturas_saas') is null then
    raise exception 'Dependência ausente: execute 20260314123000_saas_admin_billing.sql antes desta migration.';
  end if;
end $$;

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
  white_label boolean,
  suporte_prioritario boolean,
  assinatura_id uuid,
  assinatura_status text,
  data_inicio timestamptz,
  data_fim timestamptz,
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
    ps.white_label,
    ps.suporte_prioritario,
    a.id as assinatura_id,
    a.status as assinatura_status,
    a.data_inicio,
    a.data_fim,
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

create or replace function public.saas_admin_update_empresa(
  p_empresa_id uuid,
  p_nome text default null,
  p_slug text default null,
  p_ativa boolean default null,
  p_dominio text default null,
  p_telefone text default null,
  p_email text default null,
  p_logo_url text default null,
  p_cor_primaria text default null,
  p_cor_secundaria text default null,
  p_nome_exibicao text default null,
  p_descricao text default null,
  p_whatsapp text default null,
  p_endereco text default null,
  p_cidade text default null,
  p_estado text default null,
  p_modo_marketplace boolean default null,
  p_modo_white_label boolean default null,
  p_plano_id uuid default null,
  p_assinatura_status text default null,
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

  update public.tenants
  set
    name = coalesce(nullif(trim(coalesce(p_nome, '')), ''), name),
    slug = coalesce(lower(nullif(trim(coalesce(p_slug, '')), '')), slug),
    ativa = coalesce(p_ativa, ativa),
    status = case
      when coalesce(p_ativa, ativa) then 'active'
      else 'suspended'
    end,
    dominio = case when p_dominio is null then dominio else nullif(trim(p_dominio), '') end,
    telefone = case when p_telefone is null then telefone else nullif(trim(p_telefone), '') end,
    email = case when p_email is null then email else nullif(trim(p_email), '') end,
    logo_url = case when p_logo_url is null then logo_url else nullif(trim(p_logo_url), '') end,
    cor_primaria = case when p_cor_primaria is null then cor_primaria else nullif(trim(p_cor_primaria), '') end,
    cor_secundaria = case when p_cor_secundaria is null then cor_secundaria else nullif(trim(p_cor_secundaria), '') end
  where id = p_empresa_id;

  insert into public.empresa_configuracoes (
    empresa_id,
    nome_exibicao,
    descricao,
    whatsapp,
    endereco,
    cidade,
    estado,
    modo_marketplace,
    modo_white_label
  )
  values (
    p_empresa_id,
    nullif(trim(coalesce(p_nome_exibicao, '')), ''),
    nullif(trim(coalesce(p_descricao, '')), ''),
    nullif(trim(coalesce(p_whatsapp, '')), ''),
    nullif(trim(coalesce(p_endereco, '')), ''),
    nullif(trim(coalesce(p_cidade, '')), ''),
    nullif(trim(coalesce(p_estado, '')), ''),
    coalesce(p_modo_marketplace, true),
    coalesce(p_modo_white_label, false)
  )
  on conflict (empresa_id) do update
  set
    nome_exibicao = case when p_nome_exibicao is null then public.empresa_configuracoes.nome_exibicao else excluded.nome_exibicao end,
    descricao = case when p_descricao is null then public.empresa_configuracoes.descricao else excluded.descricao end,
    whatsapp = case when p_whatsapp is null then public.empresa_configuracoes.whatsapp else excluded.whatsapp end,
    endereco = case when p_endereco is null then public.empresa_configuracoes.endereco else excluded.endereco end,
    cidade = case when p_cidade is null then public.empresa_configuracoes.cidade else excluded.cidade end,
    estado = case when p_estado is null then public.empresa_configuracoes.estado else excluded.estado end,
    modo_marketplace = coalesce(p_modo_marketplace, public.empresa_configuracoes.modo_marketplace),
    modo_white_label = coalesce(p_modo_white_label, public.empresa_configuracoes.modo_white_label);

  if p_plano_id is not null or p_assinatura_status is not null or p_gateway_subscription_id is not null then
    update public.assinaturas_saas
    set
      plano_id = coalesce(p_plano_id, plano_id),
      status = coalesce(p_assinatura_status, status),
      gateway_subscription_id = case
        when p_gateway_subscription_id is null then gateway_subscription_id
        else nullif(trim(p_gateway_subscription_id), '')
      end
    where id = (
      select a.id
      from public.assinaturas_saas a
      where a.empresa_id = p_empresa_id
      order by a.created_at desc
      limit 1
    );
  end if;
end;
$$;

create or replace function public.saas_admin_assign_empresa_admin(
  p_empresa_id uuid,
  p_user_id uuid
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

  insert into public.tenant_users (
    tenant_id,
    user_id,
    role,
    is_default
  )
  values (
    p_empresa_id,
    p_user_id,
    'admin_empresa',
    false
  )
  on conflict (tenant_id, user_id) do update
  set role = 'admin_empresa';
end;
$$;

create or replace function public.empresa_admin_upsert_current_empresa_branding(
  p_nome_exibicao text default null,
  p_descricao text default null,
  p_logo_url text default null,
  p_cor_primaria text default null,
  p_cor_secundaria text default null,
  p_whatsapp text default null,
  p_endereco text default null,
  p_cidade text default null,
  p_estado text default null,
  p_modo_marketplace boolean default null,
  p_modo_white_label boolean default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
begin
  v_empresa_id := public.current_empresa_id();

  if not public.is_empresa_admin(v_empresa_id) then
    raise exception 'Acesso restrito ao admin da empresa';
  end if;

  update public.tenants
  set
    logo_url = case when p_logo_url is null then logo_url else nullif(trim(p_logo_url), '') end,
    cor_primaria = case when p_cor_primaria is null then cor_primaria else nullif(trim(p_cor_primaria), '') end,
    cor_secundaria = case when p_cor_secundaria is null then cor_secundaria else nullif(trim(p_cor_secundaria), '') end
  where id = v_empresa_id;

  insert into public.empresa_configuracoes (
    empresa_id,
    nome_exibicao,
    descricao,
    whatsapp,
    endereco,
    cidade,
    estado,
    modo_marketplace,
    modo_white_label
  )
  values (
    v_empresa_id,
    nullif(trim(coalesce(p_nome_exibicao, '')), ''),
    nullif(trim(coalesce(p_descricao, '')), ''),
    nullif(trim(coalesce(p_whatsapp, '')), ''),
    nullif(trim(coalesce(p_endereco, '')), ''),
    nullif(trim(coalesce(p_cidade, '')), ''),
    nullif(trim(coalesce(p_estado, '')), ''),
    coalesce(p_modo_marketplace, true),
    coalesce(p_modo_white_label, false)
  )
  on conflict (empresa_id) do update
  set
    nome_exibicao = case when p_nome_exibicao is null then public.empresa_configuracoes.nome_exibicao else excluded.nome_exibicao end,
    descricao = case when p_descricao is null then public.empresa_configuracoes.descricao else excluded.descricao end,
    whatsapp = case when p_whatsapp is null then public.empresa_configuracoes.whatsapp else excluded.whatsapp end,
    endereco = case when p_endereco is null then public.empresa_configuracoes.endereco else excluded.endereco end,
    cidade = case when p_cidade is null then public.empresa_configuracoes.cidade else excluded.cidade end,
    estado = case when p_estado is null then public.empresa_configuracoes.estado else excluded.estado end,
    modo_marketplace = coalesce(p_modo_marketplace, public.empresa_configuracoes.modo_marketplace),
    modo_white_label = coalesce(p_modo_white_label, public.empresa_configuracoes.modo_white_label);
end;
$$;

drop function if exists public.get_my_empresa_saas_subscription();

create or replace function public.get_my_empresa_saas_subscription()
returns table (
  empresa_id uuid,
  plano_id uuid,
  plano_nome text,
  plano_valor numeric,
  limite_usuarios integer,
  limite_profissionais integer,
  limite_pedidos integer,
  white_label boolean,
  suporte_prioritario boolean,
  assinatura_status text,
  data_inicio timestamptz,
  data_fim timestamptz,
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
    ps.valor as plano_valor,
    ps.limite_usuarios,
    ps.limite_profissionais,
    ps.limite_pedidos,
    ps.white_label,
    ps.suporte_prioritario,
    a.status as assinatura_status,
    a.data_inicio,
    a.data_fim,
    a.gateway_subscription_id
  from public.assinaturas_saas a
  left join public.planos_saas ps on ps.id = a.plano_id
  where a.empresa_id = public.current_empresa_id()
  order by a.created_at desc
  limit 1;
$$;

revoke all on function public.get_saas_empresa_detail(uuid) from public;
revoke all on function public.saas_admin_update_empresa(uuid, text, text, boolean, text, text, text, text, text, text, text, text, text, text, text, text, boolean, boolean, uuid, text, text) from public;
revoke all on function public.saas_admin_assign_empresa_admin(uuid, uuid) from public;
revoke all on function public.empresa_admin_upsert_current_empresa_branding(text, text, text, text, text, text, text, text, text, boolean, boolean) from public;
revoke all on function public.get_my_empresa_saas_subscription() from public;

grant execute on function public.get_saas_empresa_detail(uuid) to authenticated;
grant execute on function public.saas_admin_update_empresa(uuid, text, text, boolean, text, text, text, text, text, text, text, text, text, text, text, text, boolean, boolean, uuid, text, text) to authenticated;
grant execute on function public.saas_admin_assign_empresa_admin(uuid, uuid) to authenticated;
grant execute on function public.empresa_admin_upsert_current_empresa_branding(text, text, text, text, text, text, text, text, text, boolean, boolean) to authenticated;
grant execute on function public.get_my_empresa_saas_subscription() to authenticated;
