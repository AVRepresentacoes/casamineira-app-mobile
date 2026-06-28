-- Sprint Enterprise 017
-- Hardening RLS para public.caminho_hospedagem_reservas.
--
-- Corrige leitura horizontal entre clientes no mesmo tenant.
-- Escopo: apenas policies da tabela caminho_hospedagem_reservas.

alter table public.caminho_hospedagem_reservas enable row level security;

-- Policy antiga insegura:
-- permitia SELECT por public.user_belongs_to_tenant(tenant_id), o que incluia clientes.
drop policy if exists caminho_hospedagem_reservas_select_member
on public.caminho_hospedagem_reservas;

drop policy if exists caminho_hospedagem_reservas_select_cliente_own
on public.caminho_hospedagem_reservas;
create policy caminho_hospedagem_reservas_select_cliente_own
on public.caminho_hospedagem_reservas
for select
to authenticated
using (cliente_id = auth.uid());

drop policy if exists caminho_hospedagem_reservas_select_operador_tenant
on public.caminho_hospedagem_reservas;
create policy caminho_hospedagem_reservas_select_operador_tenant
on public.caminho_hospedagem_reservas
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_reservas.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'operador', 'atendente', 'gestor')
      and coalesce(tu.ativo, true) = true
  )
);

drop policy if exists caminho_hospedagem_reservas_insert_operador_tenant
on public.caminho_hospedagem_reservas;
create policy caminho_hospedagem_reservas_insert_operador_tenant
on public.caminho_hospedagem_reservas
for insert
to authenticated
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_reservas.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'operador', 'atendente', 'gestor')
      and coalesce(tu.ativo, true) = true
  )
);

drop policy if exists caminho_hospedagem_reservas_update_operador_tenant
on public.caminho_hospedagem_reservas;
create policy caminho_hospedagem_reservas_update_operador_tenant
on public.caminho_hospedagem_reservas
for update
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_reservas.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'operador', 'atendente', 'gestor')
      and coalesce(tu.ativo, true) = true
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_reservas.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'operador', 'atendente', 'gestor')
      and coalesce(tu.ativo, true) = true
  )
);
