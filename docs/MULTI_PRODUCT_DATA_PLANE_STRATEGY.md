# Estrategia Multi-Produto e Data Planes

Casa Mineira SaaS - Sprint Enterprise 013

## 1. Resumo executivo

Status geral: **PARCIAL, com isolamento logico existente e isolamento fisico ainda incompleto**.

A Casa Mineira SaaS ja possui uma base clara para operar como **Control Plane**: usuarios, tenants, empresas, planos SaaS, billing SaaS, Business DNA, templates premium, AI Factory e registro de produtos/data planes dedicados.

Tambem ja existe a estrutura `saas_products`, `saas_product_databases` e `saas_product_provisioning_runs`, incluindo registros para:

- Casa Mineira Servicos.
- Hospedagens Caminhos da Fe.

Isso confirma que a arquitetura alvo ja foi iniciada. O risco atual e que varias tabelas operacionais de produtos ainda vivem no mesmo schema `public` e no mesmo historico de migrations do Control Plane. A separacao por `tenant_id` e RLS reduz risco, mas nao equivale a isolamento fisico completo por produto/data plane.

Nesta sprint nao foi criada migration porque os metadados minimos dos dois produtos ja existem em `20260625131000_seed_current_product_databases.sql`. A acao correta agora e documentar os limites e preparar uma migracao gradual, sem mover dados, renomear tabelas ou alterar RLS em producao sem testes dedicados.

## 2. Problema atual

O Supabase atual concentra pelo menos tres contextos:

1. **Casa Mineira SaaS**
   - Plataforma principal.
   - Control Plane.
   - Deve gerenciar usuarios, empresas, tenants, planos, billing SaaS, Business DNA, templates, Business Projects, IA, auditoria e produtos.

2. **Casa Mineira Servicos**
   - Produto operacional/data plane.
   - Marketplace de servicos residenciais, profissionais, pedidos, propostas, pagamentos operacionais, comissoes, fornecedores, carteira e verticais como gas.

3. **Hospedagens Caminhos da Fe**
   - Produto operacional/data plane.
   - Plataforma de hospedagens, pousadas, quartos, disponibilidade, reservas, saldos, movimentos, avaliacoes, favoritos, notificacoes e chamados.

O problema nao e a existencia desses tres contextos. O problema e que o repositorio ainda mistura tabelas e migrations de Control Plane e Data Planes no mesmo schema operacional, o que aumenta risco de:

- queries sem filtro correto de produto/tenant;
- policies RLS compartilhadas demais;
- billing operacional ser confundido com billing SaaS;
- deploy/migration do Control Plane afetar produto final;
- evolucao de um produto quebrar outro.

## 3. Tabelas por categoria

Classificacao usada:

- **A. Control Plane SaaS**
- **B. Casa Mineira Servicos Data Plane**
- **C. Hospedagens Caminhos da Fe Data Plane**
- **D. Compartilhada com risco**
- **E. Legado / precisa migracao futura**
- **F. Desconhecida**

### A. Control Plane SaaS

Tabelas que pertencem ao controle da plataforma, catalogo SaaS, billing SaaS, IA ou governanca:

- `profiles`
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
- `business_dna_modules`
- `premium_templates`
- `template_modules`
- `template_integrations`
- `ai_factory_runs`
- `ai_factory_agent_logs`
- `ai_factory_artifacts`
- `ai_factory_audit_logs`
- `account_deletion_requests`

Observacao: `profiles`, `tenants` e `tenant_users` sao base de identidade e tenancy. Eles podem ser consumidos por produtos, mas devem continuar sendo tratados como Control Plane ou identidade compartilhada governada pelo SaaS.

### B. Casa Mineira Servicos Data Plane

Tabelas operacionais do marketplace de servicos, profissionais, fornecedores, pedidos e verticais relacionadas:

- `pedidos`
- `propostas`
- `pagamentos`
- `comissoes`
- `avaliacoes`
- `profissionais`
- `servicos`
- `mensagens`
- `disparo_pedidos`
- `pedido_produtos_itens`
- `produtos_fornecedor`
- `contratos_digitais`
- `escrow_milestones`
- `wallets`
- `wallet_transactions`
- `saque_solicitacoes`
- `profissional_gateway_accounts`
- `gas_revendedores`
- `gas_pedidos`

Tabelas ERP/fornecedor ligadas ao produto/operacao de fornecedores:

