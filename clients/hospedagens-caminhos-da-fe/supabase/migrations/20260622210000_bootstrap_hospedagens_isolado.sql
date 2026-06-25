create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'active',
  plan_code text not null default 'marketplace',
  ativa boolean not null default true,
  public_signup_enabled boolean not null default true,
  dominio text,
  email text,
  telefone text,
  whatsapp text,
  cor_primaria text,
  cor_secundaria text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenants_status_check check (status in ('active', 'suspended', 'cancelled'))
);

create table if not exists public.tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'cliente',
  is_default boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id),
  constraint tenant_users_role_check check (role in ('owner', 'admin', 'admin_empresa', 'manager', 'staff', 'cliente', 'profissional', 'fornecedor', 'super_admin'))
);

create unique index if not exists tenant_users_user_default_uidx
  on public.tenant_users (user_id)
  where is_default = true;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  name text,
  role text not null default 'cliente',
  phone text,
  telefone text,
  whatsapp text,
  cidade text,
  estado text,
  verificado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_tenant_id_idx on public.profiles (tenant_id);

create table if not exists public.profissionais (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ativo boolean not null default true,
  disponivel boolean not null default true,
  fornecedor_ativo boolean not null default false,
  fornecedor_raio_km numeric(8,2) not null default 5,
  fornecedor_cnpj text,
  fornecedor_razao_social text,
  fornecedor_nome_fantasia text,
  fornecedor_categoria text,
  fornecedor_descricao text,
  raio_km numeric(8,2) not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists profissionais_tenant_user_idx on public.profissionais (tenant_id, user_id);

create table if not exists public.app_branding (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null unique,
  app_name text not null,
  slogan text,
  primary_color text,
  secondary_color text,
  accent_color text,
  logo_url text,
  support_whatsapp text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.caminho_hospedagem_reservas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  cliente_id uuid references auth.users(id) on delete set null,
  hospedagem_slug text not null,
  hospedagem_nome text not null,
  cidade text not null,
  quarto_slug text not null,
  quarto_nome text not null,
  checkin date not null,
  checkout date not null,
  hospedes integer not null default 1,
  nome_cliente text not null,
  telefone_cliente text not null,
  observacoes text,
  total numeric(12,2) not null,
  sinal numeric(12,2) not null,
  comissao numeric(12,2) not null,
  repasse_inicial numeric(12,2) not null,
  restante_na_pousada numeric(12,2) not null,
  status text not null default 'aguardando_pagamento',
  status_pagamento text not null default 'pendente',
  provider text,
  provider_payment_id text,
  split_status text not null default 'pendente',
  cancelado_por text,
  cancelamento_motivo text,
  reembolso_valor numeric(12,2),
  multa_pousada numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint caminho_hospedagem_reservas_status_check check (status in ('aguardando_pagamento', 'confirmada', 'cancelada_cliente', 'cancelada_pousada', 'concluida', 'no_show')),
  constraint caminho_hospedagem_reservas_pagamento_check check (status_pagamento in ('pendente', 'aprovada', 'recusada', 'estornada')),
  constraint caminho_hospedagem_reservas_cancelado_por_check check (cancelado_por is null or cancelado_por in ('cliente', 'pousada', 'admin', 'sistema'))
);

create table if not exists public.caminho_hospedagem_pousada_saldos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  hospedagem_slug text not null,
  saldo numeric(12,2) not null default 0,
  saldo_negativo numeric(12,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (tenant_id, hospedagem_slug)
);

create table if not exists public.caminho_hospedagem_movimentos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  reserva_id uuid references public.caminho_hospedagem_reservas(id) on delete cascade,
  hospedagem_slug text not null,
  tipo text not null,
  valor numeric(12,2) not null,
  descricao text,
  created_at timestamptz not null default now(),
  constraint caminho_hospedagem_movimentos_tipo_check check (tipo in ('repasse', 'comissao', 'multa', 'reembolso', 'ajuste'))
);

