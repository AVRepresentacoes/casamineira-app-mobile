# Payment Incident Runbook

Hospedagens Caminhos da Fe - Executive Program 003 Revenue Zero War Room

## Objetivo

Definir como recuperar a operacao quando Mercado Pago, Edge Functions, Supabase, webhook ou reserva ficarem inconsistentes durante o primeiro ciclo financeiro.

Regra central: nunca confirmar manualmente uma reserva sem evidencia verificavel de pagamento aprovado.

## Dados obrigatorios do incidente

- Ambiente.
- Data/hora.
- Responsavel.
- Usuario peregrino.
- Pousada.
- `reserva_id`.
- `tenant_id`.
- `quarto_id`.
- `provider_payment_id`.
- Status no Mercado Pago.
- Status no Supabase.
- Logs relacionados.
- Acao tomada.
- Resultado final.

## Se webhook falhar

### Sintomas

- Pagamento aprovado no Mercado Pago.
- Reserva continua `aguardando_pagamento`.
- Logs nao mostram `[hospedagens.webhook] webhook_recebido`.

### Diagnostico

1. Verificar URL configurada no Mercado Pago.
2. Confirmar que aponta para `https://<PROJECT_REF>.supabase.co/functions/v1/mercadopago-webhook`.
3. Confirmar deploy da function `mercadopago-webhook`.
4. Conferir `MERCADOPAGO_WEBHOOK_SECRET` se assinatura estiver habilitada.
5. Conferir logs de `webhook_ignorado` com `reason`.
6. Conferir se o pagamento possui `external_reference = caminho_hospedagem:{reservaId}`.

### Recuperacao

1. Reenviar evento no painel Mercado Pago, se disponivel.
2. Consultar pagamento diretamente no Mercado Pago.
3. Se aprovado e a reserva confere, registrar evidencia.
4. Acionar rotina manual de conciliacao apenas com aprovacao operacional.
5. Registrar incidente P0 se houver cliente real.

## Se Mercado Pago cair

### Sintomas

- Function retorna erro ao criar PIX.
- Log `[hospedagens.payment] erro_mercado_pago`.
- Timeout ou resposta 5xx/4xx do provedor.

### Diagnostico

1. Verificar status do Mercado Pago.
2. Confirmar validade do access token.
3. Confirmar se o erro vem de credencial, payload ou indisponibilidade.
4. Conferir se a reserva continua sem `provider_payment_id`.

### Recuperacao

1. Nao prometer reserva confirmada.
2. Manter reserva em `aguardando_pagamento`.
3. Tentar gerar novo PIX apenas quando o provedor voltar.
4. Se houver piloto assistido, avisar o cliente e registrar incidente P1.

## Se Edge Function falhar

### Sintomas

- App mostra falha ao preparar pagamento.
- Logs mostram `[hospedagens.payment] erro_configuracao`, `usuario_nao_autenticado`, `payload_invalido` ou `erro_inesperado`.

### Diagnostico

1. Confirmar deploy da function.
2. Confirmar `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
3. Confirmar token JWT do usuario no app.
4. Confirmar CORS/origem permitida.
5. Confirmar payload com `reservaId` e `metodo`.

### Recuperacao

1. Corrigir configuracao de staging.
2. Repetir chamada de pagamento.
3. Se a reserva ja tem `provider_payment_id`, nao criar nova cobranca sem checar Mercado Pago.
4. Registrar `payment_id` final usado.

## Se Supabase falhar

### Sintomas

- Logs mostram `[hospedagens.payment] erro_supabase` ou `[hospedagens.webhook] erro_supabase`.
- Pagamento pode ter sido criado, mas reserva nao atualizou.

### Diagnostico

1. Verificar status do projeto Supabase.
2. Conferir RLS/grants se a chamada vier do app.
3. Conferir service role se a chamada vier da Edge Function.
4. Confirmar se existe `provider_payment_id` salvo.
5. Confirmar status real do pagamento no Mercado Pago.

### Recuperacao

1. Nao repetir pagamento automaticamente.
2. Consultar Mercado Pago pelo `payment_id`.
3. Se aprovado, registrar evidencia e reconciliar reserva.
4. Se pendente, aguardar webhook ou reenvio.
5. Se recusado/cancelado, manter reserva sem confirmacao.

## Se pagamento ficar pendente

### Sintomas

- Reserva tem `status_pagamento = pendente`.
- Mercado Pago ainda nao aprovou ou nao enviou webhook final.

### Diagnostico

1. Conferir status no Mercado Pago.
2. Conferir se o cliente concluiu o PIX.
3. Conferir logs de webhook.
4. Conferir idade da reserva.

### Recuperacao

| Idade da pendencia | Acao |
| --- | --- |
| Ate 30 min | Aguardar e monitorar. |
| 30 a 60 min | Contatar cliente em piloto assistido. |
| Acima de 60 min | Marcar para conciliacao manual e liberar periodo somente com decisao operacional. |

## Se reserva ficar inconsistente

### Exemplos

- `provider_payment_id` diferente do Mercado Pago.
- `tenant_id` do pagamento diverge da reserva.
- Reserva confirmada sem pagamento aprovado.
- Pagamento aprovado sem reserva confirmada.
- Duas reservas no mesmo quarto/periodo.

### Severidade

Classificar como P0 quando envolver cliente real ou dinheiro real.

### Recuperacao

1. Pausar novas reservas do quarto afetado.
2. Coletar evidencia no Mercado Pago e Supabase.
3. Identificar a linha correta da reserva.
4. Nao apagar dados.
5. Corrigir status somente por procedimento aprovado.
6. Registrar incidente completo.
7. Reexecutar teste de conflito por quarto/data.

## Rollback seguro

### Antes de qualquer acao

- Fazer snapshot/backup em staging/producao.
- Registrar estado atual da reserva.
- Registrar estado atual do pagamento no Mercado Pago.

### Opcoes

| Cenario | Rollback |
| --- | --- |
| Secret errado | Reverter secret anterior e redeploy da function. |
| Function com bug | Reverter deploy da Edge Function para versao anterior. |
| Webhook mal configurado | Desativar temporariamente webhook e operar conciliacao manual. |
| Pagamento duplicado | Nao confirmar duplicidade; tratar reembolso no Mercado Pago. |
| Reserva confirmada indevidamente | Cancelar operacionalmente com evidencia e contato com pousada/cliente. |

## Comunicacao durante incidente

### Cliente

- Informar que a reserva esta em validacao de pagamento.
- Nao prometer confirmacao ate o status ser conferido.
- Dar prazo de retorno operacional.

### Pousada

- Informar que a reserva esta pendente de conciliacao.
- Bloquear decisao manual de overbooking sem aprovacao.

### Interno

- Abrir registro de incidente.
- Indicar responsavel unico.
- Atualizar status a cada 15 minutos em P0.

## Criterios de encerramento

Um incidente so pode ser encerrado quando:

- status Mercado Pago esta documentado;
- status Supabase esta coerente;
- painel da pousada reflete o estado final;
- cliente/pousada foram comunicados quando aplicavel;
- causa provavel foi registrada;
- acao preventiva foi definida.

