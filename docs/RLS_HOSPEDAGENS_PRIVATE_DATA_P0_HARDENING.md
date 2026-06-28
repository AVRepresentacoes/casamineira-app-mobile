# Hardening RLS Hospedagens Dados Privados P0

Casa Mineira SaaS - Sprint Enterprise 019

## Ambiente

**Ambiente testado:** Supabase local.

- API local: `http://127.0.0.1:54321`
- Banco local: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Nenhum comando foi executado contra producao. Nenhuma UI foi alterada. Nenhum dado foi movido ou apagado.

## Escopo corrigido

Somente as falhas P0 confirmadas na Sprint 018:

- `public.caminho_hospedagem_avaliacoes`
- `public.caminho_hospedagem_chamados`
- `public.caminho_hospedagem_notificacoes`

Nao foram corrigidos nesta sprint:

- `caminho_hospedagem_pousadas`
- `caminho_hospedagem_quartos`
- `caminho_hospedagem_servicos`
- `caminho_hospedagem_disponibilidade`
- `caminho_hospedagem_pousada_saldos`
- `caminho_hospedagem_movimentos`
- `caminho_hospedagem_reservas`

## Policies antigas inseguras

| Tabela | Policy antiga | Problema |
| --- | --- | --- |
| `caminho_hospedagem_avaliacoes` | `caminho_hospedagem_avaliacoes_select_public` | `user_belongs_to_tenant(tenant_id)` permitia cliente ver avaliacao privada de outro cliente. |
| `caminho_hospedagem_chamados` | `caminho_hospedagem_chamados_select_member` | `user_belongs_to_tenant(tenant_id)` permitia cliente ver chamado de outro cliente. |
| `caminho_hospedagem_notificacoes` | `caminho_hospedagem_notificacoes_own_select` | `user_belongs_to_tenant(tenant_id)` permitia cliente ver notificacao de outro cliente. |

## Colunas de dono usadas

| Tabela | Coluna de dono |
| --- | --- |
| `caminho_hospedagem_avaliacoes` | `cliente_id` |
| `caminho_hospedagem_chamados` | `cliente_id`, `aberto_por` |
| `caminho_hospedagem_notificacoes` | `user_id` |

## Migration criada

Arquivo:

- `supabase/migrations/20260627213000_harden_caminho_hospedagem_private_data_p0.sql`

Mudancas:

- Removeu somente as policies inseguras de SELECT das 3 tabelas.
- Recriou SELECT de cliente final por dono do registro.
- Recriou SELECT operacional por roles de equipe.
- Manteve INSERT/UPDATE/DELETE existentes.
- Nao alterou tabelas P1.

## Policies novas

### Avaliacoes

- `caminho_hospedagem_avaliacoes_select_publicadas`: `anon` e `authenticated` veem apenas `publicada = true`.
- `caminho_hospedagem_avaliacoes_select_cliente_own`: cliente autenticado ve `cliente_id = auth.uid()`.
- `caminho_hospedagem_avaliacoes_select_operador_tenant`: equipe ve dados do tenant por role `owner`, `admin`, `admin_empresa`, `operador`, `atendente`, `gestor`, ou `super_admin`.

### Chamados

- `caminho_hospedagem_chamados_select_cliente_own`: cliente ve `cliente_id = auth.uid()` ou `aberto_por = auth.uid()`.
- `caminho_hospedagem_chamados_select_operador_tenant`: equipe ve dados do tenant por role `owner`, `admin`, `admin_empresa`, `operador`, `atendente`, `gestor`, ou `super_admin`.

### Notificacoes

- `caminho_hospedagem_notificacoes_select_user_own`: usuario ve `user_id = auth.uid()`.
- `caminho_hospedagem_notificacoes_select_gestao_tenant`: por cautela operacional, leitura de tenant ficou restrita a `owner`, `admin`, `admin_empresa`, `gestor`, ou `super_admin`.

