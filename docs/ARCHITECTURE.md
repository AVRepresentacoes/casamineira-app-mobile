# Arquitetura

## Arquitetura geral

A plataforma usa arquitetura multi-tenant com dois niveis:

- Control Plane: projeto Supabase principal do SaaS. Guarda empresas, planos, assinaturas, produtos, bancos dedicados, runs da IA, auditoria e provisionamento.
- Data Plane por produto: cada produto/app pode apontar para Supabase proprio com Auth, Postgres, Storage, Edge Functions e secrets isolados.

O app e construido em Expo/React Native com Expo Router. O backend principal e Supabase: Postgres, RPCs, RLS, Storage e Edge Functions. A camada `lib/` concentra chamadas do frontend para Supabase, pagamentos, tenant, billing e IA.

## Organizacao das pastas

- `app/`: rotas e telas por dominio.
- `app/(auth)/`: login, cadastro, troca de perfil e onboarding.
- `app/(saas)/`: console SaaS, empresas, fabrica IA e seguranca Supabase.
- `app/admin/`: admin web, planos, assinaturas, empresas, usuarios e metricas.
- `app/apps/`: listagem/criacao/detalhe de apps.
- `app/assinatura/` e `app/pagamento/`: assinatura e retorno de pagamento.
- `app/api/system/health+api.ts`: health check web/server.
- `lib/`: servicos de dominio e adaptadores de acesso.
- `src/ai/agents/`: catalogo de 30 agentes.
- `src/ai/orchestrator/`: orquestrador principal e suborquestradores.
- `src/ai/schemas/`: contratos de briefing, template, arquitetura, marketing, pricing e build.
- `src/ai/templates/`: templates suportados pela fabrica IA.
- `src/ai/tools/`: planejadores de arquivos, templates, pagamentos, build, Supabase, marketing e analytics.
- `supabase/functions/`: Edge Functions.
- `supabase/migrations/`: schema versionado.
- `clients/<slug>/`: configuracao white-label do cliente.
- `scripts/`: automacoes locais de SaaS, client build, auditoria e IA.

## Como frontend conversa com backend

O frontend usa `@supabase/supabase-js` configurado por `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

Padroes:

- CRUD direto em tabelas quando RLS protege a operacao.
- RPCs para contexto, administracao, billing, tenant e operacoes sensiveis.
- `supabase.functions.invoke()` para pagamentos, webhooks indiretamente, IA e artefatos.
- AsyncStorage guarda estado local simples, como perfil ativo.

## Como backend conversa com Supabase

Edge Functions usam `SUPABASE_URL`, `SUPABASE_ANON_KEY` e, quando necessario, `SUPABASE_SERVICE_ROLE_KEY`.

Regras:

- Service role nunca no frontend.
- Edge Functions validam auth, CORS e contexto.
- Operacoes administrativas devem validar usuario/tenant explicitamente.
- RPCs `SECURITY DEFINER` devem usar `set search_path = public`.
- Health check cria client anon e admin client somente no servidor.

## Como agentes se comunicam

Os agentes sao definicoes declarativas com:

- `id`, `order`, `name`, `stage`, `objective`.
- `outputContract`.
- `dependsOn`.
- `capabilities`.
- `run(context)`.

O `context` compartilhado contem `requestId`, `generatedAt`, `dryRun`, input bruto e briefing estruturado. Os agentes nao chamam uns aos outros diretamente; os orquestradores selecionam agentes por grupo e agregam saidas.

## Como funciona a orquestracao

`runMainOrchestrator` cria briefing a partir do prompt, monta contexto e executa:

- `runAppGenerationOrchestrator`: template, arquitetura, build status, arquivos planejados, assets, pagamentos, comando de build e agentes de app.
- `runMarketingOrchestrator`: plano de marketing, assets, analytics e agentes de marketing.
- `runAutomationOrchestrator`: operacoes Supabase planejadas e agentes de automacao/suporte.
- `estimatePricing`: precificacao por quantidade de features e urgencia.

Na Edge Function `ai-orchestrator`, o fluxo pode ser dry-run ou chamada real ao OpenAI. O resultado exige aprovacao humana antes de gerar artefatos materializaveis.

## Como funciona o Template Engine

O schema `selectAppTemplate(segment, features)` escolhe:

- `hotelBookingApp` para hospedagem/hotel/pousada.
- `deliveryApp` para delivery.
- `ecommerceApp` para loja/ecommerce.
- `courseApp` para cursos/educacao.
- `schedulingApp` para agendamento/barbearia.
- `servicesApp` como padrao de servicos locais.

`describeTemplateAssets(template)` aponta para `src/ai/templates/<template>` e exige checklist de icone, splash, adaptive icon, notification icon e screenshots reais.

## Como funciona o sistema White Label

White label e definido por `clients/<slug>/client.json` e variaveis `EXPO_PUBLIC_*`.

Campos centrais:

- `appName`, `appSlug`, `appScheme`.
- `androidPackage`, `iosBundleId`.
- `tenantSlug`, `lockTenant`.
- Cores, assets, dominio, suporte e slogan.
- `backend.requireDedicatedSupabase`, `supabaseUrl`, `supabaseAnonKey`.

`app.config.ts` le essas variaveis para montar nome, slug, scheme, icones, splash, bundle/package e `extra.tenantSlug`.

Quando `tenantLock` esta ativo, o app chama `ensure_app_tenant_context`, valida tenant ativo, fixa o tenant e impede fallback silencioso.

## Como funciona o Dashboard

Ha dois conjuntos principais:

- `app/(saas)/`: console SaaS operacional com empresas, fabrica IA e seguranca Supabase.
- `app/admin/`: administracao de empresas, planos, assinaturas, usuarios e metricas.

O dashboard usa funcoes em `lib/saas-admin.ts`, `lib/saas-commercial.ts`, `lib/saas-growth.ts`, `lib/admin-web.ts` e RPCs como:

- `is_super_admin`.
- `get_saas_empresas_overview`.
- `saas_admin_create_empresa`.
- `saas_admin_update_empresa`.
- `get_active_planos_saas`.
- `get_saas_empresa_detail`.

O Security Center consulta RPC de status e o endpoint `/api/system/health`.