create table if not exists public.caminho_hospedagem_pousadas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  slug text not null,
  nome text not null,
  cidade text not null,
  uf text not null default 'MG',
  ramal text,
  endereco text,
  whatsapp text,
  descricao text,
  status text not null default 'pendente',
  visivel boolean not null default false,
  auto_confirmar boolean not null default false,
  resposta_rapida text,
  gateway_provider text,
  gateway_status text not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug),
  constraint caminho_hospedagem_pousadas_status_check check (status in ('pendente', 'aprovada', 'suspensa', 'recusada')),
  constraint caminho_hospedagem_pousadas_gateway_check check (gateway_status in ('pendente', 'validando', 'ativa', 'erro'))
);

create table if not exists public.caminho_hospedagem_quartos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  pousada_id uuid references public.caminho_hospedagem_pousadas(id) on delete cascade,
  slug text not null,
  nome text not null,
  tipo text not null default 'privativo',
  capacidade integer not null default 1,
  diaria numeric(12,2) not null default 0,
  disponivel boolean not null default true,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pousada_id, slug)
);

create table if not exists public.caminho_hospedagem_servicos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  pousada_id uuid references public.caminho_hospedagem_pousadas(id) on delete cascade,
  slug text not null,
  nome text not null,
  descricao text,
  preco numeric(12,2) not null default 0,
  unidade text not null default 'por unidade',
  categoria text not null default 'apoio',
  confirmacao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pousada_id, slug)
);

create table if not exists public.caminho_hospedagem_disponibilidade (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  pousada_id uuid references public.caminho_hospedagem_pousadas(id) on delete cascade,
  dia date not null,
  status text not null default 'livre',
  detalhe text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pousada_id, dia),
  constraint caminho_hospedagem_disponibilidade_status_check check (status in ('livre', 'ocupado', 'bloqueado', 'manutencao'))
);

