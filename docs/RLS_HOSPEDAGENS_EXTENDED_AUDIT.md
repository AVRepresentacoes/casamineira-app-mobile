# Auditoria RLS Estendida Hospedagens Caminhos da Fe

Casa Mineira SaaS - Sprint Enterprise 018

## Ambiente

**Ambiente testado:** Supabase local.

- API local: `http://127.0.0.1:54321`
- Banco local: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Nenhum comando foi executado contra producao. Nenhuma policy foi alterada nesta sprint. Nenhum dado persistente foi movido ou apagado. As fixtures da matriz `03` rodam dentro de transacao e sao revertidas ao encerrar a sessao.

## Tabelas auditadas

- `caminho_hospedagem_avaliacoes`
- `caminho_hospedagem_favoritos`
- `caminho_hospedagem_notificacoes`
- `caminho_hospedagem_chamados`
- `caminho_hospedagem_aceites`
- `caminho_hospedagem_pousadas`
- `caminho_hospedagem_quartos`
- `caminho_hospedagem_servicos`
- `caminho_hospedagem_disponibilidade`
- `caminho_hospedagem_pousada_saldos`
- `caminho_hospedagem_movimentos`

## Colunas de dono e escopo

| Tabela | Colunas relevantes |
| --- | --- |
| `caminho_hospedagem_aceites` | `tenant_id`, `user_id` |
| `caminho_hospedagem_avaliacoes` | `tenant_id`, `reserva_id`, `cliente_id`, `hospedagem_slug`, `publicada` |
| `caminho_hospedagem_favoritos` | `tenant_id`, `user_id`, `hospedagem_slug` |
| `caminho_hospedagem_notificacoes` | `tenant_id`, `user_id` |
| `caminho_hospedagem_chamados` | `tenant_id`, `reserva_id`, `cliente_id`, `pousada_id`, `aberto_por`, `status` |
| `caminho_hospedagem_pousadas` | `tenant_id`, `owner_user_id`, `status`, `visivel` |
| `caminho_hospedagem_quartos` | `tenant_id`, `pousada_id`, `ativo` |
| `caminho_hospedagem_servicos` | `tenant_id`, `pousada_id`, `ativo` |
| `caminho_hospedagem_disponibilidade` | `tenant_id`, `pousada_id`, `status` |
| `caminho_hospedagem_pousada_saldos` | `tenant_id`, `hospedagem_slug` |
| `caminho_hospedagem_movimentos` | `tenant_id`, `reserva_id`, `hospedagem_slug` |

## Policies auditadas

| Tabela | Policy | Veredito |
| --- | --- | --- |
| `caminho_hospedagem_aceites` | `caminho_hospedagem_aceites_own_all` | Segura no teste: `user_id = auth.uid()` ou admin. |
| `caminho_hospedagem_avaliacoes` | `caminho_hospedagem_avaliacoes_select_public` | **P0:** `user_belongs_to_tenant(tenant_id)` expoe avaliacao privada de outro cliente. |
| `caminho_hospedagem_avaliacoes` | `caminho_hospedagem_avaliacoes_insert_cliente` | OK: insere apenas `cliente_id = auth.uid()`. |
| `caminho_hospedagem_avaliacoes` | `caminho_hospedagem_avaliacoes_update_admin` | OK: admin/super admin. |
| `caminho_hospedagem_favoritos` | `caminho_hospedagem_favoritos_own_all` | Segura no teste: `user_id = auth.uid()` ou admin. |
| `caminho_hospedagem_notificacoes` | `caminho_hospedagem_notificacoes_own_select` | **P0:** `user_belongs_to_tenant(tenant_id)` expoe notificacao de outro cliente. |
| `caminho_hospedagem_notificacoes` | `caminho_hospedagem_notificacoes_admin_insert` | P1 para revisar: permite insert se `user_id = auth.uid()` sem exigir `tenant_id = current_tenant_id()`. |
| `caminho_hospedagem_notificacoes` | `caminho_hospedagem_notificacoes_own_update` | OK para dono/admin, mas depende de revisar insert. |
| `caminho_hospedagem_chamados` | `caminho_hospedagem_chamados_select_member` | **P0:** `user_belongs_to_tenant(tenant_id)` expoe chamado de outro cliente. |
| `caminho_hospedagem_chamados` | `caminho_hospedagem_chamados_insert_member` | OK: `aberto_por = auth.uid()` e tenant atual. |
| `caminho_hospedagem_chamados` | `caminho_hospedagem_chamados_update_admin` | OK: admin/super admin. |
| `caminho_hospedagem_pousadas` | `caminho_hospedagem_pousadas_member_select` | **P1:** cliente do tenant ve pousada operacional privada `visivel = false`. |
| `caminho_hospedagem_pousadas` | `caminho_hospedagem_pousadas_owner_insert` | OK: owner cria propria pousada no tenant atual. |
| `caminho_hospedagem_pousadas` | `caminho_hospedagem_pousadas_owner_update` | OK: owner/admin/super admin. |
| `caminho_hospedagem_quartos` | `caminho_hospedagem_quartos_member_all` | **P1:** `for all` com `user_belongs_to_tenant` permite cliente ver dados privados e pode ampliar escrita operacional. |
| `caminho_hospedagem_servicos` | `caminho_hospedagem_servicos_member_all` | **P1:** mesmo padrao de quartos. |
| `caminho_hospedagem_disponibilidade` | `caminho_hospedagem_disponibilidade_member_all` | **P1:** mesmo padrao; cliente ve bloqueio/manutencao privada. |
| `caminho_hospedagem_pousada_saldos` | `caminho_hospedagem_saldos_select_admin` | Segura no teste: admin/super admin. |
| `caminho_hospedagem_movimentos` | `caminho_hospedagem_movimentos_select_admin` | Segura no teste: admin/super admin. |