- `fornecedor_alertas_inteligentes`
- `fornecedor_anomalias`
- `fornecedor_bi_auditoria`
- `fornecedor_bi_metas`
- `fornecedor_cashflow_planos`
- `fornecedor_churn_scores`
- `fornecedor_comandos_voz_logs`
- `fornecedor_compras`
- `fornecedor_compras_itens`
- `fornecedor_conciliacao_extratos`
- `fornecedor_crm_leads`
- `fornecedor_data_room_metricas`
- `fornecedor_digital_twin_cenarios`
- `fornecedor_documentos_fiscais`
- `fornecedor_estoque_movimentos`
- `fornecedor_financeiro_lancamentos`
- `fornecedor_precificacao_custos_produto`
- `fornecedor_precificacao_recomendacoes`
- `fornecedor_precificacao_regras`
- `fornecedor_risco_eventos`
- `fornecedor_sla_predicoes`
- `fornecedor_workflow_execucoes`
- `fornecedor_workflow_regras`

### C. Hospedagens Caminhos da Fe Data Plane

Tabelas operacionais do produto de hospedagens:

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

Essas tabelas ja usam prefixo de dominio, o que ajuda a reduzir ambiguidade. Ainda assim, elas continuam no mesmo schema `public` do Control Plane no historico atual.

### D. Compartilhada com risco

Tabelas que podem atender mais de um contexto ou carregar dados de produto dentro do Control Plane:

- `analytics_eventos`
- `app_branding`
- `banners_publicitarios`
- `empresa_profissional_convites`
- `integracao_apps`
- `white_label_templates`

Risco principal: essas tabelas podem misturar analytics, branding, campanhas, convites e templates de produtos diferentes sem uma fronteira explicita por `product_id` alem de `tenant_id` ou convencoes de uso.

### E. Legado / precisa migracao futura

Tabelas que devem ser preservadas agora, mas avaliadas para data plane dedicado quando houver janela de migracao:

- tabelas operacionais de Casa Mineira Servicos em `public`;
- tabelas ERP/fornecedor em `public`;
- tabelas de Hospedagens em `public`;
- `analytics_eventos`, caso seja usado tanto para produto quanto para plataforma;
- `pagamentos`, caso algum fluxo SaaS antigo ainda dependa dela em vez de `saas_billing_events`.

### F. Desconhecida

Nenhuma tabela foi classificada como totalmente desconhecida nesta revisao. Algumas tabelas seguem como compartilhadas/legado porque o nome e o contexto indicam uso, mas a separacao final depende de testes e leitura de uso em runtime.

## 4. Riscos de mistura de dados

1. **Control Plane e Data Plane no mesmo schema**
   - Uma migration do SaaS pode afetar produtos operacionais.

2. **Dependencia exclusiva de `tenant_id`**
   - `tenant_id` isola empresas, mas nao identifica sozinho o produto/data plane quando varios produtos compartilham a mesma infraestrutura.

3. **Ausencia uniforme de `product_id` nas tabelas operacionais**
   - Algumas tabelas conseguem separar por tenant, mas nao por produto registrado em `saas_products`.

4. **Billing operacional vs billing SaaS**
   - `pagamentos` pertence ao produto/servicos.
   - `saas_billing_events` e `assinaturas_saas` pertencem ao SaaS.
   - Misturar os dois pode gerar cobranca, conciliacao e auditoria incorretas.

5. **Analytics e branding compartilhados**
   - `analytics_eventos`, `app_branding` e `banners_publicitarios` exigem delimitacao clara por produto, tenant e ambiente.

6. **RLS complexa**
   - Ha RLS em varios modulos, mas o volume de policies aumenta risco de permissao cruzada se funcoes auxiliares forem usadas fora do contexto correto.

7. **Casa Mineira Servicos como legado ativo**
   - O seed marca o banco da Casa Mineira Servicos como `legacy_existing`, indicando que o produto ja existe e precisa de tratamento conservador.

## 5. Arquitetura alvo

Arquitetura recomendada:

