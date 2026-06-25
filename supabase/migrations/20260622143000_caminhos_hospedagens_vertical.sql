-- Produto vertical: Hospedagens Caminhos da Fé.

create extension if not exists pgcrypto;

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
  constraint caminho_hospedagem_reservas_status_check check (
    status in (
      'aguardando_pagamento',
      'confirmada',
      'cancelada_cliente',
      'cancelada_pousada',
      'concluida',
      'no_show'
    )
  ),
  constraint caminho_hospedagem_reservas_pagamento_check check (
    status_pagamento in ('pendente', 'aprovada', 'recusada', 'estornada')
  ),
  constraint caminho_hospedagem_reservas_cancelado_por_check check (
    cancelado_por is null or cancelado_por in ('cliente', 'pousada', 'admin', 'sistema')
  )
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
  constraint caminho_hospedagem_movimentos_tipo_check check (
    tipo in ('repasse', 'comissao', 'multa', 'reembolso', 'ajuste')
  )
);

create index if not exists caminho_hospedagem_reservas_tenant_created_idx
  on public.caminho_hospedagem_reservas (tenant_id, created_at desc);

create index if not exists caminho_hospedagem_reservas_cliente_idx
  on public.caminho_hospedagem_reservas (cliente_id, created_at desc);

create or replace function public.set_updated_at_caminho_hospedagem_reservas()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_caminho_hospedagem_reservas_updated_at on public.caminho_hospedagem_reservas;
create trigger trg_caminho_hospedagem_reservas_updated_at
before update on public.caminho_hospedagem_reservas
for each row
execute function public.set_updated_at_caminho_hospedagem_reservas();

alter table public.caminho_hospedagem_reservas enable row level security;
alter table public.caminho_hospedagem_pousada_saldos enable row level security;
alter table public.caminho_hospedagem_movimentos enable row level security;

drop policy if exists caminho_hospedagem_reservas_select_member on public.caminho_hospedagem_reservas;
create policy caminho_hospedagem_reservas_select_member
on public.caminho_hospedagem_reservas
for select
to authenticated
using (
  cliente_id = auth.uid()
  or public.user_belongs_to_tenant(tenant_id)
  or public.is_super_admin()
);

drop policy if exists caminho_hospedagem_reservas_insert_cliente on public.caminho_hospedagem_reservas;
create policy caminho_hospedagem_reservas_insert_cliente
on public.caminho_hospedagem_reservas
for insert
to authenticated
with check (
  cliente_id = auth.uid()
  and tenant_id = public.current_tenant_id()
);

drop policy if exists caminho_hospedagem_reservas_update_admin on public.caminho_hospedagem_reservas;
create policy caminho_hospedagem_reservas_update_admin
on public.caminho_hospedagem_reservas
for update
to authenticated
using (public.is_empresa_admin(tenant_id) or public.is_super_admin())
with check (public.is_empresa_admin(tenant_id) or public.is_super_admin());

drop policy if exists caminho_hospedagem_saldos_select_admin on public.caminho_hospedagem_pousada_saldos;
create policy caminho_hospedagem_saldos_select_admin
on public.caminho_hospedagem_pousada_saldos
for select
to authenticated
using (public.is_empresa_admin(tenant_id) or public.is_super_admin());

drop policy if exists caminho_hospedagem_movimentos_select_admin on public.caminho_hospedagem_movimentos;
create policy caminho_hospedagem_movimentos_select_admin
on public.caminho_hospedagem_movimentos
for select
to authenticated
using (public.is_empresa_admin(tenant_id) or public.is_super_admin());

create or replace function public.caminho_hospedagem_cancelar_por_pousada(
  p_reserva_id uuid,
  p_motivo text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva public.caminho_hospedagem_reservas%rowtype;
  v_multa numeric(12,2);
begin
  select *
    into v_reserva
  from public.caminho_hospedagem_reservas
  where id = p_reserva_id
  for update;

  if v_reserva.id is null then
    raise exception 'Reserva não encontrada';
  end if;

  if not (public.is_empresa_admin(v_reserva.tenant_id) or public.is_super_admin()) then
    raise exception 'Acesso restrito';
  end if;

  v_multa := round(v_reserva.total * 0.10, 2);

  update public.caminho_hospedagem_reservas
  set
    status = 'cancelada_pousada',
    status_pagamento = 'estornada',
    cancelado_por = 'pousada',
    cancelamento_motivo = nullif(trim(coalesce(p_motivo, '')), ''),
    reembolso_valor = sinal,
    multa_pousada = v_multa
  where id = p_reserva_id;

  insert into public.caminho_hospedagem_pousada_saldos (
    tenant_id,
    hospedagem_slug,
    saldo,
    saldo_negativo
  )
  values (
    v_reserva.tenant_id,
    v_reserva.hospedagem_slug,
    0,
    v_multa
  )
  on conflict (tenant_id, hospedagem_slug) do update
  set
    saldo_negativo = public.caminho_hospedagem_pousada_saldos.saldo_negativo + excluded.saldo_negativo,
    updated_at = now();

  insert into public.caminho_hospedagem_movimentos (
    tenant_id,
    reserva_id,
    hospedagem_slug,
    tipo,
    valor,
    descricao
  )
  values (
    v_reserva.tenant_id,
    v_reserva.id,
    v_reserva.hospedagem_slug,
    'multa',
    v_multa,
    'Multa operacional por cancelamento/descumprimento da pousada'
  );
end;
$$;

revoke all on function public.caminho_hospedagem_cancelar_por_pousada(uuid, text) from public;
grant execute on function public.caminho_hospedagem_cancelar_por_pousada(uuid, text) to authenticated;
