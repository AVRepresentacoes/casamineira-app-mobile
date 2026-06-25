# Changelog

## Inicial - Memoria oficial

### Grandes implementacoes existentes

- App Expo/React Native com Expo Router e TypeScript.
- Plataforma multi-tenant com Supabase como backend principal.
- Perfis de cliente, profissional, fornecedor, admin e super admin.
- Pedidos, propostas, pagamentos, marketplace, comissoes, reputacao e verticais especializadas.

### Arquitetura IA

- Fabrica de IA em `src/ai`.
- Catalogo com 30 agentes declarativos.
- Orquestrador principal com suborquestradores de app, marketing e automacao.
- Edge Function `ai-orchestrator` com dry-run, chamada OpenAI e persistencia.
- Tabelas `ai_factory_runs`, `ai_factory_agent_logs`, `ai_factory_artifacts` e `ai_factory_audit_logs`.
- Aprovacao humana obrigatoria antes de materializar artefatos.

### Sistema White Label

- Configuracao por `clients/<slug>/client.json`.
- `app.config.ts` parametrizado por `EXPO_PUBLIC_*`.
- Tenant lock por `EXPO_PUBLIC_TENANT_SLUG` e `EXPO_PUBLIC_LOCK_TENANT`.
- Scripts `client:create`, `client:validate`, `client:env`, `client:start`, `client:android`, `client:build:android` e `client:submit:android`.
- Control Plane e Data Plane por produto documentados.

### Dashboard

- Console SaaS em `app/(saas)/`.
- Admin web em `app/admin/`.
- Gestao de empresas, planos, assinaturas, usuarios, metricas, fabrica IA e seguranca Supabase.
- RPCs administrativas em `lib/saas-admin.ts`.

### Supabase

- Auth, Postgres, Storage, Realtime, RPCs e Edge Functions.
- RLS multi-tenant e helpers de tenant/empresa/admin.
- Bucket principal `imagens`.
- Health check `/api/system/health`.
- Security Center e auditoria `npm run supabase:audit`.
- Hardening de producao.

### Marketplace

- Produtos de fornecedor.
- Checkout marketplace.
- Pedidos e logistica multi-fornecedor.
- Comissoes, saldos e pagamentos relacionados.

### Autenticacao

- Email/senha via Supabase Auth.
- Role em `profiles`.
- Perfil ativo local.
- Contexto de tenant inicializado por RPC.
- Super admin e admin de empresa controlados por RPC/RLS.

### Templates

- Templates de IA para `servicesApp`, `schedulingApp`, `deliveryApp`, `marketplaceApp`, `ecommerceApp`, `courseApp` e `hotelBookingApp`.
- Selecao baseada em segmento e features.
- Checklist de assets para icone, splash, adaptive icon, notification icon e screenshots.
