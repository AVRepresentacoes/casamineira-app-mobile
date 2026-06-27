# System Architecture

## Visao geral

A Casa Mineira SaaS e uma plataforma web/SaaS para criacao, operacao e publicacao de empresas digitais com IA.

A arquitetura deve manter separacao clara entre:

- plataforma SaaS web;
- aplicativo mobile/white-label Casa Mineira Servicos;
- backend Supabase;
- Edge Functions;
- catalogos de Business DNA e templates;
- camada de dominio Digital Company;
- camada estrategica Enterprise Intelligence Fabric.

## Frontend

O frontend concentra a experiencia premium da plataforma:

- landing publica;
- login;
- cadastro;
- recuperacao de senha;
- dashboard/Business Operating Center;
- Business Studio;
- Business DNA;
- Marketplace;
- Business Project;
- AI Copilot;
- AI Workforce;
- AI Solution Architect;
- Project Review Center.

Regras:

- a interface deve ser web-first;
- componentes compartilhados devem ser reutilizados;
- areas publicas e autenticadas devem permanecer separadas;
- rotas publicas nao devem depender de estado autenticado;
- rotas autenticadas devem considerar tenant, empresa e projeto atual.

## Backend

O backend oficial e composto por:

- Supabase Auth;
- PostgreSQL;
- Row Level Security;
- Edge Functions;
- RPCs seguras;
- Storage;
- servicos server-side para IA, pagamentos, webhooks e operacoes sensiveis.

Regras:

- service role nunca pode ir para o frontend;
- chamadas sensiveis devem acontecer no backend ou Edge Functions;
- logs nao devem conter dados sensiveis;
- operacoes destrutivas devem exigir contexto de tenant e permissao.

## Supabase

Supabase e a base operacional da plataforma.

Responsabilidades:

- autenticacao;
- perfis;
- tenants;
- empresas;
- relacao usuario-empresa;
- assinaturas;
- billing;
- produtos SaaS;
- auditoria;
- storage;
- funcoes auxiliares;
- RLS.

Supabase deve ser tratado como Control Plane inicial da plataforma, enquanto Data Planes dedicados podem ser criados para clientes enterprise quando necessario.

## IA

A IA deve seguir arquitetura backend-only.

O frontend pode:

- exibir recomendacoes;
- solicitar analises;
- mostrar progresso;
- apresentar resultados;
- coletar aprovacoes humanas.

O frontend nao deve:

- chamar modelos diretamente;
- armazenar chaves de IA;
- executar prompts sensiveis;
- expor service role;
- publicar artefatos sem aprovacao.

## Marketplace

O Marketplace e a vitrine de templates premium.

Responsabilidades:

- expor templates por segmento;
- relacionar templates a Business DNA;
- acelerar criacao de Business Projects;
- preparar monetizacao futura;
- permitir visualizacao publica controlada.

No futuro, o Marketplace deve suportar:

- avaliacao;
- downloads;
- instalacoes;
- licenciamento;
- compra;
- receita compartilhada;
- publicacao de parceiros.

## Business DNA

Business DNA e o modelo de negocio materializavel por nicho.

Ele define:

- fluxos;
- modulos;
- estrutura de dados;
- automacoes;
- layout;
- integracoes;
- regras comerciais;
- recomendacoes de IA.

Templates devem nascer de um Business DNA ou estar vinculados a ele.

## ERP

O ERP deve emergir como modulo operacional da Digital Company.

Modulos previstos:

- financeiro;
- clientes;
- fornecedores;
- estoque;
- pedidos;
- contratos;
- documentos;
- relatorios;
- equipe;
- permissoes.

O ERP nao deve ser criado como produto separado sem relacao com Business Project.

## CRM

O CRM deve ser integrado ao Growth e Operations.

Responsabilidades:

- leads;
- clientes;
- oportunidades;
- funil;
- campanhas;
- historico de relacionamento;
- automacoes.

## Billing

Billing deve controlar:

- planos;
- assinaturas;
- trial;
- consumo;
- recursos por plano;
- eventos de pagamento;
- inadimplencia;
- upgrades;
- downgrades.

Regras:

- billing SaaS deve ser real antes de escala comercial;
- webhooks precisam de validacao forte;
- mudancas de plano devem respeitar tenant.

## Deploy

Deploy representa publicacao e entrega da empresa digital.

Alvos:

- web;
- painel admin;
- Android;
- iOS;
- white-label;
- ambientes dedicados.

Toda publicacao deve passar por:

- blueprint;
- review;
- aprovacao humana;
- checklist;
- logs;
- rollback quando aplicavel.

## Analytics

Analytics deve medir:

- uso da plataforma;
- progresso de projetos;
- uso de IA;
- custo estimado;
- publicacoes;
- conversao comercial;
- templates populares;
- saude do tenant;
- produtividade dos agentes.

Analytics deve respeitar LGPD e isolamento por tenant.

## Control Plane

O Control Plane gerencia:

- usuarios;
- tenants;
- planos;
- projetos;
- catalogos;
- IA;
- billing;
- governanca;
- publicacao.

## Data Plane

O Data Plane executa ou armazena dados de uma empresa digital especifica.

Pode ser:

- compartilhado com isolamento por RLS;
- dedicado por cliente enterprise;
- white-label;
- conectado a automacoes externas.

## Integracoes externas

Integracoes previstas:

- WhatsApp;
- n8n;
- gateways de pagamento;
- Google;
- Meta;
- ferramentas de SEO;
- analytics;
- publicacao mobile;
- provedores de deploy.

Toda integracao deve possuir:

- owner claro;
- credenciais seguras;
- logs;
- limites;
- fallback;
- documentacao.
