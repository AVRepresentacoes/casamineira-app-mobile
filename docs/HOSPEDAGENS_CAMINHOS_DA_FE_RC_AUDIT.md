# Release Candidate Audit Hospedagens Caminhos da Fe

Casa Mineira SaaS - Sprint Enterprise 023

## Ambiente

**Ambiente auditado:** repositorio local e Supabase local.

- API local: `http://127.0.0.1:54321`
- Banco local: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Nenhum comando foi executado contra producao. Nenhuma UI foi alterada. Nenhuma policy RLS foi alterada. Nenhum dado foi movido ou apagado.

## Resumo executivo

Hospedagens Caminhos da Fe esta com a base de seguranca local em bom estado para uma Release Candidate tecnica: RLS ativo nas tabelas do produto, grants reduzidos, matrizes `02` e `03` passando, isolamento entre clientes validado e catalogo publico filtrado por RLS.

O produto ainda nao esta pronto para uma venda piloto paga sem acompanhamento operacional. A auditoria encontrou riscos comerciais e operacionais, principalmente em pagamento/conciliacao, catalogo ainda demonstrativo em telas centrais, fallback local de reserva e contrato publico ainda exposto por tabela.

Recomendacao: **pronto para piloto controlado e assistido**, com gateway em sandbox ou cobranca manual monitorada; **nao pronto para venda piloto paga autonoma** antes de fechar os P1 listados neste relatorio.

## Status geral

| Area | Status RC | Observacao |
| --- | --- | --- |
| Banco/RLS | Pronto local | Matrizes passam e grants minimos aplicados localmente. |
| Login/autenticacao | Parcial | Fluxo separa cliente e pousada, mas onboarding de pousada depende de cadastro/perfil correto. |
| Catalogo publico | Parcial | RLS permite catalogo publico seguro, mas home/detalhe ainda usam dados demonstrativos. |
| Reserva | Parcial | Insere em Supabase, mas tem fallback local em caso de erro. |
| Pagamento | Parcial com risco | Criacao PIX/cartao existe, mas webhook Mercado Pago nao concilia `caminho_hospedagem:*`. |
| Pousada/painel | Parcial | Painel existe e salva dados, com fallback/demo em cenarios sem dados. |
| Suporte/chamados | Bom para piloto | Fluxos cliente/pousada/admin existem e RLS foi endurecido. |
| Notificacoes | Bom para piloto | In-app via tabela, sem push/email confirmado. |
| Legal/LGPD | Parcial | Politicas existem em tela; checklist juridico/publicacao ainda pendente. |
| Publicacao | Parcial | Config de app dedicado existe; dominio, CORS, secrets e storage precisam validacao final. |

## Fluxos prontos

- Login com tenant lock para `hospedagens-caminhos-da-fe` e direcionamento cliente/pousada.
- Separacao de entrada entre peregrino e pousada no app Hospedagens.
- Visualizacao inicial de hospedagens e detalhe em modo demonstrativo.
- Formulario de reserva com calculo de total, sinal, comissao e restante na pousada.
- Insercao de reserva em `caminho_hospedagem_reservas` quando Supabase/tenant estao corretos.
- Tela de pagamento com caminhos para PIX e cartao.
- Minhas hospedagens, gastos, km percorridos e rota/favoritos.
- Avaliacoes publicadas e envio de avaliacao autenticada.
- Favoritos, chamados e notificacoes in-app.
- Painel da pousada com reservas, quartos, servicos, disponibilidade, politicas e suporte.
- Admin de Hospedagens para monitoramento basico de pousadas, reservas e chamados.
- Politicas do cliente e da pousada em telas dedicadas.

## Fluxos parciais

- **Cadastro de pousada:** a entrada existe, mas depende de `profissionais.fornecedor_ativo` e contexto de tenant/perfil; precisa validacao manual ponta a ponta com um parceiro real.
- **Catalogo publico:** as policies permitem catalogo anonimo filtrado, mas a tela principal usa `HOSPEDAGENS_DEMO`; falta validar fluxo 100% data-driven antes de venda.
- **Busca de disponibilidade:** existe UI/filtro por cidade/ramal e tabela de disponibilidade, mas a busca publica ainda nao prova disponibilidade real por quarto/dia no fluxo de reserva.
- **Reserva:** funciona com Supabase, mas fallback para AsyncStorage cria reserva local quando insert falha; isso e util para demo, mas perigoso para operacao comercial.
- **Confirmacao:** pagamento pode atualizar a reserva na criacao, mas a confirmacao assincrona por webhook ainda nao esta fechada para Hospedagens.
- **Cancelamento:** cancelamento pela pousada existe via RPC e registra efeitos operacionais; cancelamento pelo cliente/reembolso automatico nao foi confirmado.
- **Pagamentos:** Mercado Pago PIX/cartao existe em Edge Function; Asaas aparece como configuracao/futuro, mas nao como cobranca real ativa para Hospedagens.
- **E-mails/notificacoes:** notificacoes in-app existem; envio de email, push notification e templates transacionais nao foram confirmados.
- **Storage:** bucket `imagens` e policies existem para fotos, mas grants de storage sao amplos para usuarios autenticados e precisam revisao antes de producao.