```text
Casa Mineira SaaS
Control Plane
  - Auth / identidade
  - tenants / empresas / usuarios
  - planos e assinaturas SaaS
  - Business DNA
  - Marketplace de templates
  - Business Projects
  - AI Factory / AI Orchestration
  - auditoria e seguranca
  - registry de produtos e data planes
        |
        +-- Data Plane 1: Casa Mineira Servicos
        |     - marketplace de servicos
        |     - pedidos, propostas, profissionais
        |     - pagamentos operacionais
        |     - fornecedores, wallet, gas, ERP
        |
        +-- Data Plane 2: Hospedagens Caminhos da Fe
              - pousadas, quartos, reservas
              - saldos, movimentos, avaliacoes
              - notificacoes, chamados, disponibilidade
```

Cada Data Plane deve ter:

- `product_id`;
- `tenant_id`;
- ambiente (`development`, `preview`, `staging`, `production`);
- RLS propria;
- logs proprios;
- billing operacional proprio;
- migrations/versionamento proprio;
- segredo/service role proprio;
- CORS e auth config proprios quando houver banco dedicado.

## 6. Control Plane vs Data Plane

### Control Plane

O Control Plane responde a perguntas de plataforma:

- Quem e o usuario?
- Qual empresa/tenant ele acessa?
- Qual plano SaaS esta ativo?
- Quais produtos existem?
- Qual banco/data plane cada produto usa?
- Quais templates e Business DNA estao disponiveis?
- Quais execucoes de IA foram solicitadas?
- Quais limites, auditorias e aprovacoes existem?

### Data Plane

O Data Plane responde a perguntas de produto:

- Quais pedidos foram criados?
- Quais reservas existem?
- Qual profissional recebeu proposta?
- Qual pousada recebeu pagamento?
- Qual fornecedor tem estoque?
- Qual wallet recebeu movimento?
- Qual avaliacao pertence a uma reserva ou pedido?

Regra permanente: **o Control Plane orquestra; o Data Plane opera**.

## 7. Casa Mineira Servicos como primeiro produto/cliente

Casa Mineira Servicos deve ser tratado como o primeiro produto operacional criado/operado pelo SaaS.

Registro ja encontrado:

- `saas_products.slug`: `casa-mineira-servicos`
- `product_type`: `services_marketplace`
- `domain`: `casamineiraservicos.app.br`
- `tenant_slug`: `default`
- `requires_dedicated_supabase`: `true`
- `saas_product_databases.supabase_project_ref`: `uinrmrclgzztilrtxboq`
- status de banco/funcoes/storage/auth: `legacy_existing`

Interpretacao:

- O produto ja existe e deve ser preservado.
- Ele deve permanecer isolado conceitualmente como Data Plane.
- Qualquer migracao futura deve ser feita com compatibilidade, validacao de RLS e plano de rollback.
- Nao deve ser confundido com a Casa Mineira SaaS, mesmo compartilhando marca historica.

## 8. Hospedagens Caminhos da Fe como segundo produto/cliente

Hospedagens Caminhos da Fe deve ser tratado como segundo produto/data plane oficial.

Registro ja encontrado:

- `saas_products.slug`: `hospedagens-caminhos-da-fe`
- `product_type`: `hotel_booking`
- `domain`: `hospedagenscaminhosdafe.com.br`
- `tenant_slug`: `hospedagens-caminhos-da-fe`
- `requires_dedicated_supabase`: `true`
- `saas_product_databases.supabase_project_ref`: `uxtqwsckvrsxjvvtdwhg`
- status de migrations/functions/storage/auth: `applied`, `deployed`, `configured`, `configured`

Interpretacao:

- O produto ja esta mais alinhado ao modelo dedicado.
- O prefixo `caminho_hospedagem_` ajuda a separar dominio, mas nao substitui data plane dedicado.
- O Control Plane deve enxergar esse produto por `saas_products` e nao por acoplamento direto a tabelas operacionais.

## 9. Estrategia de migracao segura

1. **Congelar fronteiras conceituais**
   - Usar este documento como referencia antes de criar novas tabelas.
   - Toda tabela nova deve ser classificada como Control Plane ou Data Plane antes da migration.

2. **Mapear uso real por rota/servico**
   - Identificar quais telas, services e Edge Functions leem/escrevem cada grupo de tabelas.
   - Nao alterar nada sem smoke tests por produto.

3. **Adicionar metadados sem ruptura quando necessario**
   - Priorizar `product_id` em novas tabelas.
   - Para tabelas legadas, planejar backfill separado e reversivel.

4. **Criar testes de isolamento**
   - Testar tenant A vs tenant B.
   - Testar produto A vs produto B.
   - Testar super admin vs owner vs usuario comum.

