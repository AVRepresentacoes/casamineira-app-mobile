create table if not exists public.caminho_hospedagem_chamados (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  reserva_id uuid references public.caminho_hospedagem_reservas(id) on delete set null,
  cliente_id uuid references auth.users(id) on delete set null,
  pousada_id uuid references public.caminho_hospedagem_pousadas(id) on delete set null,
  aberto_por uuid references auth.users(id) on delete set null,
  papel_abertura text not null default 'cliente',
  tipo text not null default 'duvida',
  prioridade text not null default 'normal',
  status text not null default 'aberto',
  titulo text not null,
  descricao text not null,
  resposta_admin text,
  decisao text,
  evidencias text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint caminho_hospedagem_chamados_papel_check check (papel_abertura in ('cliente', 'pousada', 'admin')),
  constraint caminho_hospedagem_chamados_tipo_check check (tipo in ('duvida', 'cancelamento', 'reembolso', 'no_show', 'problema_quarto', 'divergencia_preco', 'pousada_indisponivel', 'pagamento', 'outro')),
  constraint caminho_hospedagem_chamados_prioridade_check check (prioridade in ('baixa', 'normal', 'alta', 'critica')),
  constraint caminho_hospedagem_chamados_status_check check (status in ('aberto', 'em_analise', 'aguardando_resposta', 'resolvido', 'fechado'))
);

create index if not exists caminho_hospedagem_chamados_tenant_created_idx
  on public.caminho_hospedagem_chamados (tenant_id, created_at desc);

create index if not exists caminho_hospedagem_chamados_cliente_idx
  on public.caminho_hospedagem_chamados (cliente_id, created_at desc);

drop trigger if exists trg_caminho_hospedagem_chamados_updated_at on public.caminho_hospedagem_chamados;
create trigger trg_caminho_hospedagem_chamados_updated_at
before update on public.caminho_hospedagem_chamados
for each row execute function public.set_updated_at();

alter table public.caminho_hospedagem_chamados enable row level security;

drop policy if exists caminho_hospedagem_chamados_select_member on public.caminho_hospedagem_chamados;
create policy caminho_hospedagem_chamados_select_member
on public.caminho_hospedagem_chamados
for select
to authenticated
using (
  cliente_id = auth.uid()
  or aberto_por = auth.uid()
  or public.user_belongs_to_tenant(tenant_id)
  or public.is_super_admin()
  or exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.id = pousada_id
      and p.owner_user_id = auth.uid()
  )
);

drop policy if exists caminho_hospedagem_chamados_insert_member on public.caminho_hospedagem_chamados;
create policy caminho_hospedagem_chamados_insert_member
on public.caminho_hospedagem_chamados
for insert
to authenticated
with check (
  aberto_por = auth.uid()
  and tenant_id = public.current_tenant_id()
);

drop policy if exists caminho_hospedagem_chamados_update_admin on public.caminho_hospedagem_chamados;
create policy caminho_hospedagem_chamados_update_admin
on public.caminho_hospedagem_chamados
for update
to authenticated
using (
  public.is_empresa_admin(tenant_id)
  or public.is_super_admin()
)
with check (
  public.is_empresa_admin(tenant_id)
  or public.is_super_admin()
);
