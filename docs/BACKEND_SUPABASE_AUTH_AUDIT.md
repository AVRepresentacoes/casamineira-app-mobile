# Auditoria Backend / Supabase / Auth

Casa Mineira SaaS - Sprint Enterprise 003

## 1. Resumo executivo

Status geral: **PARCIAL com RISCO P0 para produção SaaS real**.

A Casa Mineira SaaS possui uma base Supabase real: cliente configurado no frontend, Supabase Auth em login/cadastro, migrations extensas, RLS em tabelas principais, Edge Functions para IA, pagamentos, webhooks e Security Center. Também há estrutura multi-tenant com `tenants`, `tenant_users`, RPCs de contexto e módulos administrativos SaaS.

O ponto crítico é que a nova experiência SaaS premium criada nas sprints recentes ainda é majoritariamente visual/mockada. Business DNA, Marketplace Premium, Business Project, AI Copilot, AI Workforce, AI Solution Architect e Project Review usam catálogos e mocks locais, sem persistência oficial no banco. O cadastro cria usuário via Supabase Auth, mas não conclui sozinho o ciclo SaaS completo de empresa/tenant/onboarding/plano/projeto.

Portanto, a base técnica existe, mas ainda não está fechada como SaaS vendável de ponta a ponta.

## 2. Estado atual

| Área | Status | Evidência |
| --- | --- | --- |
| Conexão Supabase | **PRONTO** | `lib/supabase.ts` cria cliente Supabase com URL e anon key públicas. |
| Configuração pública Supabase | **PARCIAL** | `lib/supabase-config.ts` aceita `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*` e `SUPABASE_*`; usa fallback inválido quando faltam envs. |
| Supabase Auth login | **PRONTO** | `components/saas/SaasLoginScreen.tsx` usa `supabase.auth.signInWithPassword`. |
| Supabase Auth cadastro | **PARCIAL** | `app/register.tsx` usa `supabase.auth.signUp`, mas não completa empresa/tenant/projeto automaticamente. |
| Recuperação de senha | **MOCKADO** | `app/forgot-password.tsx` exibe fluxo visual e não chama `resetPasswordForEmail`. |
| Banco PostgreSQL | **PRONTO/PARCIAL** | Muitas migrations estruturam core, tenant, billing, marketplace, IA e security center. Falta persistir novos módulos SaaS premium. |
| RLS | **PRONTO/PARCIAL** | RLS habilitado em tabelas principais; hardening existe. Precisa validação em produção. |
| Multi-tenant | **PARCIAL** | `tenants`, `tenant_users`, RPCs e contexto existem; onboarding público ainda não parece conectado ao registro premium. |
| Edge Functions | **PARCIAL** | Functions reais existem; dependem de secrets, deploy e validação operacional. |
| IA real | **PARCIAL** | `ai-orchestrator` pode chamar OpenAI no backend, mas default força dry-run se configurado. Novas áreas de IA usam mocks locais. |
| Pagamentos app/serviços | **PARCIAL** | Mercado Pago/Asaas functions existem para pedidos. Billing SaaS real ainda está preparado, mas adapter atual é pendente. |
| Billing SaaS | **PARCIAL/MOCKADO** | Tabelas e RPCs existem; `lib/saas-billing.ts` lança erro de integração ainda não ativada. |
| Marketplace Premium | **MOCKADO** | `src/template-marketplace/catalog.ts` contém templates locais com placeholders. |
| Business DNA | **MOCKADO** | `src/business-dna/catalog.ts` contém catálogo local com placeholders. |
| Business Project | **MOCKADO** | `src/business-project/mock.ts` contém projetos locais. |
| Storage | **PARCIAL** | Bucket `imagens` documentado e hardening de policies existe; precisa validação no projeto Supabase ativo. |
| Webhooks | **PARCIAL/RISCO** | Mercado Pago e Asaas existem; segurança depende de secrets como `MERCADOPAGO_WEBHOOK_SECRET` e `ASAAS_WEBHOOK_TOKEN`. |

## 3. Respostas objetivas da auditoria

1. **O projeto está conectado ao Supabase?**  
   **PRONTO.** Sim. O cliente está em `lib/supabase.ts`.

2. **Onde está configurado o cliente Supabase?**  
   **PRONTO.** `lib/supabase.ts` usa `getSupabasePublicConfig()` de `lib/supabase-config.ts`.

3. **Existe Supabase Auth real?**  
   **PRONTO/PARCIAL.** Login e cadastro usam Supabase Auth real. Recuperação não.

4. **A tela `/login` autentica usuário real ou é apenas visual?**  
   **PRONTO.** Autentica com `supabase.auth.signInWithPassword`.

