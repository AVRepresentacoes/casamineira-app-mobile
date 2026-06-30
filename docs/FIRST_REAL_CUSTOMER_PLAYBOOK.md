# First Real Customer Playbook

Hospedagens Caminhos da Fe - Executive Program 002

## Objetivo

Preparar a operacao assistida para a primeira pousada real, primeira reserva real e primeiro PIX sandbox validado com webhook Mercado Pago.

Este playbook nao substitui validacao em staging. Nenhum secret deve ser registrado neste documento.

## Prontidao atual

| Item | Status | Observacao |
| --- | --- | --- |
| Pousada real | Pronto para piloto fechado | Cadastro real pelo painel da pousada. |
| Quartos reais | Pronto para piloto fechado | Cadastro real por pousada. |
| Disponibilidade real | Pronto para piloto fechado | Disponibilidade por quarto/data e conflito de reserva. |
| Reserva real | Pronto para piloto fechado | Reserva persiste no Supabase e inicia aguardando pagamento. |
| PIX sandbox | Pronto para validacao | Depende de secrets Mercado Pago sandbox. |
| Webhook | Pronto para validacao | Concilia `caminho_hospedagem:{reservaId}`. |
| Painel da pousada | Pronto para piloto fechado | Lista reservas persistidas e status atualizado. |
| Lancamento comercial aberto | Nao pronto | Exige validacao real de sandbox, monitoramento e rotina de suporte. |

## Checklist staging

Validar sem expor valores:

- `PROJECT_REF` do Supabase staging.
- `SUPABASE_URL` apontando para o projeto correto.
- `SUPABASE_ANON_KEY` configurada no app.
- `SUPABASE_SERVICE_ROLE_KEY` configurada somente nas Edge Functions.
- JWT/auth funcionando no app de Hospedagens.
- `HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN` com credencial sandbox.
- `MERCADO_PAGO_ACCESS_TOKEN` ou `MERCADOPAGO_ACCESS_TOKEN` apenas como fallback documentado.
- `MERCADOPAGO_WEBHOOK_SECRET` configurado se a assinatura estiver ativa.
- `EDGE_ALLOWED_ORIGINS` contendo os domínios de staging.
- Functions deployadas: `create-caminho-hospedagem-pix-payment` e `mercadopago-webhook`.
- Webhook Mercado Pago apontando para `https://<PROJECT_REF>.supabase.co/functions/v1/mercadopago-webhook`.

## Primeira pousada

1. Criar conta do responsavel pela pousada em staging.
2. Confirmar que a conta esta no tenant `hospedagens-caminhos-da-fe`.
3. Entrar no painel da pousada.
4. Completar nome, cidade, UF, ramal, endereco, WhatsApp, descricao e politicas basicas.
5. Aprovar e tornar visivel a pousada apenas quando os dados estiverem conferidos.
6. Registrar o ID/slug da pousada no diario operacional do piloto.

## Primeiro quarto

1. Abrir painel da pousada.
2. Cadastrar quarto com nome, tipo, capacidade, diaria e disponibilidade ativa.
3. Conferir se o quarto aparece no catalogo publico somente quando a pousada estiver aprovada e visivel.
4. Registrar `quarto_id` para acompanhar reserva e pagamento.

## Primeira disponibilidade

1. Selecionar datas do piloto.
2. Marcar disponibilidade `livre` para o quarto real.
3. Conferir que datas de manutencao/bloqueio nao aparecem como reservaveis.
4. Confirmar que duas reservas pendentes ou confirmadas para o mesmo quarto e periodo sao bloqueadas.

## Primeira reserva

1. Entrar como peregrino autenticado.
2. Abrir o catalogo publico.
3. Escolher pousada, quarto e periodo com disponibilidade livre.
4. Criar reserva.
5. Conferir logs:
   - `[hospedagens.reserva] criar_reserva_iniciada`
   - `[hospedagens.reserva] reserva_criada`
6. Confirmar no banco que a reserva iniciou com:
   - `status = aguardando_pagamento`
   - `status_pagamento = pendente`
   - `quarto_id` preenchido
   - `tenant_id` correto

## Primeiro PIX sandbox

1. Abrir a tela de pagamento da reserva criada.
2. Gerar PIX sandbox.
3. Conferir logs:
   - `[hospedagens.pagamento] pagamento_solicitado`
   - `[hospedagens.payment] mercado_pago_request`
   - `[hospedagens.payment] pagamento_preparado`
4. Confirmar que a reserva recebeu:
   - `provider = mercadopago`
   - `provider_payment_id`
   - `status_pagamento` de retorno do Mercado Pago
5. Confirmar que o Mercado Pago recebeu `external_reference = caminho_hospedagem:{reservaId}`.

## Webhook e confirmacao

1. Aprovar o pagamento no sandbox Mercado Pago.
2. Confirmar recebimento do webhook nos logs:
   - `[hospedagens.webhook] webhook_recebido`
   - `[hospedagens.webhook] pagamento_confirmado`
   - `[hospedagens.webhook] reserva_hospedagem_processada`
