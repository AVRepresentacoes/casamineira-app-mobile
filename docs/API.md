# API

## Rotas importantes

| Rota/Função | Responsabilidade | Autenticacao | Integracoes |
| --- | --- | --- | --- |
| `/api/system/health` | Health check de banco, Supabase, Storage, Auth, Edge Functions, IA, tokens e Security Center. | Server env; anon e service role quando disponivel. | Supabase, Storage, Auth admin, Security Center RPC. |
| `ai-orchestrator` | Executar fabrica IA, dry-run/OpenAI, persistir run e logs. | Usuario autenticado via Supabase. | OpenAI Responses API, Supabase tables, CORS. |
| `ai-factory-artifacts` | Gerar artefatos white-label a partir de run aprovada. | Usuario autenticado/admin conforme politicas. | Supabase tables, auditoria, geracao de `client.json`/SQL/manifesto. |
| `create-mercadopago-preference` | Criar checkout/preferencia Mercado Pago. | Usuario autenticado. | Mercado Pago, `pagamentos`, pedidos. |
| `create-mercadopago-pix-payment` | Criar pagamento Pix Mercado Pago. | Usuario autenticado. | Mercado Pago, `pagamentos`. |
| `create-mercadopago-card-payment` | Criar pagamento cartao Mercado Pago. | Usuario autenticado. | Mercado Pago, `pagamentos`. |
| `mercadopago-webhook` | Receber atualizacoes Mercado Pago. | Webhook secret/provedor. | Mercado Pago, pagamentos, pedidos/comissoes. |
| `request-mercadopago-withdrawal` | Solicitar saque/repasse Mercado Pago. | Usuario/admin conforme funcao. | Mercado Pago, wallets/saldos. |
| `verify-mercadopago-account` | Verificar conta Mercado Pago. | Usuario autenticado. | Mercado Pago. |
| `create-asaas-pix-payment` | Criar Pix Asaas. | Usuario autenticado. | Asaas, `pagamentos`. |
| `asaas-webhook` | Receber eventos Asaas. | Webhook token/provedor. | Asaas, pagamentos. |
| `create-marketplace-order` | Criar pedido de marketplace. | Usuario autenticado. | Supabase, marketplace, pagamentos. |
| `create-gas-checkout-order` | Checkout da vertical gas. | Usuario autenticado. | Supabase, pagamentos, dominio gas. |
| `create-caminho-hospedagem-pix-payment` | Pix da vertical hospedagens. | Usuario autenticado. | Supabase, pagamentos, reservas. |
| `delete-account` | Exclusao de conta. | Usuario autenticado. | Supabase Auth e dados do usuario. |

## RPCs importantes

| RPC | Responsabilidade | Autenticacao | Integracoes |
| --- | --- | --- | --- |
| `current_tenant_id` | Retornar tenant ativo. | Usuario autenticado. | RLS/tenant. |
| `current_empresa_id` | Retornar empresa ativa. | Usuario autenticado. | SaaS empresa. |
| `get_meus_tenants` | Listar tenants do usuario. | Usuario autenticado. | `tenant_users`. |
| `set_tenant_ativo` | Trocar tenant ativo. | Usuario autenticado. | Tenant context. |
| `ensure_current_user_tenant_context` | Inicializar tenant padrao. | Usuario autenticado. | Tenant context. |
| `ensure_app_tenant_context` | Inicializar app white-label com tenant lock. | Usuario autenticado/cadastro publico controlado. | Tenant lock/white label. |
| `resolve_public_signup_tenant_id` | Resolver tenant para cadastro publico. | Publico controlado. | `tenants.public_signup_enabled`. |
| `get_my_empresa_context` | Carregar contexto da empresa. | Usuario autenticado. | Empresa/tenant/branding. |
| `get_my_empresa_saas_subscription` | Carregar assinatura do tenant. | Usuario autenticado. | Planos/assinaturas. |
| `is_super_admin` | Validar super admin. | Usuario autenticado. | Admin SaaS. |
| `get_saas_empresas_overview` | Visao geral de empresas. | Super admin. | Dashboard SaaS. |
| `saas_admin_create_empresa` | Criar empresa/tenant. | Super admin. | Control Plane. |
| `saas_admin_update_empresa` | Atualizar empresa, plano e assinatura. | Super admin. | Control Plane/billing. |
| `saas_admin_assign_empresa_admin` | Atribuir admin da empresa. | Super admin. | Tenant users. |
| `get_active_planos_saas` | Listar planos ativos. | Autenticado/admin. | Billing SaaS. |
| `get_saas_empresa_detail` | Detalhe da empresa. | Super admin. | Dashboard. |
| `get_supabase_security_center_status` | Status de seguranca Supabase. | Admin. | Security Center. |

## Observacoes

- Nao documentar cada endpoint interno: a regra oficial e consultar primeiro estes grupos.
- Toda funcao sensivel deve usar CORS compartilhado em `supabase/functions/_shared/cors.ts`.
- Service role so pode existir em backend, Edge Functions, scripts controlados e health server-side.