5. **A tela `/register` cria usuário real ou é apenas visual?**  
   **PARCIAL.** Cria usuário com `supabase.auth.signUp`, mas não cria toda a estrutura SaaS comercial.

6. **Existe recuperação de senha real?**  
   **MOCKADO/AUSENTE.** A tela existe, mas não chama Supabase Auth reset.

7. **Quais variáveis de ambiente são necessárias?**  
   **PARCIAL.** Principais:
   - Frontend: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_APP_URL`.
   - Backend/Edge: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
   - Pagamentos: `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`.
   - IA: `OPENAI_API_KEY`, `AI_MODEL`, `AI_FACTORY_DRY_RUN`, limites e custos da fábrica IA.
   - CORS: `EDGE_ALLOWED_ORIGINS`.

8. **Existe banco PostgreSQL estruturado?**  
   **PRONTO/PARCIAL.** Sim, com migrations amplas. Falta modelagem dos novos produtos SaaS premium.

9. **Quais tabelas existem ou estão documentadas?**  
   **PRONTO.** Principais: `profiles`, `tenants`, `tenant_users`, `empresa_configuracoes`, `planos_saas`, `assinaturas_saas`, `assinaturas_saas_historico`, `saas_billing_integrations`, `saas_billing_events`, `saas_products`, `saas_product_databases`, `saas_product_provisioning_runs`, `ai_factory_runs`, `ai_factory_agent_logs`, `ai_factory_artifacts`, `ai_factory_audit_logs`, `pedidos`, `propostas`, `pagamentos`, `comissoes`, `profissionais`, `produtos_fornecedor`, `wallets`, `wallet_transactions`, `analytics_eventos`.

10. **Existem migrations?**  
    **PRONTO.** Sim, em `supabase/migrations`.

11. **Existe RLS configurado?**  
    **PRONTO/PARCIAL.** Sim. Há RLS em core, multi-tenant, billing, IA, storage e hardening. Precisa validação contra ambiente remoto.

12. **Existe multi-tenant real?**  
    **PARCIAL.** Estrutura real existe, mas o fluxo premium público ainda não amarra cadastro -> empresa -> assinatura -> projeto.

13. **Existe tabela de empresas/organizations/tenants?**  
    **PRONTO.** `tenants`, `tenant_users` e `empresa_configuracoes`.

14. **Existe relacionamento usuário -> empresa?**  
    **PRONTO/PARCIAL.** `tenant_users` relaciona usuário e tenant. O cadastro premium não garante criação/seleção completa de empresa no ato.

15. **Existe tabela de projetos empresariais?**  
    **PARCIAL.** Existe `saas_products` para produtos/data planes; o conceito novo `Business Project™` está mockado em `src/business-project/mock.ts`.

16. **Existe tabela de templates/Business DNA?**  
    **AUSENTE/MOCKADO.** Não foi encontrada persistência oficial para Business DNA e Marketplace Premium; dados estão em arquivos TS locais.

17. **Existe persistência de Marketplace?**  
    **PARCIAL.** Marketplace operacional antigo/serviços tem tabelas como `produtos_fornecedor`. Marketplace Premium de templates está mockado.

18. **Existe controle de planos/assinaturas?**  
    **PARCIAL.** Tabelas/RPCs existem (`planos_saas`, `assinaturas_saas`, histórico e billing events). Gateway SaaS ainda não está ativado no adapter.

19. **Existe logs/auditoria?**  
    **PARCIAL.** IA possui `ai_factory_audit_logs`; Security Center existe; há eventos operacionais. Falta trilha unificada para todas as ações SaaS premium.

20. **Existe controle de consumo de IA/tokens?**  
    **PARCIAL.** `ai_factory_runs` armazena `usage` e `estimated_cost_brl`; orquestração visual usa estimativas mockadas. Falta governança consolidada por tenant/plano.

21. **Existe Storage configurado?**  
    **PARCIAL.** Config local habilita storage; hardening do bucket `imagens` existe em migration.

22. **Existe Edge Functions configuradas?**  
    **PARCIAL.** Existem functions para IA, artifacts, pagamentos, webhooks, checkout, conta e health. Falta confirmação de deploy/secrets.

23. **Existem webhooks Mercado Pago/Asaas funcionais?**  
    **PARCIAL/RISCO.** Código existe. Mercado Pago valida assinatura se `MERCADOPAGO_WEBHOOK_SECRET` estiver configurado; Asaas valida token se `ASAAS_WEBHOOK_TOKEN` estiver configurado. Sem secrets, a proteção pode ficar fraca.

24. **Quais partes estão mockadas?**  
    **MOCKADO.** Business DNA, Marketplace Premium, Business Project, AI Copilot, AI Workforce, AI Business Consultant, AI Solution Architect, Project Review e AI Orchestration frontend.

25. **Quais partes estão reais?**  
    **PRONTO/PARCIAL.** Supabase client, Auth login/cadastro, migrations, RLS, tenants, empresa/billing schema, Edge Functions, pagamentos de pedidos, AI Factory backend/dry-run/real opcional.

26. **Quais riscos existem para produção?**  
    **RISCO.** Cadastro incompleto, forgot-password mockado, catálogo premium sem banco, billing SaaS sem gateway real, dependência de secrets, ambiente remoto não validado, mocks podendo parecer funcionais para cliente.

27. **O que falta para transformar isso em SaaS real?**  
    **PARCIAL/AUSENTE.** Onboarding real, persistência de Business DNA/templates/projetos, billing SaaS real, recuperação de senha real, políticas de tenant finais, fluxo pós-cadastro, monitoramento e validação remota.

## 4. O que é real

- Cliente Supabase no frontend com anon key pública.
- Supabase Auth para login.
- Supabase Auth para cadastro básico.
- Estrutura multi-tenant: `tenants`, `tenant_users`, `current_tenant_id`, `user_belongs_to_tenant`, helpers de tenant.
- Contexto de empresa em `contexts/EmpresaContext.tsx`.
- Tabelas e RPCs SaaS para empresas, planos, assinatura, trial, uso, convites e administração.
- Tabelas e Edge Function da AI Factory.
- Edge Functions para Mercado Pago, Asaas, marketplace order, gas checkout, hospedagens e conta.
- Storage `imagens` previsto com policies de escrita por prefixo do usuário.
- Security Center com RPC de diagnóstico.

## 5. O que é mockado

- Business DNA: catálogo local em TypeScript.
- Marketplace Premium: templates locais em TypeScript.
- Business Project: projetos e módulos locais em TypeScript.
- Project Review: dados do blueprint/review locais.
- AI Copilot e AI Workforce: contexto e recomendações mockadas.
- AI Orchestration Core frontend: serviço local mock-only, com comentário de backend-only para IA real.
- Recuperação de senha pública: layout funcional visual, sem chamada Supabase.
- Billing SaaS gateway: adapter pendente lança erro de integração ainda não ativada.

## 6. O que falta

- Conectar `/forgot-password` a `supabase.auth.resetPasswordForEmail`.
- Definir fluxo pós-cadastro: criar/selecionar empresa, tenant, assinatura trial e perfil.
- Conectar `/register` ao onboarding SaaS real ou RPC segura dedicada.
- Criar tabelas oficiais para `business_dna`, `premium_templates`, `business_projects`, módulos, blueprints e revisões.
- Migrar catálogos mockados para persistência com RLS pública/controlada.
- Definir relação `business_projects -> tenants/users/templates/business_dna`.
- Ativar billing SaaS real com Mercado Pago/Asaas/Stripe ou fluxo manual seguro.
- Garantir webhooks com secrets obrigatórios em produção.
- Consolidar logs/auditoria por tenant para ações comerciais, geração, revisão, publicação e billing.
- Validar ambiente remoto Supabase com migrations aplicadas, functions deployadas e secrets completos.

## 7. Riscos P0

1. **Cadastro real incompleto:** usuário pode ser criado sem empresa, assinatura, tenant comercial ou projeto inicial.
2. **Recuperação de senha mockada:** usuários não conseguem recuperar acesso em produção.
3. **Módulos premium sem persistência:** Business DNA, templates e projetos podem parecer produtos reais, mas não salvam estado.
4. **Billing SaaS não ativado:** plano/assinatura existe no banco, mas checkout SaaS real ainda não está operacional.
5. **Webhooks dependentes de secrets opcionais:** se secrets não estiverem configurados, validação pode ficar insuficiente.
6. **Ambiente remoto não comprovado:** migrations/functions/secrets podem divergir do repositório.

## 8. Riscos P1

1. **Mistura de legado Casa Mineira Serviços com SaaS:** muitas tabelas e fluxos operacionais antigos coexistem com a nova plataforma.
2. **RLS precisa teste por papel:** há muitas policies, mas faltam testes automatizados de isolamento por tenant.
3. **Service role em Edge Functions:** uso correto backend-only, mas precisa checklist de secrets e logs para evitar vazamento.
4. **AI Factory pode operar real se dry-run for desligado:** precisa limites por tenant/plano antes de comercializar.
5. **Storage público:** bucket `imagens` mantém leitura pública por compatibilidade; adequado para imagens públicas, não para dados sensíveis.

## 9. Plano de implementação sugerido

1. **Auth real completo**
   - Implementar recuperação de senha real.
   - Criar fluxo pós-cadastro com empresa/tenant/perfil/plano trial.
   - Garantir redirects seguros login/register/dashboard.

2. **Onboarding SaaS**
   - Usar ou ajustar RPC `onboard_my_saas_empresa`.
   - Criar estado persistente de onboarding.
   - Associar usuário owner à empresa.

3. **Persistência dos catálogos**
   - Criar schema para Business DNA e Templates.
   - Migrar mocks para seeds.
   - Aplicar RLS: leitura pública controlada, gestão admin.

4. **Business Project real**
   - Criar tabela de projetos empresariais.
   - Relacionar tenant, owner, Business DNA, template, plano, status e módulos.
   - Criar timeline e audit trail.

5. **Billing SaaS**
   - Implementar adapter real escolhido.
   - Criar checkout/assinatura.
   - Conectar webhooks a `assinaturas_saas` e `saas_billing_events`.

6. **Governança IA**
   - Unificar AI Orchestration frontend com AI Factory backend.
   - Aplicar limites por plano/tenant.
   - Exigir aprovação humana antes de build/publicação.

7. **Validação produção**
   - Rodar smoke tests Supabase.
   - Confirmar migrations remotas.
   - Confirmar functions/secrets/CORS.
   - Testar RLS por tenant.

## 10. Ordem recomendada das próximas sprints

1. **Sprint 004 - Auth Recovery + Pós-cadastro**
2. **Sprint 005 - Onboarding SaaS Empresa/Tenant**
3. **Sprint 006 - Persistência Business DNA e Templates**
4. **Sprint 007 - Business Project real**
5. **Sprint 008 - Billing SaaS real**
6. **Sprint 009 - AI Orchestration backend-only**
7. **Sprint 010 - RLS, testes e hardening produção**

## 11. Arquivos analisados

- `docs/MASTER_ARCHITECT.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/DATABASE.md`
- `docs/API.md`
- `docs/ARCHITECTURE.md`
- `package.json`
- `.env.example`
- `supabase/config.toml`
- `lib/supabase.ts`
- `lib/supabase-config.ts`
- `lib/auth.ts`
- `lib/tenant.ts`
- `lib/saas-admin.ts`
- `lib/saas-commercial.ts`
- `lib/saas-billing.ts`
- `lib/marketplace.ts`
- `lib/ai-factory.ts`
- `lib/supabase-diagnostics.ts`
- `contexts/EmpresaContext.tsx`
- `components/saas/SaasLoginScreen.tsx`
- `app/register.tsx`
- `app/forgot-password.tsx`
- `hooks/useRequireSuperAdminWeb.ts`
- `hooks/useRequireProfissional.ts`
- `src/business-dna/catalog.ts`
- `src/template-marketplace/catalog.ts`
- `src/business-project/mock.ts`
- `src/ai-orchestration/aiOrchestrator.ts`
- `supabase/migrations/20260227000000_core_base_schema.sql`
- `supabase/migrations/20260308130000_multitenant_core.sql`
- `supabase/migrations/20260308133000_multitenant_rls.sql`
- `supabase/migrations/20260308134000_multitenant_rpc_helpers.sql`
- `supabase/migrations/20260308135000_multitenant_user_onboarding.sql`
- `supabase/migrations/20260308140000_multitenant_security_hardening.sql`
- `supabase/migrations/20260309130000_marketplace_produtos_checkout.sql`
- `supabase/migrations/20260314120000_saas_empresa_foundation.sql`
- `supabase/migrations/20260314123000_saas_admin_billing.sql`
- `supabase/migrations/20260314130000_saas_empresa_management.sql`
- `supabase/migrations/20260314140000_saas_commercial_foundation.sql`
- `supabase/migrations/20260314143000_saas_plan_enforcement.sql`
- `supabase/migrations/20260314144000_saas_billing_preparation.sql`
- `supabase/migrations/20260314150000_saas_product_growth.sql`
- `supabase/migrations/20260622130000_saas_white_label_automation.sql`
- `supabase/migrations/20260624120000_ai_factory_foundation.sql`
- `supabase/migrations/20260625120000_supabase_production_hardening.sql`
- `supabase/migrations/20260625130000_saas_product_dedicated_databases.sql`
- `supabase/migrations/20260625131000_seed_current_product_databases.sql`
- `supabase/functions/ai-orchestrator/index.ts`
- `supabase/functions/ai-factory-artifacts/index.ts`
- `supabase/functions/mercadopago-webhook/index.ts`
- `supabase/functions/asaas-webhook/index.ts`
- `supabase/functions/create-mercadopago-pix-payment/index.ts`
- `supabase/functions/create-asaas-pix-payment/index.ts`

## 12. Arquivos que NÃO foram alterados

Nenhum arquivo de código, banco, Supabase, Edge Function, autenticação, tela, IA ou pagamento foi alterado.

Único arquivo criado nesta auditoria:

- `docs/BACKEND_SUPABASE_AUTH_AUDIT.md`

