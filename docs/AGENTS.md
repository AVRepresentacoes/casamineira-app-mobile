# Agentes

Todos os agentes recebem `AiFactoryContext` e retornam `AgentOutput` com `summary`, `recommendations` e `artifacts`. A entrada comum vem do briefing estruturado; a saida comum e um artefato por agente. O orquestrador responsavel varia por grupo.

| Nome do agente | Objetivo | Entrada | Saida | Ferramentas utilizadas | Orquestrador responsavel |
| --- | --- | --- | --- | --- | --- |
| Briefing Agent | Transformar fala/texto em briefing estruturado. | Prompt, tenant, usuario, contexto IA. | Briefing com app, segmento, publico, features, cores, urgencia e orcamento. | `briefingSchema`, extracao de requisitos. | Main + App Generation |
| Market Research Agent | Analisar nicho, concorrentes e oportunidades. | Briefing. | Relatorio de mercado e oportunidades. | Benchmark, analise de nicho. | Main + Marketing |
| Business Strategy Agent | Criar modelo de negocio, monetizacao e crescimento. | Briefing e pesquisa. | Estrategia de negocio e monetizacao. | Posicionamento, receita, crescimento. | Main + Marketing |
| Product Manager Agent | Transformar briefing em roadmap e MVP. | Briefing e estrategia. | Roadmap e escopo MVP. | Priorizacao, roadmap. | Main + App Generation |
| UX Research Agent | Definir jornada, dores e fluxos. | Briefing e roadmap. | Mapa de jornada e fluxos. | Jornada do usuario. | App Generation |
| UI Designer Agent | Criar direcao visual, telas e componentes. | UX, branding e briefing. | Direcao visual e componentes. | Wireframes, design system. | App Generation |
| Branding Agent | Criar nome, slogan, identidade e tom de voz. | Briefing e estrategia. | Kit inicial de marca. | Naming, slogan, identidade. | App Generation |
| Copywriter Agent | Criar textos comerciais multicanal. | Branding e estrategia. | Copies para app, landing, anuncios e notificacoes. | Copy, emails, notificacoes. | Marketing |
| React Native Agent | Planejar app mobile Expo/React Native. | Produto e UI. | Plano de implementacao mobile. | Expo, React Native, navegacao. | App Generation |
| Next.js Agent | Planejar painel web, landing e admin. | Produto e UI. | Plano web/admin. | Landing, dashboard, admin web. | App Generation |
| Backend Agent | Planejar regras, endpoints, auth e webhooks. | Roadmap/produto. | Mapa de backend e endpoints. | Edge Functions, regras, webhooks. | App Generation |
| Database Agent | Planejar tabelas, relacoes, migrations e seguranca. | Produto e backend. | Modelo de dados planejado. | Postgres, migrations, seeds. | App Generation |
| Supabase Agent | Configurar Auth, Storage, RLS, Realtime e queries. | Modelo de dados. | Plano Supabase seguro. | Auth, Storage, RLS, Realtime. | App Generation |
| API Integration Agent | Integrar APIs externas. | Backend. | Mapa de integracoes. | OpenAI, pagamentos, WhatsApp, maps, email. | App Generation + Automation |
| Payment Agent | Planejar Pix, cartao, assinaturas e webhooks. | Backend e integracoes. | Plano de pagamentos. | Payment tools, provedores, webhooks. | App Generation |
| WhatsApp Automation Agent | Criar fluxos de atendimento/cobranca/suporte. | Copy e integracoes. | Fluxos WhatsApp. | Automacao WhatsApp. | Automation |
| n8n Automation Agent | Criar automacoes com webhooks, CRM e notificacoes. | Backend e WhatsApp. | Fluxos n8n planejados. | Webhooks, CRM, email, planilhas. | Automation |
| QA Tester Agent | Testar telas, auth, pagamentos e erros. | Mobile, backend e payment. | Checklist QA. | Testes funcionais/regressao. | App Generation |
| Security Agent | Revisar RLS, permissoes, secrets e LGPD. | Database, Supabase e integracoes. | Checklist de seguranca. | RLS, LGPD, secrets. | App Generation |
| DevOps Agent | Preparar build, deploy, env, EAS e logs. | QA e seguranca. | Plano DevOps e checklist build. | EAS, deploy, env vars. | App Generation |
| Google Play Agent | Preparar publicacao Android. | DevOps e legal. | Checklist Google Play. | Play Store, Data Safety, screenshots. | App Generation |
| App Store Agent | Preparar publicacao Apple. | DevOps e legal. | Checklist App Store. | App Store, privacidade, review. | App Generation |
| Legal Agent | Gerar termos, privacidade, LGPD e contratos basicos. | Briefing e seguranca. | Documentos legais iniciais. | Termos, LGPD, contratos. | App Generation |
| SEO Agent | Criar estrategia SEO e paginas otimizadas. | Pesquisa e copy. | Plano SEO. | Keywords, metatags, artigos. | Marketing |
| Social Media Agent | Criar calendario editorial e posts. | Copy e SEO. | Calendario social. | Posts, stories, carrosseis. | Marketing |
| Paid Traffic Agent | Criar campanhas pagas. | Pesquisa e copy. | Plano de trafego pago. | Google Ads, Meta Ads, publicos. | Marketing |
| Video Content Agent | Criar roteiros e prompts de video. | Copy e social media. | Roteiros/prompts de video. | Video curto, anuncios, narracao. | Marketing |
| Customer Support Agent | Criar chatbot, FAQ e triagem. | Briefing e WhatsApp. | Base de suporte e FAQ. | FAQ, chatbot, respostas. | Automation |
| Financial Pricing Agent | Calcular preco, margem, mensalidade e viabilidade. | Produto e pagamentos. | Precificacao e viabilidade. | Pricing schema, custos e margem. | Main |
| Growth Analytics Agent | Analisar funil, conversao, retencao, CAC e LTV. | Estrategia e pricing. | Plano de metricas e crescimento. | Analytics tools, funil, CAC/LTV. | Marketing |

## Orquestradores

- Main Orchestrator: cria briefing, catalogo de agentes, app generation, marketing, automation e pricing.
- App Generation Orchestrator: seleciona agentes de produto/engenharia/qualidade/publicacao/legal.
- Marketing Orchestrator: seleciona pesquisa, estrategia, copy, SEO, social, trafego, video e growth.
- Automation Orchestrator: seleciona integracoes, WhatsApp, n8n e suporte.
