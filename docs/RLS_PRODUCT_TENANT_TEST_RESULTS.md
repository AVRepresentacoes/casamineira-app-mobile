# Resultado dos Testes RLS por Produto e Tenant

Casa Mineira SaaS - Sprint Enterprise 015

## 1. Ambiente testado

**Ambiente efetivamente testado contra banco:** nenhum.

Motivo:

- Existe configuracao local em `supabase/config.toml`.
- A Supabase CLI esta instalada em `/home/alexandre/bin/supabase`.
- O comando `supabase status` foi executado.
- A primeira execucao foi bloqueada pelo sandbox ao acessar Docker.
- A segunda execucao, com permissao elevada apenas para leitura de status, confirmou que o Docker daemon local nao esta acessivel/rodando:

```text
failed to inspect container health: Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
```

**Decisao de seguranca:** os scripts SQL nao foram executados contra producao nem contra qualquer Supabase remoto. Nao houve alteracao de dados, RLS, migrations ou configuracao.

## 2. Scripts executados

### Executados

- Nenhum script SQL foi executado contra banco.

### Lidos e preparados

- `supabase/tests/rls/00_inventory_readiness.sql`
- `supabase/tests/rls/01_product_tenant_isolation_matrix.sql`

### Comando de ambiente executado

```bash
supabase status
```

Resultado: ambiente local indisponivel porque Docker daemon nao esta rodando/acessivel.

## 3. Usuarios de teste documentados

Os usuarios abaixo devem ser criados ou identificados em Supabase local/staging antes de executar a matriz:

| Usuario conceitual | Produto/Tenant | Papel esperado | Uso no teste |
| --- | --- | --- | --- |
| `super_admin` | Casa Mineira SaaS | `super_admin` | Validar acesso administrativo a Control Plane |
| `saas_owner` | Casa Mineira SaaS | `owner` ou `admin` | Validar acesso ao proprio tenant SaaS |
| `casa_mineira_servicos_owner` | Casa Mineira Servicos | `owner` ou `admin_empresa` | Validar dados operacionais de servicos |
| `casa_mineira_servicos_cliente` | Casa Mineira Servicos | `cliente` | Validar pedidos/propostas proprios |
| `hospedagens_owner` | Hospedagens Caminhos da Fe | `owner` ou `admin_empresa` | Validar reservas/saldos do tenant hospedagens |
| `hospedagens_cliente` | Hospedagens Caminhos da Fe | `cliente` | Validar reservas proprias |
| `visitante_publico` | Publico | `anon` | Validar apenas dados publicos |

## 4. Cenarios testados

Como nao havia ambiente local/staging ativo, os cenarios abaixo foram **planejados e preparados**, mas nao executados contra banco.

| Cenario | Status | Expected result |
| --- | --- | --- |
| SaaS nao acessa dados operacionais indevidos | Nao executado | Usuario SaaS comum nao ve `pedidos`, `pagamentos` ou `caminho_hospedagem_*` fora do tenant |
| Casa Mineira Servicos nao acessa Hospedagens | Nao executado | Usuario do tenant `default` nao ve reservas/saldos/movimentos de Hospedagens |
| Hospedagens nao acessa Casa Mineira Servicos | Nao executado | Usuario do tenant `hospedagens-caminhos-da-fe` nao ve pedidos/propostas/pagamentos de Servicos |
| Visitante publico so le dados publicos | Nao executado | `business_dna`/`premium_templates` ativos podem aparecer; dados operacionais privados nao |
| Super admin acessa via fluxo administrativo | Nao executado | `saas_products` e `saas_product_databases` aparecem apenas para `super_admin` |
| Tabelas sem `product_id` sinalizadas | Preparado por inventario SQL | Tabelas compartilhadas entram em lista de risco |

## 5. Resultados esperados

1. `anon` nao deve ler tabelas privadas como `pedidos`, `pagamentos`, `saas_products` ou `saas_product_databases`.
2. Usuario Casa Mineira Servicos nao deve ler dados privados de `caminho_hospedagem_*`.
3. Usuario Hospedagens nao deve ler dados privados de `pedidos`, `propostas`, `pagamentos`, `produtos_fornecedor`, `wallets`.
4. Usuario comum nao deve ler `saas_products` nem `saas_product_databases`.
5. `super_admin` deve ler registros do Control Plane quando necessario.
6. Catalogos SaaS ativos (`business_dna`, `premium_templates`) podem ser publicos.
7. Toda tabela operacional privada deve estar protegida por `tenant_id`, `user_belongs_to_tenant`, `current_tenant_id` ou regra equivalente.

