# Workflows

## Fluxo principal

Login
↓
Dashboard
↓
Novo Projeto
↓
Escolha de Template
↓
IA
↓
Build
↓
Entrega

## Login

1. Usuario acessa rota de autenticacao.
2. Supabase Auth cria/recupera sessao.
3. App busca role em `profiles`.
4. Perfil ativo e salvo localmente quando necessario.
5. Tenant e inicializado por RPC.
6. Usuario e redirecionado para dashboard conforme papel/permissao.

## Dashboard

1. Dashboard carrega contexto da empresa/tenant.
2. Guardas validam super admin, admin de empresa, profissional ou fornecedor.
3. Dados sao obtidos via RPCs e queries com RLS.
4. Admin SaaS gerencia empresas, planos, assinaturas, metricas, IA e seguranca.

## Novo Projeto

1. Super admin cria empresa/tenant no SaaS.
2. Define slug, status, plano, assinatura, branding e admin.
3. Opcionalmente abre a fabrica de IA para gerar app white-label.
4. Produto e registrado no Control Plane quando exige Data Plane dedicado.

## Escolha de Template

1. O briefing informa segmento e features.
2. `selectAppTemplate` escolhe template.
3. Templates suportados: servicos, agendamento, delivery, marketplace, ecommerce, cursos e hospedagens.
4. Assets obrigatorios sao listados para revisao manual.

## IA

1. Admin envia prompt na fabrica IA.
2. Edge Function `ai-orchestrator` executa dry-run ou OpenAI.
3. Resultado contem briefing, app generation, marketing, automation, pricing e agentes.
4. Run e logs sao persistidos.
5. Aprovacao humana e obrigatoria antes de gerar artefatos.

## Build

1. Apos aprovacao, `ai-factory-artifacts` gera artefatos.
2. Operador exporta/materializa em `clients/<slug>/`.
3. `client:validate` verifica manifesto.
4. `client:start`, `client:android` ou `client:ios` testam o app.
5. `client:build:android` ou equivalente cria build de producao.

## Entrega

1. Build validado e enviado para loja ou entregue ao cliente.
2. Tenant/banco/provedores ficam documentados no Control Plane.
3. Suporte, faturamento e status sao acompanhados no dashboard.

## Fluxo de publicacao

1. Revisar assets, textos, politica de privacidade e screenshots.
2. Rodar checks locais quando aplicavel.
3. Garantir envs do cliente e Supabase correto.
4. Gerar build EAS.
5. Submeter Android/iOS.
6. Registrar status e proximas acoes no dashboard/docs operacionais.

## Fluxo de pagamento

1. Usuario solicita checkout/Pix/cartao no app.
2. Frontend chama Edge Function do provedor.
3. Provedor retorna URL, QR Code ou status.
4. Registro em `pagamentos` e eventos operacionais.
5. Webhook confirma, recusa ou atualiza status.
6. Comissoes, saldos e entregas seguem o dominio do produto.

## Fluxo de assinatura

1. Empresa recebe plano em `planos_saas`.
2. Assinatura e registrada em `assinaturas_saas`.
3. Status, trial, limites e beneficios sao expostos por RPCs.
4. Billing SaaS tem adaptador previsto para Mercado Pago, Stripe, Asaas ou manual.
5. Historico fica em `assinaturas_saas_historico`.
6. A aplicacao aplica limites por plano via funcoes SaaS.
