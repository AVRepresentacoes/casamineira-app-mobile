# First Revenue Scoreboard

Hospedagens Caminhos da Fe - Executive Program 003 Revenue Zero War Room

## Objetivo

Registrar evidencias da primeira transacao financeira valida em staging/sandbox e decidir quando o produto pode avancar para primeiro faturamento real.

## Estado atual

| Marco | Status | Observacao |
| --- | --- | --- |
| Cadastro de pousada | Pronto para teste assistido | Executar em staging. |
| Cadastro de quarto | Pronto para teste assistido | Exige quarto real vinculado a pousada. |
| Disponibilidade | Pronto para teste assistido | Validar por quarto/data. |
| Reserva | Pronto para teste assistido | Deve iniciar pendente. |
| PIX Mercado Pago | Pronto para sandbox | Depende de token sandbox. |
| Webhook | Pronto para sandbox | Depende de URL publica e secret. |
| Confirmacao de reserva | Pronto para sandbox | Exige webhook aprovado. |
| Painel da pousada | Pronto para validacao | Deve refletir reserva confirmada. |
| Dinheiro real | No-go | Primeiro provar sandbox completo. |

## Registro do teste Revenue Zero

Preencher durante a execucao.

| Campo | Valor |
| --- | --- |
| Data/hora inicio | Pendente |
| Ambiente | Staging/sandbox |
| Responsavel | Pendente |
| Pousada ID | Pendente |
| Quarto ID | Pendente |
| Reserva ID | Pendente |
| Payment ID Mercado Pago | Pendente |
| Webhook recebido | Pendente |
| Status final da reserva | Pendente |
| Painel atualizado | Pendente |
| Resultado | Pendente |

## Metricas principais

| Metrica | Como medir | Meta | Resultado |
| --- | --- | ---: | --- |
| Tempo ate gerar PIX | `pagamento_solicitado` ate `pagamento_preparado`. | <= 60 s | Pendente |
| Tempo ate webhook | Aprovacao Mercado Pago ate `webhook_recebido`. | <= 120 s | Pendente |
| Tempo ate confirmacao | `webhook_recebido` ate `pagamento_confirmado`. | <= 30 s | Pendente |
| Tempo ate painel atualizar | Confirmacao ate reserva aparecer no painel. | <= 60 s | Pendente |
| Tempo total | Reserva criada ate painel confirmado. | <= 10 min | Pendente |
| Falhas | Incidentes P0/P1 durante o fluxo. | 0 P0 | Pendente |
| Retries | Reenvios/retries necessarios. | <= 1 | Pendente |

## Log checklist

Marcar quando aparecerem:

- `[hospedagens.reserva] criar_reserva_iniciada`
- `[hospedagens.reserva] reserva_criada`
- `[hospedagens.pagamento] pagamento_solicitado`
- `[hospedagens.payment] mercado_pago_request`
- `[hospedagens.payment] pagamento_preparado`
- `[hospedagens.webhook] webhook_recebido`
- `[hospedagens.webhook] pagamento_confirmado`
- `[hospedagens.webhook] reserva_hospedagem_processada`

## Evidencia de banco

Antes do pagamento:

| Campo | Esperado |
| --- | --- |
| `status` | `aguardando_pagamento` |
| `status_pagamento` | `pendente` |
| `provider` | `null` ou `mercadopago` apos gerar PIX |
| `provider_payment_id` | `null` antes do PIX; preenchido apos PIX |
| `tenant_id` | Tenant Hospedagens |
| `quarto_id` | Quarto real selecionado |

Depois do webhook aprovado:

| Campo | Esperado |
| --- | --- |
| `status` | `confirmada` |
| `status_pagamento` | `aprovada` |
| `provider` | `mercadopago` |
| `provider_payment_id` | Payment ID Mercado Pago |
| `tenant_id` | Igual ao metadata do pagamento |
| `quarto_id` | Igual ao quarto reservado |

## Teste de idempotencia

1. Reenviar o mesmo webhook.
2. Confirmar que o status permanece coerente.
3. Confirmar que nao ha duplicacao de reserva.
4. Confirmar que nao ha regressao de `aprovada` para `pendente` ou `recusada`.
5. Registrar o resultado.

| Item | Resultado |
| --- | --- |
| Reenvio recebido | Pendente |
| Reserva duplicada | Pendente |
| Status regrediu | Pendente |
| Logs coerentes | Pendente |

## GO / NO-GO executivo

| Pergunta | Decisao atual | Criterio para GO |
| --- | --- | --- |
| Estamos prontos para primeiro pagamento sandbox? | GO condicionado | Secrets e webhook staging configurados. |
| Estamos prontos para primeiro pagamento producao? | NO-GO | Exige sandbox aprovado e runbook validado. |
| Estamos prontos para primeira pousada? | GO | Operacao assistida consegue cadastrar e validar dados. |
| Estamos prontos para primeiro cliente? | GO condicionado | Cliente deve entrar em piloto fechado, sem promessa de autonomia total. |
| Estamos prontos para primeiro faturamento? | NO-GO | Aguardar transacao sandbox aprovada ponta a ponta. |

## Nota de prontidao

**82/100 para Revenue Zero em sandbox.**

Motivos:

- cadeia tecnica esta instrumentada;
- webhook de Hospedagens ja separa produto por `external_reference`;
- reserva valida tenant e `provider_payment_id`;
- ainda falta executar sandbox publico real;
- ainda falta homologar rotina manual de conciliacao/reembolso.

## O que falta para receber R$ 1,00

1. Configurar staging com secrets Mercado Pago sandbox.
2. Deployar Edge Functions no projeto correto.
3. Configurar webhook publico Mercado Pago.
4. Executar PIX sandbox aprovado.
5. Validar idempotencia por reenvio do webhook.
6. Validar painel da pousada apos confirmacao.
7. Aprovar passagem de sandbox para credenciais reais.

## Resultado final

Preencher apos o teste:

- Revenue Zero sandbox concluido: `sim/nao`.
- Primeiro pagamento real autorizado: `sim/nao`.
- Bloqueadores restantes:
  - Pendente.