5. **Separar billing**
   - Manter billing SaaS em `assinaturas_saas`/`saas_billing_events`.
   - Manter pagamentos de produto em tabelas operacionais do respectivo data plane.

6. **Planejar data planes fisicos**
   - Casa Mineira Servicos: manter compatibilidade com legado e migrar por fases.
   - Hospedagens Caminhos da Fe: validar projeto dedicado e reduzir acoplamento ao Control Plane.

7. **Cutover gradual**
   - Exportar/importar por produto.
   - Validar contagens, totais financeiros e RLS.
   - Rodar em paralelo quando necessario.
   - Trocar endpoints/envs apenas apos validacao.

8. **Auditoria pos-migracao**
   - Confirmar logs, webhooks, storage, auth, CORS e secrets.
   - Confirmar que o Control Plane nao consulta tabelas operacionais diretamente sem contrato.

## 10. O que NAO deve ser feito agora

- Nao apagar tabelas operacionais.
- Nao renomear tabelas em producao.
- Nao mover dados entre bancos nesta sprint.
- Nao alterar RLS sem testes especificos.
- Nao criar outro registro duplicado para Casa Mineira Servicos.
- Nao criar outro registro duplicado para Hospedagens Caminhos da Fe.
- Nao misturar `pagamentos` operacionais com billing SaaS.
- Nao transformar `produtos_fornecedor` em marketplace premium de templates.
- Nao usar service role no frontend.
- Nao usar uma unica env de Supabase para todos os produtos futuros.
- Nao tratar Casa Mineira Servicos como se fosse a propria Casa Mineira SaaS.

## 11. Proximas sprints recomendadas

1. **Sprint 014 - Testes de isolamento RLS por produto e tenant**
   - Criar matriz de usuarios/tenants/produtos.
   - Validar policies criticas sem alterar comportamento.

2. **Sprint 015 - Product Context Service**
   - Criar leitura centralizada de `saas_products` e `saas_product_databases`.
   - Expor produto atual para Control Plane, Business Project e AI Copilot.

3. **Sprint 016 - Inventario de dependencias por tabela**
   - Mapear services, rotas e functions que usam tabelas de Casa Mineira Servicos e Hospedagens.

4. **Sprint 017 - Plano de migracao Casa Mineira Servicos**
   - Definir fases para sair de `legacy_existing` sem quebrar app publicado.

5. **Sprint 018 - Validacao Data Plane Hospedagens**
   - Confirmar secrets, migrations remotas, functions, storage e RLS no projeto dedicado.

6. **Sprint 019 - Observabilidade multi-produto**
   - Logs, health checks e alertas por produto/data plane.

## 12. Checklist de seguranca

Antes de qualquer mudanca futura em banco/data plane:

- [ ] A tabela foi classificada como Control Plane ou Data Plane.
- [ ] Existe `tenant_id` quando a tabela guarda dados de cliente.
- [ ] Existe `product_id` ou equivalente quando a tabela guarda dados de produto.
- [ ] RLS foi revisada para o papel correto.
- [ ] Service role continua apenas em backend/Edge Function.
- [ ] Billing SaaS e pagamento operacional nao foram misturados.
- [ ] O produto afetado foi localizado em `saas_products`.
- [ ] O banco/ambiente afetado foi localizado em `saas_product_databases`.
- [ ] Existe plano de rollback.
- [ ] Existe smoke test para Casa Mineira SaaS.
- [ ] Existe smoke test para Casa Mineira Servicos.
- [ ] Existe smoke test para Hospedagens Caminhos da Fe.
- [ ] Nenhum dado sensivel sera exposto em logs.
- [ ] Nenhuma migration destrutiva sera executada sem backup e aprovacao explicita.

## Conclusao

`saas_product_databases` ja atende a parte de **registro e governanca** da separacao multi-produto. Ele permite que a Casa Mineira SaaS saiba quais produtos existem, qual banco Supabase cada produto usa e qual o status operacional de migrations, functions, storage e auth.

Porem, ele ainda nao resolve sozinho a separacao completa porque muitas tabelas operacionais continuam historicamente no mesmo schema `public`. A arquitetura correta e manter o Control Plane como orquestrador e evoluir os produtos para Data Planes dedicados, com migracao gradual, testes de isolamento e zero alteracao destrutiva sem aprovacao.
