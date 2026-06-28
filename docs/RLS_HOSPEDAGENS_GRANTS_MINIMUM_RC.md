# Grants Minimos e Contrato Publico RC Hospedagens

Casa Mineira SaaS - Sprint Enterprise 022

## Ambiente

**Ambiente testado:** Supabase local.

- API local: `http://127.0.0.1:54321`
- Banco local: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Nenhum comando foi executado contra producao. Nenhuma UI foi alterada. Nenhum dado foi movido ou apagado.

## Objetivo

Reduzir a superficie de risco antes da Release Candidate de Hospedagens Caminhos da Fe, aplicando minimo privilegio nos grants `anon` e `authenticated` das tabelas `caminho_hospedagem_%`.

## Migration criada

Arquivo:

- `supabase/migrations/20260628013000_harden_caminho_hospedagem_minimum_grants_rc.sql`

Mudancas:

- Revogou grants amplos de `anon` e `authenticated` nas tabelas `caminho_hospedagem_%`.
- Reaplicou apenas permissoes necessarias por perfil.
- Nao alterou policies RLS.
- Nao alterou dados.
- Nao alterou UI ou logica de negocio.

## Grants antes

Antes da migration, todas as tabelas `caminho_hospedagem_%` auditadas tinham grants amplos para `anon` e `authenticated`:

- `SELECT`
- `INSERT`
- `UPDATE`
- `DELETE`
- `TRUNCATE`
- `REFERENCES`
- `TRIGGER`

Tabelas afetadas:

- `caminho_hospedagem_aceites`
- `caminho_hospedagem_avaliacoes`
- `caminho_hospedagem_chamados`
- `caminho_hospedagem_disponibilidade`
- `caminho_hospedagem_favoritos`
- `caminho_hospedagem_movimentos`
- `caminho_hospedagem_notificacoes`
- `caminho_hospedagem_pousada_saldos`
- `caminho_hospedagem_pousadas`
- `caminho_hospedagem_quartos`
- `caminho_hospedagem_reservas`
- `caminho_hospedagem_servicos`

Classificacao:

| Permissao | Classificacao | Decisao |
| --- | --- | --- |
| `TRUNCATE` | Perigoso | Revogado de `anon` e `authenticated`. |
| `TRIGGER` | Perigoso | Revogado de `anon` e `authenticated`. |
| `REFERENCES` | Excessivo | Revogado de `anon` e `authenticated`. |
| `DELETE` | Perigoso sem necessidade clara | Revogado, exceto favoritos autenticados. |
| `INSERT` para `anon` | Perigoso | Revogado. |
| `UPDATE` para `anon` | Perigoso | Revogado. |
| `SELECT` para `anon` em dados privados | Excessivo | Revogado. |
| `SELECT/INSERT/UPDATE` para `authenticated` | Necessario quando ha policy e fluxo do app | Mantido apenas por tabela/comando necessario. |

## Grants depois

### Anon

| Tabela | Grants mantidos | Motivo |
| --- | --- | --- |
| `caminho_hospedagem_pousadas` | `SELECT` | Catalogo publico filtrado por RLS. |
| `caminho_hospedagem_quartos` | `SELECT` | Catalogo publico filtrado por RLS. |
| `caminho_hospedagem_servicos` | `SELECT` | Catalogo publico filtrado por RLS. |
| `caminho_hospedagem_disponibilidade` | `SELECT` | Disponibilidade publica `livre`, filtrada por RLS. |
| `caminho_hospedagem_avaliacoes` | `SELECT` | Avaliacoes publicadas, filtradas por RLS. |

`anon` nao manteve `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES` ou `TRIGGER` em nenhuma tabela `caminho_hospedagem_%`.

### Authenticated

