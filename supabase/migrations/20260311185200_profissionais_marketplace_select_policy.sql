-- Permite leitura de vitrine de fornecedores ativos no marketplace para usuários autenticados.
-- Mantém isolamento por tenant via policy restritiva existente (tenant_guard_select).

drop policy if exists profissionais_select_marketplace_public on public.profissionais;
create policy profissionais_select_marketplace_public
on public.profissionais
for select
to authenticated
using (
  coalesce(fornecedor_ativo, false) = true
  and coalesce(ativo, true) = true
  and coalesce(disponivel, true) = true
);
