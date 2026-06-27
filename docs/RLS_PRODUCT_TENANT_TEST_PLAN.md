# Plano de Testes RLS por Produto e Tenant

Casa Mineira SaaS - Sprint Enterprise 014

## 1. Objetivo

Validar se o isolamento de dados entre **Casa Mineira SaaS**, **Casa Mineira Servicos** e **Hospedagens Caminhos da Fe** esta seguro antes de qualquer migracao, separacao fisica ou ajuste de RLS.

Esta sprint nao corrige policies. Ela cria a matriz de validacao, os cenarios esperados e scripts SQL nao destrutivos para executar em ambiente local/staging.

## 2. Escopo

Contextos avaliados:

- **Control Plane SaaS:** usuarios, tenants, empresas, planos, billing SaaS, produtos, bancos dedicados, Business DNA, templates e AI Factory.
- **Casa Mineira Servicos Data Plane:** marketplace de servicos, pedidos, propostas, profissionais, pagamentos operacionais, fornecedores, wallet e verticais associadas.
- **Hospedagens Caminhos da Fe Data Plane:** pousadas, quartos, reservas, saldos, movimentos, avaliacoes, favoritos, notificacoes e chamados.

Fora de escopo:

- Alterar RLS.
- Alterar migrations existentes.
- Mover dados.
- Apagar tabelas.
- Executar em producao sem aprovacao explicita.

## 3. Pre-requisitos

Executar os testes primeiro em ambiente local/staging com dados controlados.

Criar ou identificar usuarios de teste:

| Persona | Produto/Tenant | Papel esperado |
| --- | --- | --- |
| `saas_super_admin` | Casa Mineira SaaS | `super_admin` |
| `saas_owner` | Casa Mineira SaaS | `owner` ou `admin` |
| `servicos_cliente` | Casa Mineira Servicos | `cliente` |
| `servicos_profissional` | Casa Mineira Servicos | `profissional` |
| `hospedagens_cliente` | Hospedagens Caminhos da Fe | `cliente` |
| `hospedagens_admin` | Hospedagens Caminhos da Fe | `admin_empresa` ou `owner` |
| `anon_visitante` | Publico | `anon` |

Identificar tenants/produtos:

| Produto | `saas_products.slug` | Tenant esperado |
| --- | --- | --- |
| Casa Mineira Servicos | `casa-mineira-servicos` | `default` |
| Hospedagens Caminhos da Fe | `hospedagens-caminhos-da-fe` | `hospedagens-caminhos-da-fe` |

## 4. Matriz de permissoes

Legenda:

- **ALLOW:** acesso esperado.
- **DENY:** acesso nao deve ocorrer.
- **PUBLIC:** leitura publica intencional.
- **ADMIN:** apenas super admin/admin autorizado.
- **RISK:** exige revisao porque a tabela pode misturar produto/tenant.

| Persona | Control Plane sensivel | Catalogo SaaS publico | Servicos data plane proprio | Servicos outro tenant | Hospedagens proprio | Hospedagens outro tenant | Product registry |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `anon_visitante` | DENY | PUBLIC | DENY, exceto dados publicos | DENY | PUBLIC limitado | DENY | DENY |
| `servicos_cliente` | DENY | PUBLIC | ALLOW limitado aos proprios dados | DENY | DENY | DENY | DENY |
| `servicos_profissional` | DENY | PUBLIC | ALLOW limitado a participacao/tenant | DENY | DENY | DENY | DENY |
| `hospedagens_cliente` | DENY | PUBLIC | DENY | DENY | ALLOW limitado aos proprios dados/publicos | DENY | DENY |
| `hospedagens_admin` | DENY, exceto empresa propria | PUBLIC | DENY | DENY | ALLOW tenant/admin | DENY | DENY |
| `saas_owner` | ALLOW empresa propria | PUBLIC | DENY sem vinculo | DENY | DENY sem vinculo | DENY | DENY |
| `saas_super_admin` | ADMIN | ADMIN | ADMIN | ADMIN | ADMIN | ADMIN | ADMIN |

## 5. Tabelas criticas

### Control Plane SaaS

- `tenants`
- `tenant_users`
- `empresa_configuracoes`
- `planos_saas`
- `assinaturas_saas`
- `assinaturas_saas_historico`
- `saas_billing_integrations`
- `saas_billing_events`
- `saas_products`
- `saas_product_databases`
- `saas_product_provisioning_runs`
- `business_dna`
- `premium_templates`
- `ai_factory_runs`
- `ai_factory_agent_logs`
- `ai_factory_artifacts`
- `ai_factory_audit_logs`