## Matriz de testes

Script criado:

- `supabase/tests/rls/03_hospedagens_extended_access_matrix.sql`

Comando executado localmente:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls/03_hospedagens_extended_access_matrix.sql
```

Resultado: **falhou com 7 checks**, como esperado para auditoria.

Resumo:

| Severidade | Quantidade | Status |
| --- | ---: | --- |
| P0 | 3 | Falha confirmada |
| P1 | 4 | Falha confirmada |
| P2 | 0 | Observacao/documentacao |

## Falhas encontradas

### P0 - Avaliacoes privadas vazam entre clientes

- Persona: `cliente_hospedagens`
- Tabela: `caminho_hospedagem_avaliacoes`
- Esperado: `0` avaliacoes privadas de outro cliente
- Atual: `1`
- Causa: `public.user_belongs_to_tenant(tenant_id)` na policy de SELECT.

### P0 - Chamados vazam entre clientes

- Persona: `cliente_hospedagens`
- Tabela: `caminho_hospedagem_chamados`
- Esperado: `0` chamados de outro cliente
- Atual: `1`
- Causa: `public.user_belongs_to_tenant(tenant_id)` na policy de SELECT.

### P0 - Notificacoes vazam entre clientes

- Persona: `cliente_hospedagens`
- Tabela: `caminho_hospedagem_notificacoes`
- Esperado: `0` notificacoes de outro cliente
- Atual: `1`
- Causa: `public.user_belongs_to_tenant(tenant_id)` na policy de SELECT.

### P1 - Cliente ve dados operacionais privados de pousadas

- Persona: `cliente_hospedagens`
- Tabela: `caminho_hospedagem_pousadas`
- Esperado: `0` pousadas operacionais privadas
- Atual: `1`
- Causa: `public.user_belongs_to_tenant(tenant_id)` na policy de SELECT.

### P1 - Cliente ve quartos privados/inativos

- Persona: `cliente_hospedagens`
- Tabela: `caminho_hospedagem_quartos`
- Esperado: `0` quartos privados
- Atual: `1`
- Causa: policy `for all` com `public.user_belongs_to_tenant(tenant_id)`.

### P1 - Cliente ve servicos privados/inativos

- Persona: `cliente_hospedagens`
- Tabela: `caminho_hospedagem_servicos`
- Esperado: `0` servicos privados
- Atual: `1`
- Causa: policy `for all` com `public.user_belongs_to_tenant(tenant_id)`.

### P1 - Cliente ve disponibilidade operacional privada

- Persona: `cliente_hospedagens`
- Tabela: `caminho_hospedagem_disponibilidade`
- Esperado: `0` bloqueios/manutencoes privados
- Atual: `1`
- Causa: policy `for all` com `public.user_belongs_to_tenant(tenant_id)`.

## Tabelas seguras no teste

- `caminho_hospedagem_aceites`
- `caminho_hospedagem_favoritos`
- `caminho_hospedagem_pousada_saldos`
- `caminho_hospedagem_movimentos`

Tambem passou:

- `casa_mineira_servicos_owner` nao viu dados privados de Hospedagens nas tabelas testadas.
- `anon` nao viu saldos, movimentos, chamados nem notificacoes privadas.

## P2 - Catalogo publico

`anon` tambem nao viu `pousadas`, `quartos`, `servicos` ou `disponibilidade` publicos na matriz. Isso pode ser aceitavel se o catalogo for servido por RPC/Edge Function, mas precisa ser documentado como decisao de produto. Se o app publico deve consultar essas tabelas diretamente via anon, faltam grants/policies publicas filtradas por:

- `pousadas.status = 'aprovada'`
- `pousadas.visivel = true`
- `quartos.ativo = true`
- `quartos.disponivel = true`
- `servicos.ativo = true`
- `disponibilidade.status = 'livre'`

## Migration proposta

Nao foi criada nem aplicada migration nesta sprint.

Proposta para Sprint Enterprise 019:

1. Trocar SELECT de `avaliacoes` por:
   - anon/authenticated ve somente `publicada = true`;
   - cliente ve `cliente_id = auth.uid()`;
   - owner/admin/operador ve dados do tenant.
2. Trocar SELECT de `chamados` por:
   - cliente ve `cliente_id = auth.uid()` ou `aberto_por = auth.uid()`;
   - owner/admin/operador ve dados do tenant;
   - remover `user_belongs_to_tenant` amplo.
3. Trocar SELECT de `notificacoes` por:
   - cliente ve `user_id = auth.uid()`;
   - owner/admin/operador ve dados do tenant;
   - remover `user_belongs_to_tenant` amplo.
4. Separar catalogo publico de operacao privada em `pousadas`, `quartos`, `servicos` e `disponibilidade`.
5. Substituir policies `for all` de quartos/servicos/disponibilidade por policies separadas para SELECT publico filtrado e escrita restrita a owner/admin/operador.

## Status de seguranca

**Nao seguro para producao no recorte estendido de Hospedagens.**

A correcao de `caminho_hospedagem_reservas` da Sprint 017 permanece valida, mas a auditoria encontrou o mesmo padrao de risco em outras tabelas.

## Proxima sprint recomendada

Sprint Enterprise 019 - Hardening RLS Hospedagens Dados Privados:

1. Corrigir primeiro P0 em `avaliacoes`, `chamados` e `notificacoes`.
2. Reexecutar `03_hospedagens_extended_access_matrix.sql`.
3. Depois corrigir P1 em `pousadas`, `quartos`, `servicos` e `disponibilidade`.
4. Documentar a decisao de catalogo publico anon versus RPC controlada.
