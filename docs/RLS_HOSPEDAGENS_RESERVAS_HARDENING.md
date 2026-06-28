# Hardening RLS Hospedagens Reservas

Casa Mineira SaaS - Sprint Enterprise 017

## Ambiente

**Ambiente testado:** Supabase local.

- API local: `http://127.0.0.1:54321`
- Banco local: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Nenhum comando foi executado contra producao. Nenhum dado foi apagado, movido ou alterado fora do seed local de teste. Nenhuma UI foi alterada.

## Policy antiga insegura

Tabela afetada:

- `public.caminho_hospedagem_reservas`

Policy insegura identificada:

- `caminho_hospedagem_reservas_select_member`

Regra antiga:

```sql
cliente_id = auth.uid()
or public.user_belongs_to_tenant(tenant_id)
or public.is_super_admin()
```

Problema: clientes finais tambem existem em `tenant_users`. Portanto, `public.user_belongs_to_tenant(tenant_id)` permitia que `cliente_hospedagens` visse reserva de outro cliente no mesmo tenant.

## Coluna de dono da reserva

Coluna confirmada no schema:

- `cliente_id uuid references auth.users(id) on delete set null`

Essa coluna e usada para identificar o cliente final dono da reserva.

## Migration criada

Arquivo:

- `supabase/migrations/20260627210000_harden_caminho_hospedagem_reservas_rls.sql`

Mudancas:

- Remove apenas a policy SELECT insegura `caminho_hospedagem_reservas_select_member`.
- Cria `caminho_hospedagem_reservas_select_cliente_own`.
- Cria `caminho_hospedagem_reservas_select_operador_tenant`.
- Mantem a policy existente de INSERT do cliente proprio.
- Mantem a policy existente de UPDATE admin.
- Adiciona INSERT/UPDATE para equipe operacional do tenant.
- Nao cria DELETE.

## Policy nova

Cliente final:

```sql
cliente_id = auth.uid()
```

Equipe operacional do tenant:

```sql
public.is_super_admin()
or exists (
  select 1
  from public.tenant_users tu
  where tu.user_id = auth.uid()
    and tu.tenant_id = caminho_hospedagem_reservas.tenant_id
    and tu.role in ('owner', 'admin', 'admin_empresa', 'operador', 'atendente', 'gestor')
    and coalesce(tu.ativo, true) = true
)
```

## Resultado antes

Sprint Enterprise 016:

| Check | Esperado | Atual |
| --- | --- | --- |
| `cliente_hospedagens` ve reservas de outros clientes | `0` | `1` |

Classificacao anterior: **P0**.

## Resultado depois

Com a migration aplicada localmente, o seed foi reexecutado e a matriz atualizada passou.

Comando:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls/02_persona_access_matrix.sql
```

Resumo:

| Check | Esperado | Atual | Resultado |
| --- | --- | --- | --- |
| `cliente_hospedagens` total de reservas visiveis | `1` | `1` | Passou |
| `cliente_hospedagens` reservas proprias visiveis | `1` | `1` | Passou |
| `cliente_hospedagens` reservas de outros clientes visiveis | `0` | `0` | Passou |
| `hospedagens_owner` reservas de hospedagens visiveis | `2` | `2` | Passou |
| `casa_mineira_servicos_owner` reservas de hospedagens visiveis | `0` | `0` | Passou |
| `anon` reservas privadas | `0` ou permission denied | `0` | Passou |

Resultado completo: **36 checks passaram, 0 falhas**.

## Riscos remanescentes

- `tenant_users_role_check` atualmente lista `owner`, `admin`, `manager`, `staff`, `super_admin`, `admin_empresa`, `profissional` e `cliente`. A policy ja contempla `operador`, `atendente` e `gestor`, mas esses roles podem exigir ajuste de constraint em sprint propria se forem usados oficialmente.
- Outras tabelas de Hospedagens ainda podem ter policies amplas com `public.user_belongs_to_tenant(tenant_id)` e precisam de auditoria dedicada.
- `caminho_hospedagem_movimentos` permanece visivel para admin/owner, e clientes seguem sem acesso direto na matriz atual.

## Status de seguranca

**Seguro no recorte corrigido:** `public.caminho_hospedagem_reservas` nao permite mais leitura horizontal entre clientes no teste local da Sprint 017.

## Proxima sprint recomendada

Sprint Enterprise 018 - Auditoria RLS restante de Hospedagens:

1. Auditar `caminho_hospedagem_avaliacoes`, `favoritos`, `notificacoes`, `chamados`, `aceites`, `pousadas`, `quartos` e `servicos`.
2. Separar cliente final de equipe operacional em todas as policies com `user_belongs_to_tenant`.
3. Adicionar personas de operador/atendente/gestor se esses papeis forem oficializados.
