# Engineering Guidelines

## Regra central

Todo desenvolvimento deve fortalecer a Casa Mineira SaaS como plataforma enterprise de criacao de empresas digitais com IA.

## Antes de alterar qualquer coisa

1. Consultar `docs/MASTER_ARCHITECT.md`.
2. Consultar `docs/architecture/README.md`.
3. Abrir apenas arquivos necessarios.
4. Confirmar o escopo da tarefa.
5. Evitar auditoria completa sem autorizacao.

## Regras obrigatorias

- Nao duplicar codigo.
- Reutilizar componentes existentes.
- Reutilizar servicos existentes.
- Reutilizar arquitetura existente.
- Nao criar mocks sem justificativa.
- Nao deixar mocks parecerem funcionalidades reais.
- Nao alterar backend fora do escopo.
- Nao alterar Supabase fora do escopo.
- Nao alterar autenticacao fora do escopo.
- Nao alterar pagamentos fora do escopo.
- Nao alterar IA real fora do escopo.
- Nao alterar app mobile Casa Mineira Servicos sem pedido explicito.

## Documentacao

Toda feature relevante deve possuir documentacao proporcional ao impacto.

Atualizar docs quando:

- uma entidade de dominio muda;
- uma rota importante muda;
- uma regra de arquitetura muda;
- uma integracao passa de mock para real;
- uma decisao permanente e tomada.

Nao atualizar docs para:

- ajuste visual pequeno;
- correcao local sem mudanca conceitual;
- texto cosmetico;
- refactor interno sem impacto de dominio.

## Arquitetura

Regras:

- Digital Company e o contexto agregado da empresa digital.
- Business Project e o nucleo operacional.
- Business DNA define o modelo de negocio.
- Blueprint define o plano aprovado.
- EIF centraliza contexto estrategico.
- AI Workforce executa tarefas assistidas.
- AI Copilot acompanha o usuario.

## Frontend

Regras:

- usar componentes compartilhados;
- respeitar design system;
- manter responsividade;
- evitar componentes gigantes;
- separar dados mockados de componentes;
- nao hardcodar catalogos dentro da UI;
- manter areas publicas e autenticadas separadas.

## Backend

Regras:

- service role apenas no backend;
- dados sensiveis nunca no frontend;
- RLS obrigatorio;
- RPCs devem ser seguras;
- funcoes devem validar tenant e permissao;
- logs devem evitar secrets e dados sensiveis.

## Supabase

Regras:

- nao criar migrations sem necessidade real;
- nao duplicar tabelas existentes;
- validar tabelas antes de propor novas;
- usar RLS por padrao;
- separar leitura publica controlada de escrita autenticada;
- documentar qualquer nova policy.

## IA

Regras:

- IA real sempre backend-only;
- estimar custo antes de execucoes pesadas;
- usar Business DNA e templates antes de geracao do zero;
- exigir aprovacao humana antes de publicacao;
- registrar execucoes por tenant, usuario e projeto;
- nao expor prompts sensiveis.

## Pagamentos

Regras:

- webhooks precisam de secrets;
- eventos devem ser idempotentes;
- mudancas de plano precisam ser auditaveis;
- billing deve estar ligado ao tenant;
- nao simular pagamento como real em producao.

## Mocks

Mocks sao permitidos apenas quando:

- a sprint for explicitamente visual;
- a persistencia ainda nao existir;
- o mock estiver separado;
- houver TODO claro para integracao futura;
- o usuario nao for levado a acreditar que a acao real ja existe.

Mocks devem ser removidos gradualmente quando a infraestrutura real estiver pronta.

## Git

Regras:

- commits pequenos e intencionais;
- nao usar force push sem autorizacao explicita;
- nao apagar historico;
- nao reverter mudancas do usuario;
- listar arquivos alterados no relatorio final.

## Qualidade

Antes de concluir sprints de codigo:

- executar lint quando solicitado;
- executar build quando solicitado;
- corrigir erros dentro do escopo;
- informar riscos restantes;
- informar proximos passos.

Para sprints apenas de documentacao:

- nao alterar codigo;
- executar apenas os comandos solicitados;
- manter documentos claros e objetivos.

## Economia de contexto

Regras:

- trabalhar por modulo;
- evitar ler o projeto inteiro;
- usar docs como memoria oficial;
- pedir tarefas pequenas e especificas;
- nao propor refactors globais sem necessidade;
- atualizar memoria permanente quando uma decisao mudar.

## Criterios de aceite enterprise

Toda entrega deve preservar:

- seguranca;
- multi-tenant;
- LGPD;
- clareza visual;
- responsividade;
- baixo consumo de tokens;
- integracao com Business Project;
- capacidade futura de escala.
