-- Sprint Enterprise 020
-- Hardening RLS dos dados operacionais P1 de Hospedagens Caminhos da Fe.
--
-- Escopo:
-- - public.caminho_hospedagem_pousadas
-- - public.caminho_hospedagem_quartos
-- - public.caminho_hospedagem_servicos
-- - public.caminho_hospedagem_disponibilidade
--
-- Nao altera dados, nao altera tabelas fora do escopo e nao cria DELETE amplo.

alter table public.caminho_hospedagem_pousadas enable row level security;
alter table public.caminho_hospedagem_quartos enable row level security;
alter table public.caminho_hospedagem_servicos enable row level security;
alter table public.caminho_hospedagem_disponibilidade enable row level security;

-- Pousadas: remover SELECT amplo por membro do tenant.
drop policy if exists caminho_hospedagem_pousadas_member_select
on public.caminho_hospedagem_pousadas;

drop policy if exists caminho_hospedagem_pousadas_select_public
on public.caminho_hospedagem_pousadas;
create policy caminho_hospedagem_pousadas_select_public
on public.caminho_hospedagem_pousadas
for select
to anon, authenticated
using (
  status = 'aprovada'
  and visivel = true
);

drop policy if exists caminho_hospedagem_pousadas_select_operacional
on public.caminho_hospedagem_pousadas;
create policy caminho_hospedagem_pousadas_select_operacional
on public.caminho_hospedagem_pousadas
for select
to authenticated
using (
  owner_user_id = auth.uid()
  or public.is_super_admin()
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_pousadas.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor', 'operador', 'atendente', 'manager', 'staff')
      and coalesce(tu.ativo, true) = true
  )
);

drop policy if exists caminho_hospedagem_pousadas_owner_insert
on public.caminho_hospedagem_pousadas;
drop policy if exists caminho_hospedagem_pousadas_insert_operacional
on public.caminho_hospedagem_pousadas;
create policy caminho_hospedagem_pousadas_insert_operacional
on public.caminho_hospedagem_pousadas
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  or public.is_super_admin()
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_pousadas.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor', 'operador', 'atendente', 'manager', 'staff')
      and coalesce(tu.ativo, true) = true
  )
);

drop policy if exists caminho_hospedagem_pousadas_owner_update
on public.caminho_hospedagem_pousadas;
drop policy if exists caminho_hospedagem_pousadas_update_operacional
on public.caminho_hospedagem_pousadas;
create policy caminho_hospedagem_pousadas_update_operacional
on public.caminho_hospedagem_pousadas
for update
to authenticated
using (
  owner_user_id = auth.uid()
  or public.is_super_admin()
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_pousadas.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor', 'operador', 'atendente', 'manager', 'staff')
      and coalesce(tu.ativo, true) = true
  )
)
with check (
  owner_user_id = auth.uid()
  or public.is_super_admin()
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_pousadas.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor', 'operador', 'atendente', 'manager', 'staff')
      and coalesce(tu.ativo, true) = true
  )
);

-- Quartos: substituir FOR ALL amplo por SELECT publico e escrita operacional.
drop policy if exists caminho_hospedagem_quartos_member_all
on public.caminho_hospedagem_quartos;

drop policy if exists caminho_hospedagem_quartos_select_public
on public.caminho_hospedagem_quartos;
create policy caminho_hospedagem_quartos_select_public
on public.caminho_hospedagem_quartos
for select
to anon, authenticated
using (
  ativo = true
  and disponivel = true
  and exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.id = caminho_hospedagem_quartos.pousada_id
      and p.tenant_id = caminho_hospedagem_quartos.tenant_id
      and p.status = 'aprovada'
      and p.visivel = true
  )
);

drop policy if exists caminho_hospedagem_quartos_select_operacional
on public.caminho_hospedagem_quartos;
create policy caminho_hospedagem_quartos_select_operacional
on public.caminho_hospedagem_quartos
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.id = caminho_hospedagem_quartos.pousada_id
      and p.tenant_id = caminho_hospedagem_quartos.tenant_id
      and p.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_quartos.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor', 'operador', 'atendente', 'manager', 'staff')
      and coalesce(tu.ativo, true) = true
  )
);

drop policy if exists caminho_hospedagem_quartos_insert_operacional
on public.caminho_hospedagem_quartos;
create policy caminho_hospedagem_quartos_insert_operacional
on public.caminho_hospedagem_quartos
for insert
to authenticated
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.id = caminho_hospedagem_quartos.pousada_id
      and p.tenant_id = caminho_hospedagem_quartos.tenant_id
      and p.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_quartos.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor', 'operador', 'atendente', 'manager', 'staff')
      and coalesce(tu.ativo, true) = true
  )
);

drop policy if exists caminho_hospedagem_quartos_update_operacional
on public.caminho_hospedagem_quartos;
create policy caminho_hospedagem_quartos_update_operacional
on public.caminho_hospedagem_quartos
for update
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.id = caminho_hospedagem_quartos.pousada_id
      and p.tenant_id = caminho_hospedagem_quartos.tenant_id
      and p.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_quartos.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor', 'operador', 'atendente', 'manager', 'staff')
      and coalesce(tu.ativo, true) = true
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.id = caminho_hospedagem_quartos.pousada_id
      and p.tenant_id = caminho_hospedagem_quartos.tenant_id
      and p.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_quartos.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor', 'operador', 'atendente', 'manager', 'staff')
      and coalesce(tu.ativo, true) = true
  )
);

