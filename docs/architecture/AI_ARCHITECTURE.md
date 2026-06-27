# AI Architecture

## Principio central

A IA da Casa Mineira SaaS deve funcionar como uma equipe de especialistas, nao como um chat isolado.

Ela deve apoiar a criacao, revisao, operacao, crescimento e publicacao de empresas digitais.

## Regras obrigatorias

- IA real somente no backend, servidor ou Edge Functions.
- Nenhuma chave de modelo pode estar no frontend.
- Service role nunca deve ser exposta.
- Toda acao relevante deve estar associada a tenant, usuario e Business Project.
- Toda publicacao deve exigir aprovacao humana.
- Custos e tokens devem ser estimados antes de execucoes pesadas.
- Logs devem evitar dados sensiveis.
- Templates e Business DNA devem vir antes de geracao do zero.

## AI CEO

Responsabilidade:

- orientar estrategia geral da Digital Company;
- priorizar objetivos;
- avaliar maturidade do negocio;
- sugerir proximas decisoes;
- alinhar produto, receita, operacao e crescimento.

Entrada:

- contexto da Digital Company;
- plano;
- Business Project;
- metricas;
- progresso;
- objetivos do usuario.

Saida:

- prioridades executivas;
- recomendacoes;
- riscos;
- plano de acao.

## AI CTO

Responsabilidade:

- avaliar arquitetura tecnica;
- orientar escolhas de modulos;
- revisar Blueprint;
- estimar complexidade;
- apoiar publicacao e escala.

Saida:

- arquitetura recomendada;
- riscos tecnicos;
- dependencias;
- plano de implementacao.

## AI CFO

Responsabilidade:

- avaliar custo;
- estimar uso de IA;
- analisar viabilidade financeira;
- sugerir plano;
- apoiar billing e precificacao.

Saida:

- estimativa de custo;
- estimativa de retorno;
- alertas financeiros;
- recomendacao de plano.

## AI CMO

Responsabilidade:

- orientar posicionamento;
- sugerir campanhas;
- apoiar SEO;
- criar estrategia de aquisicao;
- conectar Growth Center ao Business Project.

Saida:

- proposta de valor;
- canais prioritarios;
- campanhas;
- landing pages;
- calendario de conteudo.

## AI Architect

Responsabilidade:

- transformar ideia em Blueprint;
- selecionar Business DNA;
- sugerir templates;
- escolher modulos;
- definir integracoes;
- preparar revisao do projeto.

Saida:

- Blueprint;
- requisitos;
- arquitetura;
- modulos;
- cronograma;
- plano recomendado.

## AI Workforce

AI Workforce representa a equipe operacional de agentes.

Especialistas previstos:

- Business Consultant;
- Solution Architect;
- UX/UI Designer;
- Frontend Engineer;
- Backend Engineer;
- Mobile Engineer;
- Database Engineer;
- QA Engineer;
- DevOps Engineer;
- Security Engineer;
- Marketing Strategist;
- SEO Specialist;
- Copywriter;
- Analytics Specialist;
- Publishing Specialist;
- Customer Success.

Cada agente deve possuir:

- papel;
- status;
- tarefa atual;
- progresso;
- historico;
- custo estimado;
- dependencia de aprovacao quando aplicavel.

## AI Copilot

Responsabilidade:

- acompanhar o usuario em todas as areas autenticadas;
- explicar proximas acoes;
- sugerir melhorias;
- interpretar contexto do projeto;
- apontar riscos;
- reduzir friccao operacional.

Limites:

- nao deve executar acoes criticas sozinho;
- nao deve expor prompts sensiveis;
- nao deve aparecer como funcionalidade real quando estiver usando mock sem indicar contexto interno adequado.

## AI Builder

Responsabilidade:

- personalizar Business DNA existente;
- adaptar templates;
- sugerir modulos;
- reduzir tempo e custo de criacao;
- evitar geracao total do zero.

O AI Builder deve sempre trabalhar a partir de:

1. Business DNA.
2. Template.
3. Blueprint.
4. Aprovacao humana.
5. Build.

## AI Orchestration Core

Camada responsavel por:

- criar tarefas;
- atribuir agentes;
- simular ou executar workflows;
- estimar tokens;
- estimar custo;
- solicitar aprovacao humana;
- registrar resultado.

Enquanto estiver no frontend, deve ser mock-only.

Execucao real deve migrar para backend-only.

## Enterprise Intelligence Fabric

O EIF fornece contexto estrategico para a IA:

- tenant;
- empresa;
- usuario;
- Business Project;
- Business DNA;
- template;
- plano;
- assinatura;
- marketplace;
- deploys;
- analytics;
- agentes.

O EIF nao e IA. Ele e a malha de contexto usada pela IA e pela plataforma.

## Fluxo ideal

1. Usuario descreve a ideia.
2. AI Architect sugere Business DNA.
3. Marketplace sugere template.
4. AI Builder personaliza.
5. Blueprint e criado.
6. Project Review valida.
7. Usuario aprova.
8. AI Workforce executa tarefas.
9. Publishing Center prepara entrega.
10. Growth Center acelera aquisicao.

## Governanca

Toda execucao de IA deve registrar:

- tenant;
- usuario;
- projeto;
- agente;
- objetivo;
- modelo;
- estimativa de tokens;
- custo;
- status;
- resultado;
- necessidade de aprovacao.

## Riscos

- IA no frontend.
- Prompts sensiveis expostos.
- Execucao sem limite de custo.
- Publicacao sem aprovacao.
- Mocks confundidos com funcionalidade real.
- Dados de tenant misturados.
- Logs com informacao sensivel.
