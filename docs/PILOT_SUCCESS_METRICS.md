# Pilot Success Metrics

Hospedagens Caminhos da Fe - Executive Program 002

## Objetivo

Medir se a operacao assistida consegue transformar o software em venda real com seguranca, rastreabilidade e suporte humano.

## Nota executiva atual

**Nota atual: 78/100 para piloto fechado assistido.**

O produto esta perto do primeiro cliente real acompanhado. Ainda nao deve abrir venda publica sem validar Mercado Pago sandbox ponta a ponta e sem rotina operacional de incidentes.

## KPIs essenciais

| KPI | Definicao | Meta piloto fechado | Como medir |
| --- | --- | ---: | --- |
| Tempo medio de reserva | Tempo entre abrir catalogo e criar reserva persistida. | <= 8 min | Evento `reserva_criada` menos inicio do atendimento. |
| Tempo de geracao PIX | Tempo entre abrir pagamento e receber `payment_id`. | <= 60 s | Logs `pagamento_solicitado` e `pagamento_preparado`. |
| PIX aprovado | Pagamentos sandbox aprovados / PIX gerados. | >= 90% | Mercado Pago + reserva `status_pagamento`. |
| Webhook recebido | Webhooks recebidos / pagamentos aprovados. | 100% | Logs `webhook_recebido`. |
| Tempo de confirmacao | Tempo entre aprovacao Mercado Pago e reserva confirmada. | <= 2 min | Mercado Pago + `pagamento_confirmado`. |
| Conversao assistida | Reservas criadas / interessados acompanhados. | >= 30% | Diario operacional do piloto. |
| Cancelamentos | Reservas canceladas / reservas confirmadas. | <= 10% | Tabela de reservas + motivo operacional. |
| Erro por reserva | Incidentes P0/P1 / reservas criadas. | 0 P0, <= 10% P1 | Registro de incidentes. |
| Tempo de resposta | Tempo medio para responder chamado/duvida. | <= 15 min | Chamados, WhatsApp ou diario operacional. |
| Satisfacao | Nota pos-reserva do peregrino/pousada. | >= 8/10 | Pesquisa assistida curta. |

## Metricas de pagamento

| Metrica | Sinal verde | Sinal amarelo | Sinal vermelho |
| --- | --- | --- | --- |
| PIX gerado | `payment_id` salvo na reserva. | PIX gerado sem QR exibido na primeira tentativa. | Falha sem erro claro para operacao. |
| Webhook | Recebido e processado em ate 2 min. | Atraso ate 15 min com conciliacao manual. | Nao recebido ou assinatura invalida sem explicacao. |
| Idempotencia | Reenvio nao altera status indevidamente. | Reenvio gera log extra sem efeito. | Reenvio duplica confirmacao ou regride status. |
| Tenant seguro | Tenant do pagamento confere com reserva. | Ausencia de metadata exige investigacao. | Tenant mismatch ou confirmacao cruzada. |

## Metricas de operacao

| Metrica | Meta | Rotina |
| --- | ---: | --- |
| Reservas pendentes acima de 30 min | 0 sem justificativa | Revisar a cada rodada de piloto. |
| Incidentes sem dono | 0 | Todo incidente recebe responsavel. |
| Recontato manual necessario | <= 30% | Reduzir conforme webhook e UX estabilizam. |
| Dados incompletos de pousada | 0 antes da publicacao | Checklist de cadastro obrigatório. |
| Falhas de disponibilidade | 0 conflito confirmado | Validar quarto/data em cada reserva. |

## Riscos por prioridade

### P0

- Pagamento aprovado sem reserva confirmada.
- Reserva confirmada com `tenant_id`, `quarto_id` ou `provider_payment_id` divergente.
- Duas reservas pendentes/confirmadas para o mesmo quarto e periodo.

Contingencia: pausar novas reservas, validar Mercado Pago, corrigir status manualmente somente com evidencia e registrar incidente.

### P1

- Secrets Mercado Pago incorretos em staging.
- Webhook atrasado ou bloqueado por CORS/assinatura/configuracao.
- Painel da pousada sem atualização apos confirmacao.
- Falta de reembolso automatico.

Contingencia: operar em piloto fechado, reconciliar manualmente e manter cobrança em sandbox ate homologacao.

### P2

- Email/push ausente.
- Metricas ainda dependentes de diario operacional.
- Reembolso manual.
- Suporte ainda dependente de acompanhamento humano.

Contingencia: atendimento assistido por WhatsApp e registro manual padronizado.

### P3

- Automacao de dashboards.
- Relatorios financeiros avancados.
- Templates de comunicacao.
- Analytics de funil.

Contingencia: backlog pos-piloto.

## O que impede faturamento hoje

1. Falta validar um pagamento sandbox Mercado Pago aprovado em staging com webhook publico real.
2. Falta rotina operacional assinada para conciliacao manual em caso de webhook atrasado.
3. Falta homologar secrets e URL publica das Edge Functions.
4. Falta rodada acompanhada com uma pousada real e um peregrino real.
5. Falta definir processo manual de reembolso/cancelamento enquanto automatizacao financeira nao esta fechada.

## Estimativas executivas

| Marco | Estimativa |
| --- | ---: |
| Primeiro cliente acompanhado | 1 a 2 dias apos staging validado. |
| Primeira pousada real cadastrada | 1 dia. |
| Primeiro pagamento sandbox aprovado | 1 dia com credenciais sandbox e webhook configurados. |
| GO LIVE piloto fechado | 2 a 4 dias. |
| GO LIVE comercial aberto | 10 a 15 dias, dependendo de webhook real, suporte, juridico e reembolso. |

## Decisao recomendada

- Piloto fechado: **GO condicionado** a validacao Mercado Pago staging.
- Piloto aberto: **NO-GO** nesta etapa.
- Lancamento comercial: **NO-GO** nesta etapa.

## Proximo programa recomendado

**Executive Program 003 - Staging Payment War Room**

Foco:

1. Configurar staging Mercado Pago sandbox.
2. Executar pagamento PIX aprovado real em sandbox.
3. Reenviar webhook para idempotencia.
4. Registrar evidencias de logs e banco.
5. Autorizar piloto fechado com uma pousada parceira.

