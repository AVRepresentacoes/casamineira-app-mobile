-- Sprint Enterprise 021
-- Hardening da policy INSERT de notificacoes de Hospedagens.
--
-- Escopo:
-- - public.caminho_hospedagem_notificacoes INSERT
--
-- Nao altera SELECT/UPDATE/DELETE e nao toca em outras tabelas.

alter table public.caminho_hospedagem_notificacoes enable row level security;

drop policy if exists caminho_hospedagem_notificacoes_admin_insert
on public.caminho_hospedagem_notificacoes;

create policy caminho_hospedagem_notificacoes_admin_insert
on public.caminho_hospedagem_notificacoes
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    tenant_id = public.current_tenant_id()
    and exists (
      select 1
      from public.tenant_users tu
      where tu.user_id = auth.uid()
        and tu.tenant_id = caminho_hospedagem_notificacoes.tenant_id
        and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor')
        and coalesce(tu.ativo, true) = true
    )
  )
  or (
    user_id = auth.uid()
    and tenant_id = public.current_tenant_id()
  )
);