## Fluxos ausentes ou nao comprovados

- Conciliação Mercado Pago webhook para `external_reference = caminho_hospedagem:{reservaId}`.
- Webhook Asaas especifico para reservas de Hospedagens.
- Estorno/reembolso automatico para cancelamento do cliente ou da pousada.
- Bloqueio transacional de disponibilidade para evitar duas reservas no mesmo quarto/data.
- Catalogo publico com projecao segura de colunas via RPC/Edge Function.
- Checklist de dominio/CORS final em ambiente real.
- Monitoramento operacional dedicado: logs, alertas de webhook, falha de pagamento, reserva local e erros de storage.
- Termos juridicos finais publicados em URL publica, com politica de privacidade e canal LGPD.

## Auditoria de Banco/RLS

### Confirmado localmente

- RLS ativo em todas as 12 tabelas `caminho_hospedagem_%`.
- Grants minimos da Sprint 022 aplicados localmente.
- `anon` manteve somente `SELECT` em tabelas de catalogo publico/avaliacoes publicadas.
- `authenticated` manteve apenas permissoes necessarias por fluxo e policy.
- `DELETE`, `TRUNCATE`, `REFERENCES` e `TRIGGER` foram removidos dos perfis publicos, exceto `DELETE` autenticado em favoritos.
- Catalogo publico segue protegido por filtros RLS:
  - `pousadas.status = 'aprovada'` e `visivel = true`;
  - `quartos.ativo = true` e `disponivel = true`;
  - `servicos.ativo = true`;
  - `disponibilidade.status = 'livre'`;
  - `avaliacoes.publicada = true`.

