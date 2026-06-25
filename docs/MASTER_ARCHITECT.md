# Master Architect

Documento mestre de arquitetura estrategica da Casa Mineira SaaS.

Este arquivo e a referencia principal para decisoes tecnicas futuras. Antes de tarefas grandes, consulte este documento e os arquivos oficiais em `/docs` antes de abrir codigo-fonte.

## 1. Visao do produto

A Casa Mineira SaaS e uma plataforma web/SaaS para criacao, operacao e publicacao de aplicativos white-label com apoio de IA.

O produto deve permitir que clientes e operadores criem novos aplicativos a partir de templates, configurem branding, definam planos, acompanhem assinaturas, revisem artefatos gerados por IA e publiquem apps Android/iOS com controle humano.

A plataforma nao deve ser tratada apenas como um app mobile. Ela e o Control Plane comercial e operacional que organiza clientes, produtos, templates, IA, billing, seguranca, publicacao e monitoramento.

## 2. Separacao de produtos

Existem dois produtos que devem permanecer separados em conceito, rotas, branding, login, dashboard e comunicacao.

### Casa Mineira SaaS

Casa Mineira SaaS e a plataforma web para clientes criarem, operarem e publicarem aplicativos com IA.

Responsabilidades:

- Login e onboarding de clientes SaaS, admins e super admins.
- Dashboard comercial e operacional.
- Criacao de projetos/apps.
- Catalogo e marketplace de templates.
- Fabrica de IA.
- Billing SaaS.
- Gestao de empresas, planos, assinaturas, publicacao e seguranca.
- Control Plane e registros de Data Planes dedicados.

### Casa Mineira Servicos

Casa Mineira Servicos e um app mobile/white-label de servicos locais.

Responsabilidades:

- Experiencia de cliente final.
- Perfis de cliente, profissional e fornecedor.
- Pedidos, propostas, chat, marketplace local e pagamentos.
- Branding de app final.
- Fluxos mobile de servicos locais.

### Regra de separacao

- Login SaaS nao deve ser confundido com login do app final.
- Dashboard SaaS nao deve ser confundido com area operacional do app de servicos.
- Branding do SaaS deve comunicar plataforma criadora de apps.
- Branding do app Casa Mineira Servicos deve comunicar marketplace/servicos locais.
- Rotas SaaS, rotas admin e rotas mobile devem preservar fronteiras claras.
- Comunicacao externa deve diferenciar "crie seu app com IA" de "contrate servicos locais".

## 3. Principios de arquitetura

- IA sempre backend-only: chamadas a modelos, prompts sensiveis e chaves devem ficar em Edge Functions/backend.
- Service role nunca no frontend.
- Multi-tenant seguro e obrigatorio em toda area compartilhada.
- RLS obrigatorio para tabelas sensiveis e multi-tenant.
- Templates antes de geracao do zero.
- Aprovacao humana obrigatoria antes de materializar artefatos, buildar ou publicar apps.
- Logs sem dados sensiveis, secrets, tokens, chaves, documentos pessoais ou payloads completos de pagamento.
- Evolucao modular: cada modulo deve crescer sem misturar SaaS, app final, billing, IA e marketplace.
- Baixo consumo de tokens: usar `/docs` como memoria oficial e abrir codigo apenas quando necessario.
- Control Plane nao deve ser usado como banco de produto final quando o cliente exige Data Plane dedicado.
- Pagamentos, autenticacao, Supabase e IA sao areas criticas: qualquer mudanca exige escopo explicito.
- Publicacao deve ser reversivel, auditavel e revisada por humano.

## 4. Arquitetura atual

### Frontend e app

- Expo Router organiza rotas.
- React Native/Web entrega mobile e web.
- TypeScript e a linguagem base.
- Expo/EAS suporta build e publicacao mobile.

### Backend e dados