### Casa Mineira Servicos

- `pedidos`
- `propostas`
- `pagamentos`
- `comissoes`
- `profissionais`
- `servicos`
- `mensagens`
- `disparo_pedidos`
- `produtos_fornecedor`
- `pedido_produtos_itens`
- `contratos_digitais`
- `escrow_milestones`
- `wallets`
- `wallet_transactions`
- `saque_solicitacoes`
- `gas_revendedores`
- `gas_pedidos`

### Hospedagens Caminhos da Fe

- `caminho_hospedagem_pousadas`
- `caminho_hospedagem_quartos`
- `caminho_hospedagem_servicos`
- `caminho_hospedagem_disponibilidade`
- `caminho_hospedagem_reservas`
- `caminho_hospedagem_pousada_saldos`
- `caminho_hospedagem_movimentos`
- `caminho_hospedagem_aceites`
- `caminho_hospedagem_avaliacoes`
- `caminho_hospedagem_favoritos`
- `caminho_hospedagem_notificacoes`
- `caminho_hospedagem_chamados`

### Compartilhadas com risco

- `analytics_eventos`
- `app_branding`
- `banners_publicitarios`
- `empresa_profissional_convites`
- `integracao_apps`
- `white_label_templates`

## 6. Cenarios de teste

### C01 - Usuario SaaS nao acessa dados operacionais de outro tenant

**Query sugerida:**

```sql
select count(*) from public.pedidos where tenant_id <> public.current_tenant_id();
select count(*) from public.caminho_hospedagem_reservas where tenant_id <> public.current_tenant_id();
```

**Expected result:** `0` linhas visiveis para usuario comum/admin de empresa sem vinculo.

**Prioridade:** P0.

### C02 - Usuario Casa Mineira Servicos nao acessa Hospedagens

**Query sugerida:**

```sql
select count(*) from public.caminho_hospedagem_reservas;
select count(*) from public.caminho_hospedagem_pousada_saldos;
select count(*) from public.caminho_hospedagem_movimentos;
```

**Expected result:** `0`, exceto registros publicos explicitamente liberados, como avaliacoes publicadas quando a policy permitir.

**Prioridade:** P0.

### C03 - Usuario Hospedagens nao acessa Casa Mineira Servicos

**Query sugerida:**

```sql
select count(*) from public.pedidos;
select count(*) from public.propostas;
select count(*) from public.pagamentos;
select count(*) from public.produtos_fornecedor;
```

**Expected result:** `0` para usuario sem vinculo ao tenant `default`.

**Prioridade:** P0.

### C04 - Visitante publico so le dados publicos

**Query sugerida:**

```sql
select count(*) from public.business_dna where is_active = true;
select count(*) from public.premium_templates where is_active = true;
select count(*) from public.saas_products;
select count(*) from public.pedidos;
select count(*) from public.pagamentos;
```

**Expected result:**

- Catalogo publico ativo pode retornar linhas.
- `saas_products`, `pedidos`, `pagamentos` nao devem retornar linhas para anon.

**Prioridade:** P0.

### C05 - Product registry e visivel apenas para super admin

**Query sugerida:**

```sql
select slug, status from public.saas_products;
select provider, environment, status from public.saas_product_databases;
```

**Expected result:**

- Usuario comum: `0` linhas.
- `super_admin`: registros de produtos e data planes.

**Prioridade:** P0.

### C06 - Dados sem `tenant_id` ou `product_id` sao classificados como risco

**Query sugerida:**

```sql
select table_name
from information_schema.tables t
where table_schema = 'public'
  and table_type = 'BASE TABLE'
  and table_name in (
    'analytics_eventos',
    'app_branding',
    'banners_publicitarios',
    'integracao_apps',
    'white_label_templates'
  );
```

**Expected result:** listar tabelas que exigem revisao manual de coluna e policy.

**Prioridade:** P1.

### C07 - Service role/admin pode operar quando necessario

**Query sugerida:**

```sql
select public.is_super_admin();
select count(*) from public.saas_products;
select count(*) from public.saas_product_databases;
```

**Expected result:**

- `super_admin`: acesso permitido.
- Usuario comum: bloqueado por RLS.

**Prioridade:** P1.

### C08 - Insercao operacional usa tenant atual

**Query sugerida:** usar apenas em ambiente local/staging com transacao rollback.

```sql
begin;
-- inserir registro minimo de teste quando houver fixture controlada
rollback;
```

**Expected result:** qualquer insert operacional deve gravar `tenant_id = public.current_tenant_id()` ou falhar.

