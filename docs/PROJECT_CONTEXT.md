# Contexto do Projeto

## Objetivo da plataforma

A Casa Mineira SaaS e uma plataforma multi-tenant para vender, operar e publicar aplicativos white-label de servicos locais, marketplace, hospedagem, delivery, ecommerce, cursos e agendamentos.

O produto central combina:

- Aplicativo mobile/web em Expo e React Native.
- Control Plane SaaS para empresas, planos, assinaturas e produtos.
- Data Planes isolados por produto quando o cliente exige app e Supabase dedicados.
- Fabrica de IA com aprovacao humana para planejar aplicativos, gerar artefatos e preparar publicacao.

## O que e a Casa Mineira SaaS

E um SaaS de criacao e operacao de aplicativos. O app principal atende clientes, profissionais, fornecedores e administradores. A camada SaaS permite criar empresas/tenants, configurar branding, planos, white label, marketplace e apps proprios.

## Publico-alvo

- Empresas locais que precisam de aplicativo proprio.
- Profissionais e fornecedores de servicos.
- Clientes finais que fazem pedidos, reservas, compras e pagamentos.
- Super admins da Casa Mineira que operam tenants, planos, assinaturas, IA e publicacao.
- Parceiros white-label que precisam de app com marca propria.

## Principais funcionalidades

- Autenticacao por email/senha via Supabase Auth.
- Perfis de cliente, profissional e fornecedor.
- Pedidos, propostas, chat, pagamentos, comissoes e reputacao.
- Marketplace de produtos de fornecedores.
- Dashboard SaaS para empresas, planos, usuarios, metricas, seguranca e billing.
- White label por tenant com app name, slug, icones, cores, dominio e tenant lock.
- Fabrica de IA para briefing, estrategia, app generation, marketing, automacao, precificacao e artefatos.
- Edge Functions para pagamentos, webhooks, IA, exclusao de conta e health checks.
- Storage Supabase para imagens.
- Publicacao Android via Expo/EAS e scripts `client:*`.

## Tecnologias utilizadas

- Expo SDK 54, React 19, React Native 0.81, Expo Router.
- TypeScript.
- Supabase Auth, Postgres, Storage, Realtime, RPCs, Edge Functions e RLS.
- Mercado Pago, Asaas e Stripe como provedores previstos/ativos por fluxo.
- Firebase para notificacoes/recursos auxiliares.
- EAS Build/Submit para mobile.
- Vercel/export web para web.
- OpenAI Responses API na Edge Function da fabrica de IA.
- Recharts para graficos.

## Estrutura geral do projeto

- `app/`: rotas Expo Router para auth, cliente, profissional, fornecedor, admin, SaaS, apps, assinatura e pagamento.
- `components/`: componentes reutilizaveis de UI, admin, site, gas e fluxos rapidos.
- `lib/`: acesso a Supabase, tenant, auth, pagamentos, billing, marketplace, IA, admin e observabilidade.
- `contexts/`: contexto de empresa/tenant.
- `hooks/`: guards de permissao e branding.
- `src/ai/`: agentes, orquestradores, schemas, templates e ferramentas da fabrica de IA.
- `supabase/`: migrations e Edge Functions.
- `clients/`: manifestos white-label por cliente.
- `scripts/`: automacao local para clientes, fabrica IA, auditoria e smoke de seguranca.
- `docs/`: documentacao operacional e memoria oficial.

## Fluxo principal do usuario

1. Usuario entra no app e autentica.
2. O app inicializa o tenant via RPC de contexto.
3. Usuario escolhe/usa papel ativo: cliente, profissional ou fornecedor.
4. Cliente cria pedido, compra, reserva ou assinatura conforme vertical.
5. Profissional/fornecedor recebe demandas, propostas, pedidos e pagamentos.
6. Pagamentos sao criados via Edge Functions e reconciliados por webhooks.
7. Dados sao filtrados por tenant, papel e RLS.

## Fluxo principal da IA

1. Admin acessa `/(saas)/fabrica-ia`.
2. Envia prompt com briefing do app.
3. Frontend chama `supabase.functions.invoke("ai-orchestrator")`.
4. Edge Function valida usuario, tenant e CORS.
5. Em dry-run gera plano local; com `OPENAI_API_KEY` chama OpenAI.
6. Resultado e salvo em `ai_factory_runs` e logs em tabelas relacionadas.
7. Admin aprova/rejeita a run.
8. Apos aprovacao, `ai-factory-artifacts` gera `client.json`, `provision.sql` e manifesto.
9. Export local e build continuam manuais.

## Fluxo de criacao de aplicativos

1. Criar briefing ou run da fabrica IA.
2. Selecionar template: `servicesApp`, `schedulingApp`, `deliveryApp`, `marketplaceApp`, `ecommerceApp`, `courseApp` ou `hotelBookingApp`.
3. Gerar/revisar artefatos white-label.
4. Materializar em `clients/<slug>/`.
5. Validar manifesto e ambiente com `client:validate`.
6. Provisionar tenant/banco.
7. Rodar/testar app do cliente.
8. Build e submit via scripts `client:*` e EAS.

## Fluxo de autenticacao

1. Supabase Auth gerencia sessao.
2. App usa anon key publica.
3. Service role e restrita a Edge Functions, scripts controlados e health/admin server-side.
4. Apos login, `ensure_current_user_tenant_context` ou `ensure_app_tenant_context` define tenant.
5. `tenantLock` impede fallback para outro tenant em apps white-label.
6. Permissoes sao reforcadas por RPCs, roles e RLS.

## Fluxo de pagamento

1. Usuario inicia pagamento no app.
2. Cliente chama Edge Function de Mercado Pago ou Asaas.
3. Edge Function cria Pix, cartao, preference ou checkout.
4. Registro fica em `pagamentos` e tabelas de pedidos/comissoes quando aplicavel.
5. Webhook do provedor atualiza status.
6. Fluxos de marketplace, gas, hospedagens e assinaturas usam funcoes/tabelas especificas.
