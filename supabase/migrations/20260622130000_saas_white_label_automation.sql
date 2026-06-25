-- White-label automation and tenant lock support.

alter table public.tenants
  add column if not exists public_signup_enabled boolean not null default true;

update public.tenants
set public_signup_enabled = true
where public_signup_enabled is distinct from true;

create or replace function public.resolve_public_signup_tenant_id(
  p_tenant_slug text default 'default'
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.id
  from public.tenants t
  where lower(t.slug) = lower(coalesce(nullif(trim(p_tenant_slug), ''), 'default'))
    and t.status = 'active'
    and coalesce(t.ativa, true) = true
    and coalesce(t.public_signup_enabled, false) = true
  limit 1;
$$;

create or replace function public.ensure_app_tenant_context(
  p_tenant_slug text default 'default',
  p_lock_to_tenant boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant_id uuid;
  v_role text;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  select t.id
    into v_tenant_id
  from public.tenants t
  where lower(t.slug) = lower(coalesce(nullif(trim(p_tenant_slug), ''), 'default'))
    and t.status = 'active'
    and coalesce(t.ativa, true) = true
  limit 1;

  if v_tenant_id is null then
    if p_lock_to_tenant then
      raise exception 'Tenant do app não encontrado ou inativo';
    end if;

    return public.ensure_current_user_tenant_context();
  end if;

  select tu.role
    into v_role
  from public.tenant_users tu
  where tu.user_id = v_uid
    and tu.tenant_id = v_tenant_id
  limit 1;

  if v_role is null then
    if not exists (
      select 1
      from public.tenants t
      where t.id = v_tenant_id
        and coalesce(t.public_signup_enabled, false) = true
    ) then
      raise exception 'Usuário não pertence ao tenant deste app';
    end if;

    insert into public.tenant_users (tenant_id, user_id, role, is_default)
    values (v_tenant_id, v_uid, 'cliente', false)
    on conflict (tenant_id, user_id) do nothing;
  end if;

  update public.tenant_users
     set is_default = false
   where user_id = v_uid
     and is_default = true
     and tenant_id <> v_tenant_id;

  update public.tenant_users
     set is_default = true
   where user_id = v_uid
     and tenant_id = v_tenant_id;

  return v_tenant_id;
end;
$$;

drop function if exists public.saas_admin_create_empresa(text, text, uuid, text);

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
    ativa,
    public_signup_enabled
  )
  values (
    lower(trim(p_slug)),
    trim(p_nome),
    'active',
    'starter',
    nullif(trim(coalesce(p_dominio, '')), ''),
    true,
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

revoke all on function public.resolve_public_signup_tenant_id(text) from public;
revoke all on function public.ensure_app_tenant_context(text, boolean) from public;
revoke all on function public.saas_admin_create_empresa(text, text, uuid, text) from public;

grant execute on function public.resolve_public_signup_tenant_id(text) to anon, authenticated;
grant execute on function public.ensure_app_tenant_context(text, boolean) to authenticated;
grant execute on function public.saas_admin_create_empresa(text, text, uuid, text) to authenticated;