- Supabase e o backend principal.
- Supabase Auth gerencia autenticacao.
- Postgres guarda dados operacionais, SaaS, IA, marketplace, billing e tenants.
- RLS protege tabelas sensiveis e multi-tenant.
- RPCs concentram contexto de tenant, empresa, admin, billing e operacoes sensiveis.
- Storage usa bucket principal `imagens`.
- Edge Functions tratam IA, pagamentos, webhooks, health, artefatos e exclusao de conta.

### Control Plane e Data Plane

- Control Plane: projeto Supabase principal do SaaS, com empresas, planos, assinaturas, produtos, bancos dedicados, IA, auditoria e provisionamento.
- Data Plane: projeto Supabase dedicado por produto/app quando isolamento for necessario.
- Builds white-label com banco dedicado nao devem apontar para o Control Plane.

### White Label

- Configuracao por `clients/<slug>/client.json`.
- Variaveis `EXPO_PUBLIC_*` definem app name, slug, scheme, bundle, package, tenant e assets.
- `tenantLock` fixa o app ao tenant correto.
- Scripts `client:*` criam, validam, rodam, buildam e publicam clientes.

### Fabrica de IA

- Fabrica IA possui dry-run, chamada OpenAI, persistencia, logs, artefatos e auditoria.
- Existem 30 agentes declarativos.
- Orquestradores: Main, App Generation, Marketing e Automation.
- A saida da IA gera briefing, app generation, marketing, automation, pricing e agent summaries.
- Artefatos white-label incluem `client.json`, `provision.sql` e manifesto.

### Marketplace, pagamentos e seguranca

- Marketplace inclui fornecedores, produtos, pedidos, checkout, comissoes e saldos.
- Pagamentos usam Mercado Pago e Asaas em fluxos atuais; Stripe esta previsto em dependencias/adaptadores.
- Security Center e `/api/system/health` verificam banco, Supabase, Storage, Auth, Edge Functions, IA, tokens e seguranca.

## 5. Arquitetura alvo

A arquitetura alvo transforma a Casa Mineira SaaS em uma plataforma premium de criacao assistida de apps.

Componentes desejados:

- Marketplace de templates prontos, revisados e versionados.
- Gerador de apps assistido por IA, com briefing guiado e recomendacoes controladas.
- Painel web premium para clientes SaaS e operadores.
- Billing SaaS real com planos, trials, assinatura, status e inadimplencia.
- Publicacao Android/iOS padronizada por cliente.
- Templates materializaveis, nao apenas planejados.
- Data Plane dedicado por cliente/produto quando necessario por seguranca, escala ou contrato.
- Automacoes WhatsApp/n8n com credenciais por tenant.
- Monitoramento e alertas para webhooks, pagamentos, IA, provisionamento e publicacao.
- Esteira de QA e publicacao com checklists obrigatorios.
- Auditoria operacional por run/produto/cliente.

## 6. Regras permanentes para o Codex

- Nunca analisar o projeto inteiro sem autorizacao explicita.
- Sempre consultar `docs/MASTER_ARCHITECT.md` antes de tarefas grandes.
- Consultar a memoria oficial em `/docs` antes de abrir codigo-fonte.
- Abrir apenas arquivos necessarios ao escopo da tarefa.
- Alterar apenas arquivos permitidos no prompt.
- Nao modificar autenticacao, Supabase, pagamentos ou IA fora do escopo.
- Nao atualizar dependencias sem pedido explicito.
- Nao refatorar globalmente sem autorizacao.
- Nao misturar Casa Mineira SaaS com Casa Mineira Servicos.
- Sempre listar arquivos alterados.
- Sempre informar riscos.
- Sempre informar verificacoes feitas ou nao feitas.
- Sempre aguardar aprovacao antes de seguir para proxima etapa quando a tarefa pedir planejamento, faseamento ou risco alto.
- Em tarefas documentais, nao executar testes, auditorias ou analises de codigo sem pedido explicito.

## 7. Estrategia de economia de tokens

