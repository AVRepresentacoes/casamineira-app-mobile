do $$
begin
  if to_regprocedure('public.get_active_planos_saas()') is null then
    raise exception 'Dependência ausente: execute 20260314143000_saas_plan_enforcement.sql antes desta migration.';
  end if;
end $$;

create table if not exists public.empresa_profissional_convites (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  nome text,
  token text not null unique,
  status text not null default 'pendente',
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint empresa_profissional_convites_status_check check (status in ('pendente', 'aceito', 'expirado', 'cancelado'))
);

create index if not exists empresa_profissional_convites_empresa_created_idx
  on public.empresa_profissional_convites (empresa_id, created_at desc);

create index if not exists empresa_profissional_convites_email_idx
  on public.empresa_profissional_convites (lower(email));

create or replace function public.set_updated_at_empresa_profissional_convites()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_empresa_profissional_convites_updated_at on public.empresa_profissional_convites;
create trigger trg_empresa_profissional_convites_updated_at
before update on public.empresa_profissional_convites
for each row
execute function public.set_updated_at_empresa_profissional_convites();

alter table public.empresa_profissional_convites enable row level security;

drop policy if exists empresa_profissional_convites_select_admin on public.empresa_profissional_convites;
create policy empresa_profissional_convites_select_admin
on public.empresa_profissional_convites
for select
to authenticated
using (public.is_empresa_admin(empresa_id) or public.is_super_admin());

drop policy if exists empresa_profissional_convites_manage_admin on public.empresa_profissional_convites;
create policy empresa_profissional_convites_manage_admin
on public.empresa_profissional_convites
for all
to authenticated
using (public.is_empresa_admin(empresa_id) or public.is_super_admin())
with check (public.is_empresa_admin(empresa_id) or public.is_super_admin());

create or replace function public.get_public_planos_saas()
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
  acesso_relatorios boolean
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
    ps.acesso_relatorios
  from public.planos_saas ps
  where ps.ativo = true
  order by ps.valor asc, ps.created_at asc;
$$;

create or replace function public.get_my_empresa_dashboard_summary()
returns table (
  empresa_id uuid,
  pedidos_total integer,
  pedidos_mes integer,
  clientes_total integer,
  profissionais_total integer,
  profissionais_ativos integer,
  receita_estimada numeric,
  pedidos_recentes jsonb,
  atividade_recente jsonb
)
language sql
security definer
set search_path = public
as $$
  with empresa as (
    select public.current_empresa_id() as empresa_id
  ),
  mes as (
    select date_trunc('month', now()) as inicio
  ),
  pedidos_recentes as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'categoria', p.categoria,
          'status', p.status,
          'created_at', p.created_at
        )
        order by p.created_at desc
      ),
      '[]'::jsonb
    ) as payload
    from (
      select p.id, p.categoria, p.status, p.created_at
      from public.pedidos p, empresa e
      where p.tenant_id = e.empresa_id
      order by p.created_at desc
      limit 5
    ) p
  ),
  atividade as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'tipo', x.tipo,
          'titulo', x.titulo,
          'created_at', x.created_at
        )
        order by x.created_at desc
      ),
      '[]'::jsonb
    ) as payload
    from (
      select 'pedido'::text as tipo, coalesce(p.categoria, 'Novo pedido') as titulo, p.created_at
      from public.pedidos p, empresa e
      where p.tenant_id = e.empresa_id
      union all
      select 'profissional'::text as tipo, coalesce(pr.name, 'Profissional') as titulo, coalesce(pf.updated_at, pr.created_at) as created_at
      from public.profissionais pf
      join public.profiles pr on pr.id = pf.user_id
      join empresa e on e.empresa_id = pf.tenant_id
      union all
      select 'cliente'::text as tipo, coalesce(pr.name, 'Cliente') as titulo, pr.created_at
      from public.profiles pr
      join empresa e on e.empresa_id = pr.tenant_id
      where pr.role = 'cliente'
    ) x
    limit 8
  )
  select
    e.empresa_id,
    (
      select count(*)::int
      from public.pedidos p
      where p.tenant_id = e.empresa_id
    ) as pedidos_total,
    (
      select count(*)::int
      from public.pedidos p, mes m
      where p.tenant_id = e.empresa_id
        and p.created_at >= m.inicio
    ) as pedidos_mes,
    (
      select count(*)::int
      from public.profiles pr
      where pr.tenant_id = e.empresa_id
        and pr.role = 'cliente'
    ) as clientes_total,
    (
      select count(*)::int
      from public.profissionais pf
      where pf.tenant_id = e.empresa_id
    ) as profissionais_total,
    (
      select count(*)::int
      from public.profissionais pf
      where pf.tenant_id = e.empresa_id
        and coalesce(pf.ativo, false) = true
    ) as profissionais_ativos,
    (
      select coalesce(sum(pg.valor_total), 0)
      from public.pagamentos pg
      where pg.tenant_id = e.empresa_id
        and lower(coalesce(pg.status_pagamento, pg.status_pagamentos, '')) in ('aprovada', 'pago')
    ) as receita_estimada,
    (select payload from pedidos_recentes) as pedidos_recentes,
    (select payload from atividade) as atividade_recente
  from empresa e;
$$;