-- Servicos: substituir FOR ALL amplo por SELECT publico e escrita operacional.
drop policy if exists caminho_hospedagem_servicos_member_all
on public.caminho_hospedagem_servicos;

drop policy if exists caminho_hospedagem_servicos_select_public
on public.caminho_hospedagem_servicos;
create policy caminho_hospedagem_servicos_select_public
on public.caminho_hospedagem_servicos
for select
to anon, authenticated
using (
  ativo = true
  and exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.id = caminho_hospedagem_servicos.pousada_id
      and p.tenant_id = caminho_hospedagem_servicos.tenant_id
      and p.status = 'aprovada'
      and p.visivel = true
  )
);

drop policy if exists caminho_hospedagem_servicos_select_operacional
on public.caminho_hospedagem_servicos;
create policy caminho_hospedagem_servicos_select_operacional
on public.caminho_hospedagem_servicos
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.id = caminho_hospedagem_servicos.pousada_id
      and p.tenant_id = caminho_hospedagem_servicos.tenant_id
      and p.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_servicos.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor', 'operador', 'atendente', 'manager', 'staff')
      and coalesce(tu.ativo, true) = true
  )
);

drop policy if exists caminho_hospedagem_servicos_insert_operacional
on public.caminho_hospedagem_servicos;
create policy caminho_hospedagem_servicos_insert_operacional
on public.caminho_hospedagem_servicos
for insert
to authenticated
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.id = caminho_hospedagem_servicos.pousada_id
      and p.tenant_id = caminho_hospedagem_servicos.tenant_id
      and p.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_servicos.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor', 'operador', 'atendente', 'manager', 'staff')
      and coalesce(tu.ativo, true) = true
  )
);

drop policy if exists caminho_hospedagem_servicos_update_operacional
on public.caminho_hospedagem_servicos;
create policy caminho_hospedagem_servicos_update_operacional
on public.caminho_hospedagem_servicos
for update
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.id = caminho_hospedagem_servicos.pousada_id
      and p.tenant_id = caminho_hospedagem_servicos.tenant_id
      and p.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_servicos.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor', 'operador', 'atendente', 'manager', 'staff')
      and coalesce(tu.ativo, true) = true
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.id = caminho_hospedagem_servicos.pousada_id
      and p.tenant_id = caminho_hospedagem_servicos.tenant_id
      and p.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_servicos.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor', 'operador', 'atendente', 'manager', 'staff')
      and coalesce(tu.ativo, true) = true
  )
);

-- Disponibilidade: expor ao catalogo somente status livre.
drop policy if exists caminho_hospedagem_disponibilidade_member_all
on public.caminho_hospedagem_disponibilidade;

drop policy if exists caminho_hospedagem_disponibilidade_select_public
on public.caminho_hospedagem_disponibilidade;
create policy caminho_hospedagem_disponibilidade_select_public
on public.caminho_hospedagem_disponibilidade
for select
to anon, authenticated
using (
  status = 'livre'
  and exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.id = caminho_hospedagem_disponibilidade.pousada_id
      and p.tenant_id = caminho_hospedagem_disponibilidade.tenant_id
      and p.status = 'aprovada'
      and p.visivel = true
  )
);

drop policy if exists caminho_hospedagem_disponibilidade_select_operacional
on public.caminho_hospedagem_disponibilidade;
create policy caminho_hospedagem_disponibilidade_select_operacional
on public.caminho_hospedagem_disponibilidade
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.id = caminho_hospedagem_disponibilidade.pousada_id
      and p.tenant_id = caminho_hospedagem_disponibilidade.tenant_id
      and p.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_disponibilidade.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor', 'operador', 'atendente', 'manager', 'staff')
      and coalesce(tu.ativo, true) = true
  )
);

drop policy if exists caminho_hospedagem_disponibilidade_insert_operacional
on public.caminho_hospedagem_disponibilidade;
create policy caminho_hospedagem_disponibilidade_insert_operacional
on public.caminho_hospedagem_disponibilidade
for insert
to authenticated
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.id = caminho_hospedagem_disponibilidade.pousada_id
      and p.tenant_id = caminho_hospedagem_disponibilidade.tenant_id
      and p.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_disponibilidade.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor', 'operador', 'atendente', 'manager', 'staff')
      and coalesce(tu.ativo, true) = true
  )
);

drop policy if exists caminho_hospedagem_disponibilidade_update_operacional
on public.caminho_hospedagem_disponibilidade;
create policy caminho_hospedagem_disponibilidade_update_operacional
on public.caminho_hospedagem_disponibilidade
for update
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.id = caminho_hospedagem_disponibilidade.pousada_id
      and p.tenant_id = caminho_hospedagem_disponibilidade.tenant_id
      and p.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_disponibilidade.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor', 'operador', 'atendente', 'manager', 'staff')
      and coalesce(tu.ativo, true) = true
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.caminho_hospedagem_pousadas p
    where p.id = caminho_hospedagem_disponibilidade.pousada_id
      and p.tenant_id = caminho_hospedagem_disponibilidade.tenant_id
      and p.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_disponibilidade.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor', 'operador', 'atendente', 'manager', 'staff')
      and coalesce(tu.ativo, true) = true
  )
);
