# Resultado dos Testes RLS com Personas Reais Locais

Casa Mineira SaaS - Sprint Enterprise 016

## Ambiente

**Ambiente testado:** Supabase local.

Conexao confirmada pelo `supabase status` local:

- API local: `http://127.0.0.1:54321`
- Banco local: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

**Garantia de seguranca:** nenhum comando foi executado contra producao. Nenhuma policy foi alterada. Nenhum dado foi apagado ou movido.

## Scripts criados

- `supabase/seed/rls_personas_seed.sql`
- `supabase/tests/rls/02_persona_access_matrix.sql`

## Personas criadas

| Persona | Usuario local | Tenant | Papel |
| --- | --- | --- | --- |
| `saas_owner` | `saas_owner+rls016@local.test` | `casa-mineira-saas` | `owner` |
| `casa_mineira_servicos_owner` | `casa_mineira_servicos_owner+rls016@local.test` | `casa-mineira-servicos` | `owner` |
| `hospedagens_owner` | `hospedagens_owner+rls016@local.test` | `hospedagens-caminhos-da-fe` | `owner` |
| `cliente_servicos` | `cliente_servicos+rls016@local.test` | `casa-mineira-servicos` | `cliente` |
| `cliente_hospedagens` | `cliente_hospedagens+rls016@local.test` | `hospedagens-caminhos-da-fe` | `cliente` |

Fixture auxiliar de controle:

- `controle_cliente+rls016@local.test`, usado apenas para criar registros de outro cliente e validar isolamento.

## Dados criados

- 3 tenants locais: SaaS, Casa Mineira Servicos e Hospedagens Caminhos da Fe.
- 6 usuarios locais em `auth.users`.
- 7 vinculos em `tenant_users`.
- 2 pedidos de Casa Mineira Servicos.
- 2 pagamentos de Casa Mineira Servicos.
- 2 reservas de Hospedagens.
- 1 movimento financeiro de Hospedagens.
- 1 `business_dna` publico ativo e 1 inativo.
- 1 `premium_template` publico ativo e 1 inativo.

## Execucao

Seed:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/seed/rls_personas_seed.sql
```

Resultado: sucesso.

Matriz:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls/02_persona_access_matrix.sql
```

Resultado: falhou com 1 check P0.

Validacoes de app:

```bash
npm run lint
npm run build
```

Resultado:

- `npm run lint`: passou com 7 warnings preexistentes.
- `npm run build`: passou e exportou `dist`.

## Cenarios testados

| Cenario | Resultado |
| --- | --- |
| `saas_owner` nao acessa dados operacionais indevidos | Passou |
| `casa_mineira_servicos_owner` acessa dados do tenant/produto Servicos | Passou |
| `casa_mineira_servicos_owner` nao acessa Hospedagens | Passou |
| `hospedagens_owner` acessa dados do tenant/produto Hospedagens | Passou |
| `hospedagens_owner` nao acessa Servicos | Passou |
| `cliente_servicos` acessa apenas seus pedidos/pagamentos | Passou |
| `cliente_hospedagens` acessa apenas suas reservas | **Falhou P0** |
| `anon` acessa apenas catalogos publicos ativos | Passou |
| `anon` nao acessa dados privados operacionais | Passou |
| `anon` nao acessa Control Plane SaaS | Passou |

## Falhas encontradas

### P0 - Cliente de Hospedagens ve reserva de outro cliente

Check:

- Persona: `cliente_hospedagens`
- Tabela: `public.caminho_hospedagem_reservas`
- Esperado: `0` reservas de outros clientes visiveis
- Atual: `1` reserva de outro cliente visivel

Evidencia da matriz:

```text
cliente_hospedagens dados proprios | reservas de outros clientes visiveis | expected 0 | actual 1 | passed false
```

Inferencia tecnica: a policy atual de `caminho_hospedagem_reservas` permite leitura quando `public.user_belongs_to_tenant(tenant_id)` e clientes tambem sao membros do tenant. Isso faz um cliente autenticado de Hospedagens enxergar reservas de outro cliente no mesmo tenant.

## Tabelas criticas

### P0

- `caminho_hospedagem_reservas`

### P1

- `caminho_hospedagem_movimentos`
- `caminho_hospedagem_pousada_saldos`
- `pedidos`
- `pagamentos`
- `tenant_users`

### P2

- `business_dna`
- `premium_templates`
- `saas_products`

## Classificacao de seguranca

**Nao seguro para producao no recorte de reservas de Hospedagens.**

O isolamento geral por produto/tenant passou para SaaS, Servicos, owners, anon e catalogos publicos. Porem, a falha P0 permite exposicao horizontal entre clientes de Hospedagens dentro do mesmo tenant.

## Proxima sprint recomendada

Sprint Enterprise 017 - Hardening RLS Hospedagens:

1. Ajustar policy de `caminho_hospedagem_reservas` para separar cliente final de owner/admin de tenant.
2. Validar se `tenant_users.role = 'cliente'` deve contar como membro operacional para `user_belongs_to_tenant`.
3. Reexecutar `02_persona_access_matrix.sql`.
4. Expandir matriz para saldos, chamados, notificacoes, favoritos e avaliacoes.