## 6. Resultados reais

Nao ha resultados reais de banco nesta sprint porque nao foi encontrado ambiente local/staging operacional.

Resultado real da validacao de ambiente:

| Verificacao | Resultado |
| --- | --- |
| `supabase/config.toml` existe | Sim |
| Supabase CLI existe | Sim |
| Docker/Supabase local acessivel | Nao |
| Staging identificado com seguranca nos arquivos permitidos | Nao |
| Producao acessada | Nao |
| Scripts SQL executados | Nao |
| Dados alterados | Nao |
| RLS alterada | Nao |

## 7. Falhas encontradas

### Falhas de ambiente

- **P0 operacional:** Supabase local nao esta disponivel porque Docker daemon nao esta rodando/acessivel.
- **P1 processo:** nao ha configuracao de staging claramente documentada nos arquivos lidos para executar a matriz com seguranca.

### Falhas de seguranca ainda nao comprovadas

As falhas abaixo permanecem como riscos a validar, nao como falhas confirmadas por execucao:

- isolamento produto/tenant ainda depende muito de `tenant_id`;
- varias tabelas operacionais nao possuem `product_id`;
- tabelas compartilhadas com risco precisam inventario de policies e colunas;
- Casa Mineira Servicos segue como legado ativo em `saas_product_databases`.

## 8. Tabelas criticas

### P0 para validar em staging/local

- `saas_products`
- `saas_product_databases`
- `tenant_users`
- `pedidos`
- `propostas`
- `pagamentos`
- `produtos_fornecedor`
- `wallets`
- `wallet_transactions`
- `caminho_hospedagem_reservas`
- `caminho_hospedagem_pousada_saldos`
- `caminho_hospedagem_movimentos`

### P1 para validar em staging/local

- `analytics_eventos`
- `app_branding`
- `banners_publicitarios`
- `empresa_profissional_convites`
- `integracao_apps`
- `white_label_templates`
- `ai_factory_runs`
- `ai_factory_artifacts`
- `saas_billing_events`
- `assinaturas_saas`

### P2 para validar em staging/local

- catalogos publicos `business_dna` e `premium_templates`;
- tabelas de suporte e notificacao;
- tabelas auxiliares de fornecedor/ERP com policies por tenant.

## 9. Recomendacoes P0/P1/P2

### P0

1. Subir Supabase local ou fornecer staging explicitamente seguro.
2. Executar `00_inventory_readiness.sql` antes da matriz.
3. Criar usuarios reais de teste por persona.
4. Executar `01_product_tenant_isolation_matrix.sql` com cada persona.
5. Registrar contagens por tabela e comparar com expected result.

### P1

1. Documentar oficialmente staging RLS.
2. Criar fixtures minimas para Casa Mineira Servicos e Hospedagens.
3. Adicionar `product_id` em novas tabelas operacionais futuras.
4. Separar analytics de plataforma e analytics de produto.

### P2

1. Automatizar a matriz no CI local.
2. Criar relatorio de cobertura por policy.
3. Evoluir os SQLs para testes assertivos com `pgTAP` ou harness equivalente.

## 10. Como executar manualmente em ambiente local

Somente em maquina com Docker/Supabase local ativo:

```bash
supabase start
supabase db reset
supabase status
```

Executar inventario:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -f supabase/tests/rls/00_inventory_readiness.sql
```

Executar matriz em sessoes controladas:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -f supabase/tests/rls/01_product_tenant_isolation_matrix.sql
```

Para simular persona autenticada em local/staging, usar transacao com JWT claims controladas conforme comentario do proprio script. Nao usar service role para cenarios de usuario comum.

## 11. Decisao: seguro ou nao seguro para producao

**Decisao:** **NAO COMPROVADO COMO SEGURO PARA PRODUCAO**.

Motivo:

- os testes SQL nao foram executados contra ambiente local/staging;
- nao ha resultados reais por persona;
- nao ha evidencia de staging seguro nos arquivos permitidos;
- o ambiente local nao esta ativo.

Isso nao significa que a RLS esteja quebrada. Significa que a seguranca ainda nao foi comprovada por execucao controlada.

## 12. Proxima acao recomendada

1. Ativar Docker/Supabase local ou fornecer staging explicitamente nao produtivo.
2. Rodar `supabase status`.
3. Executar `00_inventory_readiness.sql`.
4. Criar/identificar usuarios de teste.
5. Executar `01_product_tenant_isolation_matrix.sql` por persona.
6. Atualizar este relatorio com resultados reais.
7. Somente depois abrir sprint de correcao de RLS, se houver falhas reproduziveis.