**Prioridade:** P1.

## 7. Queries sugeridas

Scripts SQL foram adicionados em:

- `supabase/tests/rls/00_inventory_readiness.sql`
- `supabase/tests/rls/01_product_tenant_isolation_matrix.sql`

Esses scripts nao devem ser executados diretamente em producao. Eles sao templates de validacao para ambiente local/staging ou sessao aprovada.

## 8. Expected result consolidado

| Area | Resultado esperado |
| --- | --- |
| Catalogo SaaS publico | `business_dna` e `premium_templates` ativos visiveis publicamente |
| Product registry | visivel apenas para `super_admin` |
| Billing SaaS | visivel apenas para tenant/empresa ou super admin |
| Pedidos/servicos | visiveis apenas para participantes/tenant correto |
| Hospedagens reservas/saldos | visiveis apenas para cliente/tenant/admin correto |
| Dados publicos hospedagens | somente itens explicitamente marcados como publicos |
| Dados sem tenant/product | classificados como risco e revisados antes de producao |

## 9. Riscos

### P0

1. **Fronteira produto/tenant incompleta:** muitas tabelas operacionais nao possuem `product_id`, dependendo apenas de `tenant_id`.
2. **Dados compartilhados com risco:** `analytics_eventos`, `app_branding`, `banners_publicitarios`, `integracao_apps` e `white_label_templates` podem misturar contexto sem contrato de produto.
3. **Service role/admin precisa checklist:** qualquer uso fora de backend/Edge Function pode furar RLS.
4. **Casa Mineira Servicos legado ativo:** o produto esta marcado como `legacy_existing`, exigindo testes antes de qualquer ajuste.

### P1

1. **Policies publicas intencionais precisam inventario:** catalogos, servicos ativos e avaliacoes publicadas devem ser explicitamente aceitos.
2. **RLS com helpers compartilhados:** `current_tenant_id()` retorna tenant default quando nao ha contexto, o que pode mascarar erro se a sessao nao estiver configurada corretamente.
3. **Control Plane consulta Data Plane:** services que leem `saas_products` como Business Project precisam manter separacao de responsabilidades.

### P2

1. **Falta automacao CI para RLS:** os testes ainda sao SQL manuais/templates.
2. **Falta relatorio de cobertura por policy:** uma sprint futura deve listar cada policy por tabela e expected role.

## 10. Correcoes recomendadas

Nao aplicar nesta sprint. Recomenda-se:

1. Criar testes RLS automatizados em ambiente local Supabase.
2. Adicionar `product_id` em novas tabelas operacionais de produto.
3. Planejar backfill de `product_id` em tabelas legadas somente apos inventario.
4. Separar analytics de plataforma e analytics de produto.
5. Criar `ProductContextService` para centralizar produto atual.
6. Criar checklist obrigatorio para qualquer policy nova.
7. Validar `current_tenant_id()` com fixtures multi-tenant e usuarios sem default tenant.

## 11. Prioridades

| Prioridade | Acao |
| --- | --- |
| P0 | Executar matriz em staging com usuarios reais de teste |
| P0 | Validar `saas_products`/`saas_product_databases` apenas para super admin |
| P0 | Validar Casa Mineira Servicos vs Hospedagens em ambos os sentidos |
| P1 | Inventariar tabelas compartilhadas com risco |
| P1 | Automatizar testes SQL em pipeline local |
| P2 | Criar cobertura de policy por tabela |

## 12. Checklist antes de alterar RLS

- [ ] Ambiente nao e producao ou ha aprovacao explicita.
- [ ] Existe backup/export validado.
- [ ] O teste falhou de forma reproduzivel.
- [ ] A tabela foi classificada como Control Plane ou Data Plane.
- [ ] O produto afetado foi identificado em `saas_products`.
- [ ] O tenant afetado foi identificado em `tenants`.
- [ ] A alteracao preserva Casa Mineira Servicos.
- [ ] A alteracao preserva Hospedagens Caminhos da Fe.
- [ ] O resultado foi validado com usuario comum, admin e super admin.
- [ ] Nenhum segredo/service role foi exposto no frontend ou em logs.

## 13. Conclusao

A arquitetura possui fundamentos de RLS e tenancy, mas ainda precisa de validacao sistematica por produto. O risco mais importante nao e ausencia completa de RLS; e a combinacao de produtos operacionais historicos no mesmo schema, com isolamento majoritariamente baseado em `tenant_id`.

O proximo passo seguro e executar os scripts de teste em staging/local com fixtures representativas e documentar falhas antes de qualquer correcao em policy.
