-- Painel operacional da pousada: cadastro, quartos, serviços, disponibilidade e gestão real.

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

create or replace function public.set_updated_at_caminho_hospedagem_panel()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_caminho_hospedagem_pousadas_updated_at on public.caminho_hospedagem_pousadas;
create trigger trg_caminho_hospedagem_pousadas_updated_at
before update on public.caminho_hospedagem_pousadas
for each row execute function public.set_updated_at_caminho_hospedagem_panel();

drop trigger if exists trg_caminho_hospedagem_quartos_updated_at on public.caminho_hospedagem_quartos;
create trigger trg_caminho_hospedagem_quartos_updated_at
before update on public.caminho_hospedagem_quartos
for each row execute function public.set_updated_at_caminho_hospedagem_panel();

drop trigger if exists trg_caminho_hospedagem_servicos_updated_at on public.caminho_hospedagem_servicos;
create trigger trg_caminho_hospedagem_servicos_updated_at
before update on public.caminho_hospedagem_servicos
for each row execute function public.set_updated_at_caminho_hospedagem_panel();

drop trigger if exists trg_caminho_hospedagem_disponibilidade_updated_at on public.caminho_hospedagem_disponibilidade;
create trigger trg_caminho_hospedagem_disponibilidade_updated_at
before update on public.caminho_hospedagem_disponibilidade
for each row execute function public.set_updated_at_caminho_hospedagem_panel();

alter table public.caminho_hospedagem_pousadas enable row level security;
alter table public.caminho_hospedagem_quartos enable row level security;
alter table public.caminho_hospedagem_servicos enable row level security;
alter table public.caminho_hospedagem_disponibilidade enable row level security;

drop policy if exists caminho_hospedagem_pousadas_member_select on public.caminho_hospedagem_pousadas;
create policy caminho_hospedagem_pousadas_member_select
on public.caminho_hospedagem_pousadas
for select to authenticated
using (owner_user_id = auth.uid() or public.user_belongs_to_tenant(tenant_id) or public.is_super_admin());

drop policy if exists caminho_hospedagem_pousadas_owner_insert on public.caminho_hospedagem_pousadas;
create policy caminho_hospedagem_pousadas_owner_insert
on public.caminho_hospedagem_pousadas
for insert to authenticated
with check (owner_user_id = auth.uid() and tenant_id = public.current_tenant_id());

drop policy if exists caminho_hospedagem_pousadas_owner_update on public.caminho_hospedagem_pousadas;
create policy caminho_hospedagem_pousadas_owner_update
on public.caminho_hospedagem_pousadas
for update to authenticated
using (owner_user_id = auth.uid() or public.is_empresa_admin(tenant_id) or public.is_super_admin())
with check (owner_user_id = auth.uid() or public.is_empresa_admin(tenant_id) or public.is_super_admin());

drop policy if exists caminho_hospedagem_quartos_member_all on public.caminho_hospedagem_quartos;
create policy caminho_hospedagem_quartos_member_all
on public.caminho_hospedagem_quartos
for all to authenticated
using (
  public.user_belongs_to_tenant(tenant_id)
  or public.is_super_admin()
  or exists (
    select 1 from public.caminho_hospedagem_pousadas p
    where p.id = pousada_id and p.owner_user_id = auth.uid()
  )
)
with check (
  public.user_belongs_to_tenant(tenant_id)
  or public.is_super_admin()
  or exists (
    select 1 from public.caminho_hospedagem_pousadas p
    where p.id = pousada_id and p.owner_user_id = auth.uid()
  )
);

drop policy if exists caminho_hospedagem_servicos_member_all on public.caminho_hospedagem_servicos;
create policy caminho_hospedagem_servicos_member_all
on public.caminho_hospedagem_servicos
for all to authenticated
using (
  public.user_belongs_to_tenant(tenant_id)
  or public.is_super_admin()
  or exists (
    select 1 from public.caminho_hospedagem_pousadas p
    where p.id = pousada_id and p.owner_user_id = auth.uid()
  )
)
with check (
  public.user_belongs_to_tenant(tenant_id)
  or public.is_super_admin()
  or exists (
    select 1 from public.caminho_hospedagem_pousadas p
    where p.id = pousada_id and p.owner_user_id = auth.uid()
  )
);

drop policy if exists caminho_hospedagem_disponibilidade_member_all on public.caminho_hospedagem_disponibilidade;
create policy caminho_hospedagem_disponibilidade_member_all
on public.caminho_hospedagem_disponibilidade
for all to authenticated
using (
  public.user_belongs_to_tenant(tenant_id)
  or public.is_super_admin()
  or exists (
    select 1 from public.caminho_hospedagem_pousadas p
    where p.id = pousada_id and p.owner_user_id = auth.uid()
  )
)
with check (
  public.user_belongs_to_tenant(tenant_id)
  or public.is_super_admin()
  or exists (
    select 1 from public.caminho_hospedagem_pousadas p
    where p.id = pousada_id and p.owner_user_id = auth.uid()
  )
);
