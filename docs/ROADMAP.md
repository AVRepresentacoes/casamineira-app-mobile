# Roadmap

## O que ja esta pronto

- Base Expo/React Native com Expo Router.
- Autenticacao Supabase.
- Multi-tenant com helpers, tenant lock e RLS.
- App principal com perfis de cliente, profissional e fornecedor.
- Pedidos, propostas, pagamentos, comissoes e marketplace.
- Dashboard admin/SaaS para empresas, planos, assinaturas, usuarios e metricas.
- Sistema white-label por `clients/<slug>/client.json`.
- Scripts `client:*` para criar, validar, rodar, buildar e publicar apps.
- Control Plane/Data Plane documentado para produtos com Supabase dedicado.
- Fabrica de IA com 30 agentes, orquestradores, dry-run, OpenAI, logs, artefatos e aprovacao humana.
- Edge Functions para pagamentos, webhooks, IA, artefatos, health e exclusao de conta.
- Supabase production hardening, Security Center e auditoria.
- Vertical Hospedagens Caminhos da Fe.
- Integracoes Mercado Pago e Asaas em fluxos de pagamento.

## O que falta

- Ativar billing SaaS real nos adaptadores de `lib/saas-billing.ts`.
- Consolidar publicacao iOS se o foco sair de Android.
- Formalizar worker/fila dedicada para rotinas assicronas sensiveis.
- Expandir Data Planes dedicados para todos os produtos white-label que exigirem isolamento.
- Amadurecer templates para materializacao completa alem de artefatos planejados.
- Completar automacoes WhatsApp/n8n reais conforme provedores escolhidos.
- Aumentar cobertura de testes automatizados de fluxos criticos.
- Fechar monitoramento operacional continuo de Edge Functions, webhooks e billing.

## Prioridades

1. Manter seguranca: RLS, tenant isolation, secrets e service role fora do frontend.
2. Garantir que builds white-label nunca apontem para Control Plane quando exigem Data Plane.
3. Finalizar billing SaaS real.
4. Padronizar publicacao e QA por cliente.
5. Evoluir fabrica IA com artefatos revisaveis e aprovacao humana.
6. Melhorar observabilidade de pagamentos, IA e provisionamento.

## Proximos modulos

- Billing SaaS production-ready.
- Provisionamento guiado de Data Plane dedicado.
- Esteira de publicacao por cliente.
- Painel de runs/provisionamento por produto.
- Automacoes WhatsApp/n8n com credenciais por tenant.
- Biblioteca de templates mais materializavel.
- Monitoramento e alertas de webhooks.