## Resultado antes

Sprint Enterprise 018:

| Check | Esperado | Atual |
| --- | --- | --- |
| `cliente_hospedagens` ve avaliacao privada de outro cliente | `0` | `1` |
| `cliente_hospedagens` ve chamado de outro cliente | `0` | `1` |
| `cliente_hospedagens` ve notificacao de outro cliente | `0` | `1` |

## Resultado depois

Com a migration aplicada localmente, o seed foi reexecutado e a matriz `03` passou em todos os checks P0.

Comando:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls/03_hospedagens_extended_access_matrix.sql
```

Resumo P0:

| Check | Esperado | Atual | Resultado |
| --- | --- | --- | --- |
| `cliente_hospedagens` avaliacoes privadas de outro cliente | `0` | `0` | Passou |
| `cliente_hospedagens` chamados de outro cliente | `0` | `0` | Passou |
| `cliente_hospedagens` notificacoes de outro cliente | `0` | `0` | Passou |
| `cliente_hospedagens` avaliacoes privadas proprias | `1` | `1` | Passou |
| `cliente_hospedagens` chamados proprios | `1` | `1` | Passou |
| `cliente_hospedagens` notificacoes proprias | `1` | `1` | Passou |
| `hospedagens_owner` chamados do tenant | `2` | `2` | Passou |
| `hospedagens_owner` notificacoes do tenant | `2` | `2` | Passou |
| `casa_mineira_servicos_owner` chamados/notificacoes de Hospedagens | `0` | `0` | Passou |
| `anon` chamados/notificacoes privados | `0` ou permission denied | `0` | Passou |

Resultado da matriz: **0 falhas P0**. A matriz ainda reporta P1 conhecidos, mas nao quebra a execucao por eles nesta sprint.

## P0 corrigidos

- Vazamento horizontal de avaliacoes privadas entre clientes.
- Vazamento horizontal de chamados entre clientes.
- Vazamento horizontal de notificacoes entre clientes.

## Riscos remanescentes

### P1 deixados para proxima sprint

- `caminho_hospedagem_pousadas`: cliente ainda ve pousada operacional privada.
- `caminho_hospedagem_quartos`: cliente ainda ve quarto privado/inativo.
- `caminho_hospedagem_servicos`: cliente ainda ve servico privado/inativo.
- `caminho_hospedagem_disponibilidade`: cliente ainda ve bloqueio/manutencao operacional.

### INSERT/UPDATE fora do escopo

- `caminho_hospedagem_notificacoes_admin_insert` segue com risco P1 de revisao futura: permite insert quando `user_id = auth.uid()` sem exigir explicitamente `tenant_id = current_tenant_id()`.
- Nenhuma policy de INSERT/UPDATE/DELETE foi alterada nesta sprint.

### Roles operacionais

- A migration referencia `operador`, `atendente` e `gestor` em avaliacoes/chamados, mas a constraint atual de `tenant_users.role` pode exigir sprint propria se esses roles forem oficializados.
- Para notificacoes, a leitura operacional foi propositalmente mais restrita: `owner`, `admin`, `admin_empresa`, `gestor` e `super_admin`.

## Status de seguranca

**Seguro no recorte P0 corrigido:** as 3 tabelas privadas auditadas nao permitem mais vazamento horizontal entre clientes nos testes locais da Sprint 019.

**Ainda nao seguro no recorte P1 operacional:** catalogo/operacao de pousadas, quartos, servicos e disponibilidade permanece para hardening separado.

## Proxima sprint recomendada

Sprint Enterprise 020 - Hardening RLS Hospedagens P1 Operacional:

1. Corrigir `pousadas`, `quartos`, `servicos` e `disponibilidade`.
2. Separar SELECT publico filtrado de escrita operacional.
3. Revisar `notificacoes_admin_insert`.
4. Decidir oficialmente se catalogo publico anon sera via tabela, RPC ou Edge Function.
