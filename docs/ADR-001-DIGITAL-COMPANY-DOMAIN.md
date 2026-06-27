# ADR-001 - Digital Company Domain

## Status

Aceita.

## Decisão

Criar a camada de domínio **Digital Company™** como agregadora do estado central da empresa digital do cliente na Casa Mineira SaaS.

A Digital Company™ não é uma tabela nova nesta etapa. Ela é uma composição TypeScript formada a partir das entidades existentes:

- Tenant atual.
- Empresa atual.
- Perfil/papel do usuário atual.
- Business Project™ atual.
- Business DNA™ atual.
- Template atual.
- Plano/assinatura.
- Status operacional.
- Progresso.
- Módulos ativos.
- Recomendações de IA mockadas/seguras.

## Motivo

A plataforma passou a ter vários módulos premium: Business Operating Center™, Business Project™, Business DNA™, Marketplace, AI Copilot™, AI Workforce™, AI Solution Architect™ e Project Review Center™.

Sem uma camada agregadora, cada módulo tende a consultar empresa, tenant, projeto, plano e catálogos de forma própria. Isso aumenta duplicação, risco de inconsistência e custo de manutenção.

A Digital Company™ centraliza a leitura conceitual da empresa digital sem mudar banco, Supabase, autenticação, pagamentos ou Edge Functions.

## Por Que Não Criar Tabela Agora

O projeto já possui infraestrutura real para empresa, tenant, planos, assinaturas e produtos SaaS. A auditoria de backend indicou que Business DNA™, Marketplace Premium e Business Project™ ainda estão parcialmente mockados ou apoiados em estruturas existentes.

Criar uma tabela nova antes de fechar o modelo persistente poderia duplicar dados e gerar migração prematura. Nesta fase, a decisão correta é compor dados existentes e preparar o contrato de domínio.

## Impacto Em Escala

A Digital Company™ permite que novas áreas consumam uma visão única da empresa digital:

- Business Operating Center™ pode exibir estado operacional unificado.
- AI Copilot™ pode receber contexto por empresa/projeto.
- AI Workforce™ pode organizar tarefas e progresso por empresa digital.
- Marketplace e Business DNA™ podem associar escolhas ao projeto atual.
- Billing pode ser lido como parte do domínio, sem misturar lógica de pagamento.

## Impacto Em IA

A IA deve continuar backend-only para execução real. A Digital Company™ fornece apenas contexto seguro para interface, mocks e preparação futura.

Quando a orquestração real for conectada, prompts, chaves e modelos devem permanecer em backend/Edge Functions. O frontend deve enviar apenas referências e contexto autorizado.

## Impacto Multi-Tenant

A camada respeita o tenant atual e não cria bypass de RLS. Ela reutiliza serviços existentes que já dependem do contexto multi-tenant.

No futuro, a Digital Company™ deve ser a fronteira conceitual para garantir que cada tela opere sempre dentro da empresa/tenant correto.

## Próximos Passos

1. Registrar `DigitalCompanyProvider` no layout autenticado.
2. Migrar Business Operating Center™ para `useDigitalCompany()`.
3. Migrar AI Copilot™ e AI Workforce™ para consumir contexto da Digital Company™.
4. Persistir Business DNA™, Templates e Business Project™ em schema oficial quando aprovado.
5. Adicionar testes de isolamento por tenant antes de produção SaaS real.