create or replace function public.create_profissional_invite(
  p_email text,
  p_nome text default null
)
returns table (
  convite_id uuid,
  token text,
  invite_url text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_uid uuid;
  v_convite_id uuid;
  v_token text;
  v_expires_at timestamptz;
begin
  v_empresa_id := public.current_empresa_id();
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Usuário autenticado é obrigatório.';
  end if;

  if not public.is_empresa_admin(v_empresa_id) then
    raise exception 'Acesso restrito ao admin da empresa';
  end if;

  perform public.assert_current_empresa_plan_allows('create_profissional');

  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_expires_at := now() + interval '7 days';

  insert into public.empresa_profissional_convites (
    empresa_id,
    email,
    nome,
    token,
    invited_by,
    expires_at
  )
  values (
    v_empresa_id,
    lower(trim(p_email)),
    nullif(trim(coalesce(p_nome, '')), ''),
    v_token,
    v_uid,
    v_expires_at
  )
  returning id into v_convite_id;

  return query
  select
    v_convite_id,
    v_token,
    '/convite-profissional?token=' || v_token,
    v_expires_at;
end;
$$;

create or replace function public.list_current_empresa_profissional_invites()
returns table (
  id uuid,
  email text,
  nome text,
  token text,
  status text,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    c.id,
    c.email,
    c.nome,
    c.token,
    c.status,
    c.expires_at,
    c.accepted_at,
    c.created_at
  from public.empresa_profissional_convites c
  where c.empresa_id = public.current_empresa_id()
    and public.is_empresa_admin(c.empresa_id)
  order by c.created_at desc;
$$;

create or replace function public.get_profissional_invite_public(
  p_token text
)
returns table (
  convite_id uuid,
  empresa_id uuid,
  empresa_nome text,
  empresa_logo_url text,
  email text,
  nome text,
  status text,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    c.id as convite_id,
    c.empresa_id,
    coalesce(ec.nome_exibicao, t.name) as empresa_nome,
    t.logo_url as empresa_logo_url,
    c.email,
    c.nome,
    c.status,
    c.expires_at
  from public.empresa_profissional_convites c
  join public.tenants t on t.id = c.empresa_id
  left join public.empresa_configuracoes ec on ec.empresa_id = c.empresa_id
  where c.token = trim(p_token)
  limit 1;
$$;

create or replace function public.accept_profissional_invite(
  p_token text,
  p_nome text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_convite record;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário autenticado é obrigatório.';
  end if;

  select *
    into v_convite
  from public.empresa_profissional_convites
  where token = trim(p_token)
  limit 1;

  if v_convite is null then
    raise exception 'Convite não encontrado.';
  end if;

  if v_convite.status <> 'pendente' then
    raise exception 'Este convite não está mais disponível.';
  end if;

  if v_convite.expires_at < now() then
    update public.empresa_profissional_convites
    set status = 'expirado'
    where id = v_convite.id;
    raise exception 'Este convite expirou.';
  end if;
 
  if exists (
    select 1
    from public.get_empresa_saas_context(v_convite.empresa_id) ctx
    where ctx.limite_profissionais is not null
      and ctx.profissionais_usados >= ctx.limite_profissionais
  ) then
    raise exception 'A empresa atingiu o limite de profissionais do plano atual.';
  end if;

  insert into public.tenant_users (
    tenant_id,
    user_id,
    role,
    is_default
  )
  values (
    v_convite.empresa_id,
    v_uid,
    'profissional',
    true
  )
  on conflict (tenant_id, user_id) do update
  set
    role = 'profissional',
    is_default = true;

  update public.tenant_users
  set is_default = false
  where user_id = v_uid
    and tenant_id <> v_convite.empresa_id
    and is_default = true;

  insert into public.profiles (
    id,
    tenant_id,
    name,
    role
  )
  values (
    v_uid,
    v_convite.empresa_id,
    coalesce(nullif(trim(coalesce(p_nome, '')), ''), nullif(trim(coalesce(v_convite.nome, '')), ''), 'Profissional'),
    'profissional'
  )
  on conflict (id) do update
  set
    tenant_id = excluded.tenant_id,
    name = coalesce(public.profiles.name, excluded.name),
    role = 'profissional';

  insert into public.profissionais (
    user_id,
    tenant_id,
    ativo,
    disponivel
  )
  values (
    v_uid,
    v_convite.empresa_id,
    true,
    true
  )
  on conflict (user_id) do update
  set
    tenant_id = excluded.tenant_id,
    ativo = true;

  update public.empresa_profissional_convites
  set
    status = 'aceito',
    accepted_by = v_uid,
    accepted_at = now()
  where id = v_convite.id;

  return v_convite.empresa_id;
end;
$$;

revoke all on function public.get_public_planos_saas() from public;
revoke all on function public.get_my_empresa_dashboard_summary() from public;
revoke all on function public.create_profissional_invite(text, text) from public;
revoke all on function public.list_current_empresa_profissional_invites() from public;
revoke all on function public.get_profissional_invite_public(text) from public;
revoke all on function public.accept_profissional_invite(text, text) from public;

grant execute on function public.get_public_planos_saas() to anon, authenticated;
grant execute on function public.get_my_empresa_dashboard_summary() to authenticated;
grant execute on function public.create_profissional_invite(text, text) to authenticated;
grant execute on function public.list_current_empresa_profissional_invites() to authenticated;
grant execute on function public.get_profissional_invite_public(text) to anon, authenticated;
grant execute on function public.accept_profissional_invite(text, text) to authenticated;