| Tabela | Grants mantidos | Motivo |
| --- | --- | --- |
| `caminho_hospedagem_aceites` | `SELECT`, `INSERT`, `UPDATE` | Aceites proprios e upsert autenticado. |
| `caminho_hospedagem_avaliacoes` | `SELECT`, `INSERT`, `UPDATE` | Avaliar, ler publicadas/proprias e moderacao operacional. |
| `caminho_hospedagem_chamados` | `SELECT`, `INSERT`, `UPDATE` | Abrir, consultar e responder chamados via RLS. |
| `caminho_hospedagem_disponibilidade` | `SELECT`, `INSERT`, `UPDATE` | Catalogo e painel operacional. |
| `caminho_hospedagem_favoritos` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Favoritar, planejar e desfavoritar. |
| `caminho_hospedagem_movimentos` | `SELECT` | Leitura operacional/admin. |
| `caminho_hospedagem_notificacoes` | `SELECT`, `INSERT`, `UPDATE` | Ler, criar no tenant correto e marcar como lida. |
| `caminho_hospedagem_pousada_saldos` | `SELECT` | Leitura operacional/admin. |
| `caminho_hospedagem_pousadas` | `SELECT`, `INSERT`, `UPDATE` | Catalogo e painel operacional. |
| `caminho_hospedagem_quartos` | `SELECT`, `INSERT`, `UPDATE` | Catalogo e painel operacional. |
| `caminho_hospedagem_reservas` | `SELECT`, `INSERT`, `UPDATE` | Reservas do cliente e operacao da pousada. |
| `caminho_hospedagem_servicos` | `SELECT`, `INSERT`, `UPDATE` | Catalogo e painel operacional. |

`authenticated` nao manteve `TRUNCATE`, `REFERENCES` nem `TRIGGER` em nenhuma tabela `caminho_hospedagem_%`.

## Permissoes revogadas

Revogado de `anon` e `authenticated` em todas as tabelas do escopo:

- `TRUNCATE`
- `REFERENCES`
- `TRIGGER`

Revogado tambem:

- `DELETE` de todas as tabelas, exceto `caminho_hospedagem_favoritos` para `authenticated`;
- `INSERT` e `UPDATE` de todas as tabelas para `anon`;
- `SELECT` de `anon` nas tabelas privadas: `aceites`, `chamados`, `favoritos`, `movimentos`, `notificacoes`, `pousada_saldos` e `reservas`.

## Contrato publico RC

Contrato adotado para Release Candidate:

**Catalogo publico via RLS filtrada**, mantendo acesso anonimo direto somente para:

- `caminho_hospedagem_pousadas`
- `caminho_hospedagem_quartos`
- `caminho_hospedagem_servicos`
- `caminho_hospedagem_disponibilidade`
- `caminho_hospedagem_avaliacoes`

Filtros de RLS esperados:

- pousadas: `status = 'aprovada'` e `visivel = true`;
- quartos: `ativo = true`, `disponivel = true` e pousada publica;
- servicos: `ativo = true` e pousada publica;
- disponibilidade: `status = 'livre'` e pousada publica;
- avaliacoes: `publicada = true`.

Recomendacao futura: migrar o catalogo publico para RPC/Edge Function com projecao segura de colunas se o contrato publico precisar esconder colunas mesmo em linhas publicas.

## Resultado dos testes locais

Comandos executados:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/seed/rls_personas_seed.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls/02_persona_access_matrix.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls/03_hospedagens_extended_access_matrix.sql
```

Resultados:

- Matriz `02`: **36 checks passaram, 0 falhas**.
- Matriz `03`: **52 checks passaram, 0 falhas P0/P1**.

Observacao: apos a reducao de grants, alguns checks privados de `anon` retornam `permission denied`, que e esperado e aceito pelas matrizes.

## Riscos remanescentes

- Catalogo publico via tabela ainda expoe todas as colunas das linhas liberadas por RLS.
- `authenticated DELETE` foi mantido em `caminho_hospedagem_favoritos` por necessidade clara do fluxo de desfavoritar.
- Usuarios multi-tenant continuam dependentes de `current_tenant_id()` e tenant default/ativo consistente.
- A reducao foi validada localmente; producao requer aprovacao explicita e janela controlada.

## Checklist para producao

Antes de aplicar em producao:

1. Confirmar que o app publico pode continuar usando catalogo via RLS filtrada nesta RC.
2. Validar se avaliacoes publicadas devem permanecer acessiveis por `anon`.
3. Executar backup/snapshot antes de aplicar migration.
4. Aplicar migration em staging ou ambiente equivalente.
5. Reexecutar matrizes `02` e `03`.
6. Validar fluxos manuais: catalogo publico, reserva, favoritos, chamados, notificacoes e painel da pousada.
7. Aplicar em producao somente com aprovacao explicita.

## Status de seguranca

**Seguro para Release Candidate local no recorte de grants:** grants perigosos foram removidos, e as matrizes RLS continuam passando.

## Proxima sprint recomendada

Sprint Enterprise 023 - Release Candidate RLS Hospedagens:

1. Validar staging/producao com janela controlada.
2. Criar checklist operacional RC completo.
3. Avaliar RPC/Edge Function para catalogo publico com projecao de colunas.
4. Preparar plano de rollback das migrations RLS.