- Trabalhar por modulos pequenos e independentes.
- Evitar auditorias completas.
- Usar `/docs` como memoria oficial permanente.
- Usar prompts pequenos, objetivos e especificos.
- Nunca pedir nem executar refatoracoes globais sem necessidade real.
- Atualizar docs apenas quando houver decisao arquitetural ou mudanca relevante.
- Preferir leitura de documentos oficiais antes de arquivos de implementacao.
- Em codigo, abrir somente entrada, dependencia direta e teste relacionado.
- Parar a leitura assim que o contexto for suficiente.
- Registrar novas decisoes em documentos curtos para evitar reanalise futura.

## 8. Roadmap executivo

### Fase 1: Produto vendavel

Objetivo: deixar a Casa Mineira SaaS clara como plataforma comercial.

Entregas:

- Separacao definitiva entre SaaS web e app mobile de servicos.
- Login SaaS mais profissional.
- Dashboard SaaS comercial.
- Catalogo inicial de templates.
- Fluxo de venda assistida com briefing e simulacao.
- Branding SaaS consistente.

### Fase 2: Marketplace de templates

Objetivo: transformar templates em ativos comerciais.

Entregas:

- Biblioteca de templates por segmento.
- Preview e descricao comercial de cada template.
- Regras de features, assets e precificacao por template.
- Versionamento e criterios de qualidade.
- Base para templates materializaveis.

### Fase 3: Gerador de apps assistido

Objetivo: tornar a fabrica IA um fluxo guiado e revisavel.

Entregas:

- Briefing assistido.
- Selecao de template recomendada por IA.
- Geração de arquitetura, marketing, automacoes e pricing.
- Aprovacao humana por etapa.
- Artefatos materializaveis com seguranca.
- Baixo consumo de IA por uso de templates e cache documental.

### Fase 4: Billing e publicacao

Objetivo: fechar monetizacao e entrega.

Entregas:

- Billing SaaS real.
- Checkout/assinatura por plano.
- Status de trial, ativo, inadimplente e cancelado.
- Publicacao Android/iOS padronizada.
- Esteira de QA, assets, politicas e screenshots.
- Historico de publicacao por cliente.

### Fase 5: Escala Enterprise

Objetivo: suportar clientes maiores e operacao robusta.

Entregas:

- Data Plane dedicado por cliente quando necessario.
- Monitoramento e alertas.
- Automacoes WhatsApp/n8n por tenant.
- Auditoria avancada.
- Controles de acesso mais granulares.
- Observabilidade de IA, webhooks, pagamentos e provisionamento.
- Playbooks de incidentes e rotacao de chaves.

## 9. Prioridades imediatas

1. Separar definitivamente SaaS web e app mobile.
2. Melhorar login SaaS.
3. Criar dashboard SaaS comercial.
4. Criar catalogo de templates prontos.
5. Preparar fluxo de venda assistida.
6. Implementar billing real.
7. Reduzir consumo de IA com templates, dry-run, cache e memoria oficial.
8. Revisar rotas e branding para evitar mistura entre plataforma e app final.

## 10. Criterios de qualidade

- Responsividade web em desktop e mobile.
- Experiencia SaaS profissional, clara e comercial.
- Seguranca como criterio de aceite.
- Isolamento por tenant validado.
- RLS aplicado em tabelas sensiveis e multi-tenant.
- Conformidade LGPD em privacidade, exclusao, logs e dados pessoais.
- Testes basicos nos fluxos criticos alterados.
- Deploy sem quebrar producao.
- Backward compatibility para apps white-label existentes.
- Service role ausente do frontend.
- IA sem expor prompt sensivel, token ou secret ao cliente.
- Pagamentos com webhook, status e erro tratados.
- Publicacao somente apos revisao humana.

## Decisao central

A Casa Mineira SaaS deve evoluir como plataforma web premium de criacao de apps com IA. A Casa Mineira Servicos deve permanecer como produto/app final de servicos locais. Toda decisao tecnica futura deve preservar essa separacao.
