-- Sprint Enterprise 019
-- Hardening P0 de dados privados de Hospedagens.
--
-- Escopo exato:
-- - public.caminho_hospedagem_avaliacoes
-- - public.caminho_hospedagem_chamados
-- - public.caminho_hospedagem_notificacoes
--
-- Nao corrige P1 nesta sprint e nao altera INSERT/UPDATE/DELETE.

alter table public.caminho_hospedagem_avaliacoes enable row level security;
alter table public.caminho_hospedagem_chamados enable row level security;
alter table public.caminho_hospedagem_notificacoes enable row level security;

-- Avaliacoes: remove SELECT amplo por tenant.
drop policy if exists caminho_hospedagem_avaliacoes_select_public
on public.caminho_hospedagem_avaliacoes;

drop policy if exists caminho_hospedagem_avaliacoes_select_publicadas
on public.caminho_hospedagem_avaliacoes;
create policy caminho_hospedagem_avaliacoes_select_publicadas
on public.caminho_hospedagem_avaliacoes
for select
to anon, authenticated
using (publicada = true);

drop policy if exists caminho_hospedagem_avaliacoes_select_cliente_own
on public.caminho_hospedagem_avaliacoes;
create policy caminho_hospedagem_avaliacoes_select_cliente_own
on public.caminho_hospedagem_avaliacoes
for select
to authenticated
using (cliente_id = auth.uid());

drop policy if exists caminho_hospedagem_avaliacoes_select_operador_tenant
on public.caminho_hospedagem_avaliacoes;
create policy caminho_hospedagem_avaliacoes_select_operador_tenant
on public.caminho_hospedagem_avaliacoes
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_avaliacoes.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'operador', 'atendente', 'gestor')
      and coalesce(tu.ativo, true) = true
  )
);

-- Chamados: remove SELECT amplo por tenant.
drop policy if exists caminho_hospedagem_chamados_select_member
on public.caminho_hospedagem_chamados;

drop policy if exists caminho_hospedagem_chamados_select_cliente_own
on public.caminho_hospedagem_chamados;
create policy caminho_hospedagem_chamados_select_cliente_own
on public.caminho_hospedagem_chamados
for select
to authenticated
using (
  cliente_id = auth.uid()
  or aberto_por = auth.uid()
);

drop policy if exists caminho_hospedagem_chamados_select_operador_tenant
on public.caminho_hospedagem_chamados;
create policy caminho_hospedagem_chamados_select_operador_tenant
on public.caminho_hospedagem_chamados
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_chamados.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'operador', 'atendente', 'gestor')
      and coalesce(tu.ativo, true) = true
  )
);

-- Notificacoes: remove SELECT amplo por tenant.
drop policy if exists caminho_hospedagem_notificacoes_own_select
on public.caminho_hospedagem_notificacoes;

drop policy if exists caminho_hospedagem_notificacoes_select_user_own
on public.caminho_hospedagem_notificacoes;
create policy caminho_hospedagem_notificacoes_select_user_own
on public.caminho_hospedagem_notificacoes
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists caminho_hospedagem_notificacoes_select_gestao_tenant
on public.caminho_hospedagem_notificacoes;
create policy caminho_hospedagem_notificacoes_select_gestao_tenant
on public.caminho_hospedagem_notificacoes
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_notificacoes.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor')
      and coalesce(tu.ativo, true) = true
  )
);