### Resultados das matrizes

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/seed/rls_personas_seed.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls/02_persona_access_matrix.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls/03_hospedagens_extended_access_matrix.sql
```

Resultados:

- Matriz `02`: **36 checks passaram, 0 falhas**.
- Matriz `03`: **52 checks passaram, 0 falhas P0/P1**.

## Auditoria de pagamentos

### Existe

- Edge Function `create-caminho-hospedagem-pix-payment`.
- PIX e cartao via Mercado Pago quando `MERCADO_PAGO_ACCESS_TOKEN` ou `MERCADOPAGO_ACCESS_TOKEN` esta configurado.
- Validacao de usuario autenticado e reserva propria antes de criar pagamento.
- Atualizacao inicial de `provider`, `provider_payment_id` e status de pagamento na reserva.
- Tela `app/hospedagens/pagar.tsx` com PIX/cartao e public key do Mercado Pago.

### Parcial ou ausente

- `mercadopago-webhook` concilia `pedidos` genericos, mas nao foi encontrado tratamento para `external_reference` com prefixo `caminho_hospedagem:`.
- Asaas esta documentado como env futura, mas a Edge Function de Hospedagens retorna fluxo nao configurado para Asaas.
- Reembolso/estorno automatico nao foi comprovado para reservas.
- Cancelamentos existem na modelagem/RPC, mas a operacao financeira de devolucao ainda precisa fechamento.
- Ha divergencia potencial de nomes de secrets: `backend.env.example` usa `HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN`, enquanto a Edge Function procura `MERCADO_PAGO_ACCESS_TOKEN`/`MERCADOPAGO_ACCESS_TOKEN`.

## Auditoria de UX

### Pontos fortes

- Experiencia dedicada de Hospedagens com identidade visual propria.
- Entrada separada para peregrino e pousada.
- CTAs claros para reservar, pagar, ver perfil, favoritos, suporte e painel da pousada.
- Telas de politicas explicam sinal, cancelamento e responsabilidades.
- Mobile foi considerado na estrutura das telas React Native/Expo.

### Riscos de UX para RC

- A presenca de dados demonstrativos pode confundir usuario real se nao houver sinalizacao operacional.
- Estados vazios existem em alguns fluxos, mas devem ser validados manualmente em conta sem reservas/favoritos/chamados.
- Falha de insert de reserva vira reserva local; para usuario final isso parece sucesso, mas pode nao existir no painel da pousada.
- Pagamento com gateway nao configurado exibe estado de configuracao, adequado para teste, mas nao para venda paga.

## Auditoria de producao

### Necessario antes de publicar

- Confirmar Supabase dedicado conforme `clients/hospedagens-caminhos-da-fe/client.json`.
- Configurar secrets reais das Edge Functions com nomes esperados pelo codigo.
- Validar webhook Mercado Pago com assinatura e suporte a reservas Hospedagens.
- Validar CORS das Edge Functions no dominio `hospedagenscaminhosdafe.com.br`.
- Validar bucket `imagens`, tamanho, tipos MIME e regras de ownership por path.
- Configurar dominio, politica de privacidade publica e termos de uso.
- Ativar backup/snapshot e plano de rollback das migrations.
- Definir logs/alertas para pagamento, webhook, reserva local, storage e RPC de cancelamento.

## Riscos

### P0

- Nenhum P0 confirmado na auditoria local de RLS/banco.

### P1

- Webhook Mercado Pago nao comprovado para `caminho_hospedagem:{reservaId}`; pagamento aprovado pode nao confirmar reserva automaticamente.
- Reserva local via AsyncStorage em falha de insert pode gerar promessa operacional sem persistencia no banco.
- Catalogo e detalhe ainda dependem de `HOSPEDAGENS_DEMO`, limitando venda com estoque real.
- Busca/disponibilidade nao comprova bloqueio real por quarto/data no momento da reserva.
- Reembolso/estorno automatico ausente ou nao comprovado.
- Secrets de pagamento dedicados de Hospedagens podem nao bater com os nomes lidos pelas Edge Functions.

### P2

- Catalogo publico por tabela expoe todas as colunas das linhas liberadas por RLS.
- Notificacoes sao in-app; email/push nao confirmado.
- Storage `imagens` usa bucket publico e policies amplas para authenticated.
- Usuarios multi-tenant dependem de `current_tenant_id()` consistente.
- Contratos legais precisam revisao final antes de venda publica.

## Checklist antes da venda piloto

1. Definir se o piloto sera pago, sandbox ou reserva assistida/manual.
2. Corrigir ou contornar explicitamente a conciliacao do webhook para reservas.
3. Desabilitar fallback local de reserva para contas reais ou sinalizar como modo demo.
4. Validar cadastro real de uma pousada parceira com `fornecedor_ativo`.
5. Cadastrar uma pousada real, quartos reais, servicos reais e disponibilidade real.
6. Executar reserva ponta a ponta com usuario peregrino real.
7. Validar cancelamento, suporte e notificacao em conta real.
8. Conferir secrets e URL das Edge Functions.
9. Conferir logs de pagamento e webhook.
10. Reexecutar matrizes `02` e `03` em staging/local equivalente.

## Checklist antes da publicacao

1. Confirmar dominio, CORS e politica de privacidade publica.
2. Validar build mobile/web no tenant `hospedagens-caminhos-da-fe`.
3. Validar storage de fotos com ownership por usuario/pousada.
4. Publicar termos de uso, politica de privacidade e canal de suporte/LGPD.
5. Configurar backup, monitoramento e alertas.
6. Documentar rollback de migrations e rollback de secrets.
7. Rodar teste manual em iOS/Android e web, quando aplicavel.
8. Testar conta sem dados, conta cliente com reservas e conta pousada com painel real.

## Plano para RC 1.0

1. Fechar P1 de pagamento: webhook, status de reserva, erro de pagamento e reembolso.
2. Migrar catalogo da home/detalhe para dados reais protegidos por RLS ou RPC.
3. Remover/condicionar fallback local de reservas para modo demo.
4. Validar disponibilidade real e conflito de reserva.
5. Fazer rodada manual de UX mobile com peregrino e pousada.
6. Congelar migrations RLS para RC e aplicar somente com janela controlada.

## Plano de rollback

1. Manter snapshot/backup antes de qualquer migration em staging/producao.
2. Reverter secrets do gateway para modo sandbox/desativado em caso de falha de pagamento.
3. Desabilitar publicacao comercial e operar reservas manualmente se webhook falhar.
4. Reverter ultima migration aplicada usando migration de rollback revisada, nunca `reset` em producao.
5. Reexecutar matrizes RLS e teste manual de login/reserva apos rollback.

## Recomendacao final

**Nao pronto para venda piloto paga autonoma.**

**Pronto para piloto controlado e assistido**, com escopo limitado, parceiros reais acompanhados manualmente e pagamento em sandbox/manual ate a conciliacao de webhook e fluxo de reembolso ficarem fechados.

## Proxima sprint recomendada

Sprint Enterprise 024 - Pagamentos e Catalogo Real Hospedagens RC:

1. Implementar conciliacao Mercado Pago para `caminho_hospedagem:{reservaId}`.
2. Alinhar nomes de secrets dedicados de Hospedagens.
3. Revisar fallback local de reserva para modo demo.
4. Conectar catalogo publico a dados reais ou RPC com projecao segura.
5. Validar conflito de disponibilidade por quarto/data.
