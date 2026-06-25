# Database

## Principais tabelas

- `profiles`: usuarios e roles.
- `tenants`: tenants/empresas logicas.
- `tenant_users`: vinculo usuario-tenant e papel.
- `empresa_configuracoes`: dados comerciais, branding e modos da empresa.
- `planos_saas`: planos do SaaS.
- `assinaturas_saas`: assinatura atual da empresa.
- `assinaturas_saas_historico`: historico de assinaturas.
- `saas_products`: produtos/apps controlados pelo SaaS.
- `saas_product_databases`: Data Planes dedicados por produto.
- `saas_product_provisioning_runs`: execucoes de provisionamento.
- `ai_factory_runs`: execucoes da fabrica IA.
- `ai_factory_agent_logs`: logs por agente.
- `ai_factory_artifacts`: artefatos gerados para white label.
- `ai_factory_audit_logs`: auditoria da fabrica IA.
- `pedidos`: pedidos de servico.
- `propostas`: propostas para pedidos.
- `pagamentos`: pagamentos de pedidos.
- `comissoes`: comissoes de profissionais/marketplace.
- `profissionais`: profissionais com dados operacionais/localizacao.
- `disparo_pedidos`: distribuicao de pedidos rapidos.
- `servicos`: servicos cadastrados.
- `contratos_digitais`: contratos.
- `escrow_milestones`: etapas de escrow.
- `analytics_eventos`: eventos analiticos.
- `produtos_fornecedor`: catalogo de fornecedores.
- `empresa_profissional_convites`: convites de profissionais por empresa.
- `wallets` e `wallet_transactions`: saldos e movimentacoes.
- `caminho_hospedagem_reservas`: reservas da vertical hospedagens.
- `caminho_hospedagem_pousada_saldos`: saldos de pousadas.
- `caminho_hospedagem_movimentos`: movimentacoes da vertical hospedagens.

## Principais relacionamentos

- `tenant_users.tenant_id` vincula usuarios a `tenants`.
- `profiles.id` segue o usuario autenticado do Supabase Auth.
- Empresas/configuracoes derivam de tenants e sao acessadas por RPCs de empresa.
- `assinaturas_saas` liga empresa a `planos_saas`.
- `assinaturas_saas_historico` registra mudancas de assinatura por empresa.
- `saas_product_databases.product_id` aponta para `saas_products`.
- `saas_product_provisioning_runs.product_id` aponta para `saas_products`.
- `ai_factory_agent_logs.run_id`, `ai_factory_artifacts.run_id` e `ai_factory_audit_logs.run_id` apontam para `ai_factory_runs`.
- `pedidos` relaciona cliente, profissional e tenant.
- `propostas`, `pagamentos`, contratos e milestones derivam de `pedidos`.
- Marketplace liga fornecedores/profissionais a produtos, pedidos, pagamentos e comissoes.
- Hospedagens relaciona reservas, pousadas/tenants, pagamentos e saldos.

## Principais indices

- `profiles_tenant_idx`, `profiles_role_idx`.
- `pedidos_cliente_created_idx`, `pedidos_profissional_created_idx`, `pedidos_status_created_idx`, `pedidos_tenant_created_idx`.
- `servicos_user_idx`, `servicos_tenant_idx`.
- `pagamentos_profissional_idx`.
- `comissoes_profissional_idx`.
- `analytics_eventos_user_created_idx`, `analytics_eventos_pedido_created_idx`, `analytics_eventos_evento_idx`.
- `profissionais_location_idx`.
- `disparo_pedidos_profissional_status_idx`, `disparo_pedidos_pedido_status_idx`.
- `produtos_fornecedor_tenant_ativo_idx`, `produtos_fornecedor_fornecedor_idx`.
- `assinaturas_saas_empresa_created_idx`.
- `empresa_profissional_convites_empresa_created_idx`, `empresa_profissional_convites_email_idx`.
- `ai_factory_runs_tenant_created_idx`, `ai_factory_runs_user_created_idx`.
- `ai_factory_agent_logs_run_idx`, `ai_factory_artifacts_run_idx`.
- `ai_factory_audit_logs_tenant_created_idx`, `ai_factory_audit_logs_run_idx`.
- `saas_products_status_idx`, `saas_product_databases_project_ref_idx`, `saas_product_provisioning_runs_product_idx`.
- Indices `tenant_id` sao aplicados a tabelas multi-tenant relevantes.

## Buckets

- `imagens`: bucket principal. Leitura publica preservada por compatibilidade. Uploads novos devem usar prefixo `<user_id>/uploads/<arquivo>`.
- Vertical hospedagens possui migrations de fotos de quartos/rooms no projeto do cliente.

## RLS

RLS e habilitado nas tabelas sensiveis e multi-tenant, incluindo:

- `profiles`, `pedidos`, `servicos`.
- `tenants`, `tenant_users`.
- `propostas`, `pagamentos`, `comissoes`.
- `contratos_digitais`, `escrow_milestones`, `analytics_eventos`.
- `disparo_pedidos`, `produtos_fornecedor`.
- `empresa_configuracoes`, `planos_saas`, `assinaturas_saas`.
- `empresa_profissional_convites`.
- `ai_factory_runs`, `ai_factory_agent_logs`, `ai_factory_artifacts`, `ai_factory_audit_logs`.
- `saas_products`, `saas_product_databases`, `saas_product_provisioning_runs`.
- `wallets`, `wallet_transactions`, `assinaturas_saas_historico`.

Helpers importantes:

- `current_tenant_id()`.
- `current_empresa_id()`.
- `user_belongs_to_tenant()`.
- `is_empresa_admin()`.
- `is_super_admin()`.
- `ensure_current_user_tenant_context()`.
- `ensure_app_tenant_context()`.

## Migrations importantes

- `20260227000000_core_base_schema.sql`: base de profiles, pedidos e servicos.
- `20260228010100_pagamentos_mercado_pago.sql`: pagamentos Mercado Pago.
- `20260228010200_propostas_comissoes.sql`: propostas e comissoes.
- `20260305010500_stage2_escrow_contrato_analytics.sql`: contratos, escrow e analytics.
- `20260307090000_pedidos_rapidos_uberizacao.sql`: pedidos rapidos/profissionais/disparo.
- `20260308130000_multitenant_core.sql`: tenants e tenant_users.
- `20260308133000_multitenant_rls.sql`: RLS multi-tenant.
- `20260308134000_multitenant_rpc_helpers.sql`: helpers RPC de tenant.
- `20260309130000_marketplace_produtos_checkout.sql`: marketplace.
- `20260314120000_saas_empresa_foundation.sql`: empresas SaaS.
- `20260314123000_saas_admin_billing.sql`: planos e assinaturas.
- `20260314150000_saas_product_growth.sql`: convites/crescimento.
- `20260622130000_saas_white_label_automation.sql`: automacao white label.
- `20260622143000_caminhos_hospedagens_vertical.sql`: vertical hospedagens.
- `20260624120000_ai_factory_foundation.sql`: fabrica IA.
- `20260625120000_supabase_production_hardening.sql`: hardening producao.
- `20260625130000_saas_product_dedicated_databases.sql`: Data Planes dedicados.