create index if not exists caminho_hospedagem_reservas_tenant_created_idx on public.caminho_hospedagem_reservas (tenant_id, created_at desc);
create index if not exists caminho_hospedagem_reservas_cliente_idx on public.caminho_hospedagem_reservas (cliente_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tenants_updated_at on public.tenants;
create trigger trg_tenants_updated_at before update on public.tenants for each row execute function public.set_updated_at();
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists trg_profissionais_updated_at on public.profissionais;
create trigger trg_profissionais_updated_at before update on public.profissionais for each row execute function public.set_updated_at();
drop trigger if exists trg_caminho_hospedagem_reservas_updated_at on public.caminho_hospedagem_reservas;
create trigger trg_caminho_hospedagem_reservas_updated_at before update on public.caminho_hospedagem_reservas for each row execute function public.set_updated_at();
drop trigger if exists trg_caminho_hospedagem_pousadas_updated_at on public.caminho_hospedagem_pousadas;
create trigger trg_caminho_hospedagem_pousadas_updated_at before update on public.caminho_hospedagem_pousadas for each row execute function public.set_updated_at();
drop trigger if exists trg_caminho_hospedagem_quartos_updated_at on public.caminho_hospedagem_quartos;
create trigger trg_caminho_hospedagem_quartos_updated_at before update on public.caminho_hospedagem_quartos for each row execute function public.set_updated_at();
drop trigger if exists trg_caminho_hospedagem_servicos_updated_at on public.caminho_hospedagem_servicos;
create trigger trg_caminho_hospedagem_servicos_updated_at before update on public.caminho_hospedagem_servicos for each row execute function public.set_updated_at();
drop trigger if exists trg_caminho_hospedagem_disponibilidade_updated_at on public.caminho_hospedagem_disponibilidade;
create trigger trg_caminho_hospedagem_disponibilidade_updated_at before update on public.caminho_hospedagem_disponibilidade for each row execute function public.set_updated_at();

create or replace function public.current_tenant_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
begin
  if auth.uid() is null then
    return null;
  end if;

  select tenant_id into v_tenant
  from public.tenant_users
  where user_id = auth.uid()
    and is_default = true
    and ativo = true
  limit 1;

  if v_tenant is not null then
    return v_tenant;
  end if;

  select tenant_id into v_tenant
  from public.tenant_users
  where user_id = auth.uid()
    and ativo = true
  order by created_at asc
  limit 1;

  return v_tenant;
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
    where tu.tenant_id = p_tenant_id
      and tu.user_id = auth.uid()
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

create or replace function public.is_empresa_admin(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_users tu
    where tu.tenant_id = p_tenant_id
      and tu.user_id = auth.uid()
      and tu.role in ('owner', 'admin', 'admin_empresa', 'manager', 'super_admin')
      and coalesce(tu.ativo, true) = true
  );
$$;

create or replace function public.resolve_public_signup_tenant_id(p_tenant_slug text default 'hospedagens-caminhos-da-fe')
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.id
  from public.tenants t
  where lower(t.slug) = lower(coalesce(nullif(trim(p_tenant_slug), ''), 'hospedagens-caminhos-da-fe'))
    and t.status = 'active'
    and coalesce(t.ativa, true) = true
    and coalesce(t.public_signup_enabled, false) = true
  limit 1;
$$;

create or replace function public.ensure_app_tenant_context(
  p_tenant_slug text default 'hospedagens-caminhos-da-fe',
  p_lock_to_tenant boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant_id uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select id into v_tenant_id
  from public.tenants
  where lower(slug) = lower(coalesce(nullif(trim(p_tenant_slug), ''), 'hospedagens-caminhos-da-fe'))
    and status = 'active'
    and coalesce(ativa, true) = true
  limit 1;

  if v_tenant_id is null then
    raise exception 'Tenant do app nao encontrado ou inativo';
  end if;

  insert into public.tenant_users (tenant_id, user_id, role, is_default)
  values (v_tenant_id, v_uid, 'cliente', true)
  on conflict (tenant_id, user_id) do nothing;

  update public.tenant_users
  set is_default = false
  where user_id = v_uid
    and tenant_id <> v_tenant_id
    and is_default = true;

  update public.tenant_users
  set is_default = true
  where user_id = v_uid
    and tenant_id = v_tenant_id;

  return v_tenant_id;
end;
$$;

create or replace function public.ensure_current_user_tenant_context()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.ensure_app_tenant_context('hospedagens-caminhos-da-fe', true);
end;
$$;

create or replace function public.sync_profile_tenant_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tenant_id is not null and new.id is not null then
    insert into public.tenant_users (tenant_id, user_id, role, is_default)
    values (new.tenant_id, new.id, coalesce(new.role, 'cliente'), true)
    on conflict (tenant_id, user_id) do update
      set role = excluded.role,
          is_default = true;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_sync_tenant_membership on public.profiles;
create trigger trg_profiles_sync_tenant_membership
before insert or update of tenant_id, role on public.profiles
for each row execute function public.sync_profile_tenant_membership();

create or replace function public.caminho_hospedagem_cancelar_por_pousada(p_reserva_id uuid, p_motivo text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva public.caminho_hospedagem_reservas%rowtype;
  v_multa numeric(12,2);
begin
  select * into v_reserva
  from public.caminho_hospedagem_reservas
  where id = p_reserva_id
  for update;

  if v_reserva.id is null then
    raise exception 'Reserva nao encontrada';
  end if;

  if not (public.is_empresa_admin(v_reserva.tenant_id) or public.is_super_admin()) then
    raise exception 'Acesso restrito';
  end if;

  v_multa := round(v_reserva.total * 0.10, 2);

  update public.caminho_hospedagem_reservas
  set status = 'cancelada_pousada',
      status_pagamento = 'estornada',
      cancelado_por = 'pousada',
      cancelamento_motivo = nullif(trim(coalesce(p_motivo, '')), ''),
      reembolso_valor = sinal,
      multa_pousada = v_multa
  where id = p_reserva_id;

  insert into public.caminho_hospedagem_pousada_saldos (tenant_id, hospedagem_slug, saldo, saldo_negativo)
  values (v_reserva.tenant_id, v_reserva.hospedagem_slug, 0, v_multa)
  on conflict (tenant_id, hospedagem_slug) do update
  set saldo_negativo = public.caminho_hospedagem_pousada_saldos.saldo_negativo + excluded.saldo_negativo,
      updated_at = now();

  insert into public.caminho_hospedagem_movimentos (tenant_id, reserva_id, hospedagem_slug, tipo, valor, descricao)
  values (v_reserva.tenant_id, v_reserva.id, v_reserva.hospedagem_slug, 'multa', v_multa, 'Multa operacional por cancelamento/descumprimento da pousada');
end;
$$;

alter table public.tenants enable row level security;
alter table public.tenant_users enable row level security;
alter table public.profiles enable row level security;
alter table public.profissionais enable row level security;
alter table public.app_branding enable row level security;
alter table public.caminho_hospedagem_reservas enable row level security;
alter table public.caminho_hospedagem_pousada_saldos enable row level security;
alter table public.caminho_hospedagem_movimentos enable row level security;
alter table public.caminho_hospedagem_pousadas enable row level security;
alter table public.caminho_hospedagem_quartos enable row level security;
alter table public.caminho_hospedagem_servicos enable row level security;
alter table public.caminho_hospedagem_disponibilidade enable row level security;

create policy tenants_public_read on public.tenants for select to anon, authenticated using (status = 'active' and ativa = true);
create policy tenant_users_own_read on public.tenant_users for select to authenticated using (user_id = auth.uid() or public.is_super_admin());
create policy profiles_own_all on public.profiles for all to authenticated using (id = auth.uid() or public.is_empresa_admin(tenant_id) or public.is_super_admin()) with check (id = auth.uid() or public.is_empresa_admin(tenant_id) or public.is_super_admin());
create policy profissionais_own_all on public.profissionais for all to authenticated using (user_id = auth.uid() or public.is_empresa_admin(tenant_id) or public.is_super_admin()) with check (user_id = auth.uid() or public.is_empresa_admin(tenant_id) or public.is_super_admin());
create policy app_branding_read_active on public.app_branding for select to anon, authenticated using (active = true);

create policy caminho_hospedagem_reservas_select_member on public.caminho_hospedagem_reservas for select to authenticated using (cliente_id = auth.uid() or public.user_belongs_to_tenant(tenant_id) or public.is_super_admin());
create policy caminho_hospedagem_reservas_insert_cliente on public.caminho_hospedagem_reservas for insert to authenticated with check (cliente_id = auth.uid() and tenant_id = public.current_tenant_id());
create policy caminho_hospedagem_reservas_update_admin on public.caminho_hospedagem_reservas for update to authenticated using (public.is_empresa_admin(tenant_id) or public.is_super_admin()) with check (public.is_empresa_admin(tenant_id) or public.is_super_admin());
create policy caminho_hospedagem_saldos_select_admin on public.caminho_hospedagem_pousada_saldos for select to authenticated using (public.is_empresa_admin(tenant_id) or public.is_super_admin());
create policy caminho_hospedagem_movimentos_select_admin on public.caminho_hospedagem_movimentos for select to authenticated using (public.is_empresa_admin(tenant_id) or public.is_super_admin());

create policy caminho_hospedagem_pousadas_member_select on public.caminho_hospedagem_pousadas for select to authenticated using (owner_user_id = auth.uid() or public.user_belongs_to_tenant(tenant_id) or public.is_super_admin());
create policy caminho_hospedagem_pousadas_owner_insert on public.caminho_hospedagem_pousadas for insert to authenticated with check (owner_user_id = auth.uid() and tenant_id = public.current_tenant_id());
create policy caminho_hospedagem_pousadas_owner_update on public.caminho_hospedagem_pousadas for update to authenticated using (owner_user_id = auth.uid() or public.is_empresa_admin(tenant_id) or public.is_super_admin()) with check (owner_user_id = auth.uid() or public.is_empresa_admin(tenant_id) or public.is_super_admin());
create policy caminho_hospedagem_quartos_member_all on public.caminho_hospedagem_quartos for all to authenticated using (public.user_belongs_to_tenant(tenant_id) or public.is_super_admin() or exists (select 1 from public.caminho_hospedagem_pousadas p where p.id = pousada_id and p.owner_user_id = auth.uid())) with check (public.user_belongs_to_tenant(tenant_id) or public.is_super_admin() or exists (select 1 from public.caminho_hospedagem_pousadas p where p.id = pousada_id and p.owner_user_id = auth.uid()));
create policy caminho_hospedagem_servicos_member_all on public.caminho_hospedagem_servicos for all to authenticated using (public.user_belongs_to_tenant(tenant_id) or public.is_super_admin() or exists (select 1 from public.caminho_hospedagem_pousadas p where p.id = pousada_id and p.owner_user_id = auth.uid())) with check (public.user_belongs_to_tenant(tenant_id) or public.is_super_admin() or exists (select 1 from public.caminho_hospedagem_pousadas p where p.id = pousada_id and p.owner_user_id = auth.uid()));
create policy caminho_hospedagem_disponibilidade_member_all on public.caminho_hospedagem_disponibilidade for all to authenticated using (public.user_belongs_to_tenant(tenant_id) or public.is_super_admin() or exists (select 1 from public.caminho_hospedagem_pousadas p where p.id = pousada_id and p.owner_user_id = auth.uid())) with check (public.user_belongs_to_tenant(tenant_id) or public.is_super_admin() or exists (select 1 from public.caminho_hospedagem_pousadas p where p.id = pousada_id and p.owner_user_id = auth.uid()));

revoke all on function public.resolve_public_signup_tenant_id(text) from public;
revoke all on function public.ensure_app_tenant_context(text, boolean) from public;
revoke all on function public.ensure_current_user_tenant_context() from public;
revoke all on function public.caminho_hospedagem_cancelar_por_pousada(uuid, text) from public;

grant execute on function public.resolve_public_signup_tenant_id(text) to anon, authenticated;
grant execute on function public.ensure_app_tenant_context(text, boolean) to authenticated;
grant execute on function public.ensure_current_user_tenant_context() to authenticated;
grant execute on function public.caminho_hospedagem_cancelar_por_pousada(uuid, text) to authenticated;

insert into public.tenants (
  slug,
  name,
  status,
  plan_code,
  ativa,
  public_signup_enabled,
  dominio,
  whatsapp,
  cor_primaria,
  cor_secundaria
)
values (
  'hospedagens-caminhos-da-fe',
  'Hospedagens Caminhos da Fe',
  'active',
  'marketplace',
  true,
  true,
  'hospedagenscaminhosdafe.com.br',
  '+5535999990000',
  '#D8A84F',
  '#12372A'
)
on conflict (slug) do update
set name = excluded.name,
    status = excluded.status,
    ativa = excluded.ativa,
    public_signup_enabled = excluded.public_signup_enabled,
    dominio = excluded.dominio,
    whatsapp = excluded.whatsapp,
    cor_primaria = excluded.cor_primaria,
    cor_secundaria = excluded.cor_secundaria;

insert into public.app_branding (
  tenant_slug,
  app_name,
  slogan,
  primary_color,
  secondary_color,
  accent_color,
  support_whatsapp,
  active
)
values (
  'hospedagens-caminhos-da-fe',
  'Hospedagens Caminhos da Fe',
  'Reserve pousadas e quartos no Caminho da Fe.',
  '#D8A84F',
  '#12372A',
  '#4E7C59',
  '+5535999990000',
  true
)
on conflict (tenant_slug) do update
set app_name = excluded.app_name,
    slogan = excluded.slogan,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    accent_color = excluded.accent_color,
    support_whatsapp = excluded.support_whatsapp,
    active = excluded.active;