3. Reenviar o webhook para validar idempotencia.
4. Confirmar que o status nao duplica efeitos nem regride indevidamente.
5. Confirmar no banco:
   - `status = confirmada`
   - `status_pagamento = aprovada`
   - `provider_payment_id` preservado

## Painel da pousada

1. Entrar como responsavel pela pousada.
2. Abrir painel.
3. Validar que a reserva aparece com:
   - cliente
   - telefone
   - quarto
   - check-in
   - check-out
   - hospedes
   - total
   - sinal
   - status confirmado
4. Registrar evidencia no diario operacional do piloto.

## Como monitorar

### Pagamentos

- Filtrar logs por `[hospedagens.payment]`.
- Acompanhar `payment_id`, `reserva_id`, `tenant_id`, `metodo` e `status_pagamento`.
- Conferir erros Mercado Pago em `[hospedagens.payment] erro_mercado_pago`.

### Webhooks

- Filtrar logs por `[hospedagens.webhook]`.
- Conferir eventos ignorados com `reason`.
- Conferir retries de token com `retry_token_candidate_failed`.
- Conferir tenant mismatch como incidente P0.

### Reservas

- Filtrar logs por `[hospedagens.reserva]`.
- Conferir conflitos por quarto/data.
- Conferir reservas que ficaram em `aguardando_pagamento` por mais de 30 minutos.

### Falhas e timeout

- Registrar horario, usuario, reserva, quarto, payment id e mensagem.
- Repetir a consulta no Mercado Pago antes de qualquer acao manual.
- Nunca confirmar manualmente sem evidencia de pagamento aprovado.

## Como agir em erro

| Situacao | Acao |
| --- | --- |
| PIX nao gerou | Conferir secrets, token Mercado Pago e logs `erro_mercado_pago`. |
| Webhook nao chegou | Conferir URL publica, assinatura, logs da function e painel Mercado Pago. |
| Webhook chegou mas nao confirmou | Conferir `external_reference`, `tenant_id`, `provider_payment_id` e erro Supabase. |
| Reserva nao aparece no painel | Conferir tenant, slug da pousada, RLS e status persistido. |
| Cliente pagou e reserva ficou pendente | Validar pagamento no Mercado Pago e abrir incidente P0 antes de confirmacao manual. |

## Cancelamento manual

1. Identificar reserva, cliente, pousada, datas e payment id.
2. Confirmar status financeiro no Mercado Pago.
3. Registrar motivo do cancelamento.
4. Executar cancelamento pelo fluxo operacional existente.
5. Se houver reembolso, tratar fora do app ate a rotina automatica ser homologada.
6. Registrar incidente e acao tomada.

## Registro de incidente

Cada incidente deve conter:

- Data/hora.
- Ambiente.
- Usuario afetado.
- Pousada.
- Reserva.
- Payment id.
- Sintoma.
- Logs relacionados.
- Acao tomada.
- Responsavel.
- Status final.

## Checklist do piloto

### Dia 1

- Primeira pousada cadastrada.
- Primeiro quarto cadastrado.
- Primeira disponibilidade livre cadastrada.
- Primeiro peregrino autenticado.
- Primeira reserva criada.
- Primeiro PIX sandbox gerado.
- Primeiro pagamento sandbox aprovado.
- Primeiro webhook recebido.
- Primeira reserva confirmada.
- Primeira reserva visivel no painel.

### Depois da primeira reserva

- Primeiro check-in acompanhado.
- Primeira avaliacao registrada.
- Primeiro chamado aberto.
- Primeira notificacao recebida.
- Primeiro fechamento operacional revisado.

## Matriz de risco

| Severidade | Risco | Contingencia |
| --- | --- | --- |
| P0 | Pagamento aprovado sem confirmacao da reserva. | Operacao assistida valida Mercado Pago e confirma somente com evidencia. |
| P0 | Reserva confirmada para tenant/quarto incorreto. | Parar piloto, revisar webhook, bloquear novas reservas ate correcao. |
| P1 | Webhook intermitente ou atrasado. | Monitorar pendentes e reconciliar manualmente com Mercado Pago. |
| P1 | PIX sandbox nao gera por secret errado. | Corrigir secret em staging e repetir fluxo. |
| P1 | Painel da pousada nao lista reserva confirmada. | Validar tenant/slug/RLS e usar consulta administrativa temporaria para operacao. |
| P2 | Email/push ausente. | Confirmacao assistida por WhatsApp durante piloto fechado. |
| P2 | Reembolso automatico ausente. | Processo manual documentado. |
| P3 | Metricas ainda manuais. | Consolidar planilha operacional ate painel analitico futuro. |

## GO / NO-GO

| Marco | Status | Justificativa |
| --- | --- | --- |
| Piloto fechado | GO condicionado | Produto suporta operacao assistida se staging Mercado Pago for validado ponta a ponta. |
| Piloto aberto | NO-GO | Falta observabilidade madura, reembolso automatizado e rodada real de sandbox aprovada. |
| Lancamento comercial | NO-GO | Exige monitoramento, suporte, juridico e rotinas financeiras homologadas. |

