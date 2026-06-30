# Mercado Pago Multi Product Webhooks

Casa Mineira - GO LIVE 004

## Objetivo

Usar a mesma conta Mercado Pago da Casa Mineira com processamento, logs e metricas separados entre:

- Casa Mineira Servicos;
- Hospedagens Caminhos da Fe.

Nenhuma conta Mercado Pago foi alterada nesta sprint. Nenhuma UI, RLS, tabela ou dado foi movido.

## Arquitetura adotada

O endpoint legado continua existindo:

- `mercadopago-webhook`

Foram preparados endpoints dedicados por produto:

- `mercadopago-webhook-servicos`
- `mercadopago-webhook-hospedagens`

Os endpoints dedicados encaminham para o handler legado com um cabecalho interno de produto esperado:

- `x-cm-product-webhook: servicos`
- `x-cm-product-webhook: hospedagens`

O handler legado valida o produto identificado no `external_reference`. Se o evento chegar no endpoint errado, ele responde como ignorado e nao altera pedidos nem reservas.

## External references oficiais

| Produto | Formato oficial |
| --- | --- |
| Casa Mineira Servicos | `casa_mineira_servicos:{pedidoId}` |
| Hospedagens Caminhos da Fe | `caminho_hospedagem:{reservaId}` |

Compatibilidade mantida:

- pagamentos antigos de Servicos sem prefixo continuam processaveis pelo endpoint legado;
- prefixos desconhecidos nao sao tratados como Servicos.

## Criacao de pagamentos

### Casa Mineira Servicos

Functions atualizadas:

- `create-mercadopago-pix-payment`
- `create-mercadopago-card-payment`
- `create-mercadopago-preference`

Mudancas:

- `notification_url` aponta para `mercadopago-webhook-servicos`;
- `external_reference` passa a ser `casa_mineira_servicos:{pedidoId}`;
- metadata passa a incluir `product_id = casa_mineira_servicos`.

### Hospedagens Caminhos da Fe

Function atualizada:

- `create-caminho-hospedagem-pix-payment`

Mudancas:

- `notification_url` aponta para `mercadopago-webhook-hospedagens`;
- `external_reference` permanece `caminho_hospedagem:{reservaId}`;
- metadata permanece com `reserva_id`, `tenant_id`, `quarto_id`, `produto`, `hospedagem_slug` e `metodo`.

## Roteamento do webhook

O webhook agora executa a seguinte decisao:

1. Le `external_reference` do Mercado Pago.
2. Se comecar com `caminho_hospedagem:`, processa somente Hospedagens.
3. Se comecar com `casa_mineira_servicos:`, processa somente Servicos.
4. Se nao tiver prefixo e houver ID legado, processa como Servicos legado.
5. Se houver prefixo desconhecido, rejeita a roteirizacao.
6. Se o endpoint dedicado esperado nao bater com o produto real, ignora sem mutacao.

## Garantias de isolamento

### Hospedagens nunca atualiza pedido de Servicos

Eventos com `external_reference = caminho_hospedagem:{reservaId}` entram no fluxo `syncHospedagemReservaStatus` e so atualizam:

- `caminho_hospedagem_reservas`

O fluxo valida:

- `tenant_id` da metadata contra a reserva;
- `provider_payment_id` existente contra o pagamento recebido;
- idempotencia contra downgrade apos aprovacao.

### Servicos nunca atualiza reserva de Hospedagens

Eventos com `external_reference = casa_mineira_servicos:{pedidoId}` entram no fluxo de pedidos e so atualizam:

- `pagamentos`
- `comissoes`
- `pedidos`
- carteira/estoque vinculados ao pedido quando aplicavel

O fluxo de Servicos nao chama `syncHospedagemReservaStatus`.

## Logs separados por produto

### Logs comuns

- `[mercadopago.webhook] webhook_recebido`
- `[mercadopago.webhook] webhook_ignorado`

### Hospedagens

- `[hospedagens.webhook] pagamento_confirmado`
- `[hospedagens.webhook] reserva_hospedagem_processada`
- `[hospedagens.metrics] pagamento_processado`

### Servicos

- `[servicos.webhook] pedido_processamento_iniciado`
- `[servicos.metrics] pagamento_processado`

## Metricas separadas por produto

As metricas podem ser extraidas dos logs por prefixo:

| Produto | Filtro |
| --- | --- |
| Hospedagens | `[hospedagens.metrics] pagamento_processado` |
| Servicos | `[servicos.metrics] pagamento_processado` |
| Eventos ignorados | `[mercadopago.webhook] webhook_ignorado` |
| Erros Hospedagens | `[hospedagens.webhook] erro_supabase` ou `[hospedagens.webhook] erro_webhook` |
| Erros gerais | `[hospedagens.webhook] erro_webhook` |

Campos recomendados:

- `payment_id`;
- `status_pagamento`;
- `external_reference`;
- `pedido_id` ou `reserva_id`;
- `legacy_reference`, quando aplicavel.

## Idempotencia

### Criacao

- Servicos PIX: `X-Idempotency-Key = pix-{pedidoId}`.
- Servicos cartao: `X-Idempotency-Key = card-{pedidoId}-{token}`.
- Hospedagens PIX: `X-Idempotency-Key = caminho-pix-{reservaId}`.
- Hospedagens cartao: `X-Idempotency-Key = caminho-card-{reservaId}-{token}`.

### Webhook

- Hospedagens bloqueia `provider_payment_id` divergente.
- Hospedagens ignora downgrade depois de pagamento aprovado, exceto estorno.
- Servicos usa upsert por `pedido_id` e evita efeitos financeiros repetidos quando ja estava aprovado.

## Configuracao Mercado Pago

### Recomendada para novas cobrancas

Configurar cada produto para usar seu endpoint dedicado:

- Servicos: `https://<PROJECT_REF>.supabase.co/functions/v1/mercadopago-webhook-servicos`
- Hospedagens: `https://<PROJECT_REF>.supabase.co/functions/v1/mercadopago-webhook-hospedagens`

### Compatibilidade

O endpoint legado pode continuar ativo:

- `https://<PROJECT_REF>.supabase.co/functions/v1/mercadopago-webhook`

Ele roteia por `external_reference` e preserva pagamentos antigos de Servicos sem prefixo.

## Checklist de validacao

1. Deployar `mercadopago-webhook`.
2. Deployar `mercadopago-webhook-servicos`.
3. Deployar `mercadopago-webhook-hospedagens`.
4. Gerar PIX de Servicos e confirmar `external_reference = casa_mineira_servicos:{pedidoId}`.
5. Gerar PIX de Hospedagens e confirmar `external_reference = caminho_hospedagem:{reservaId}`.
6. Enviar webhook de Servicos no endpoint de Servicos.
7. Enviar webhook de Hospedagens no endpoint de Hospedagens.
8. Reenviar webhook de cada produto para validar idempotencia.
9. Enviar webhook de Hospedagens no endpoint de Servicos e confirmar que foi ignorado.
10. Enviar webhook de Servicos no endpoint de Hospedagens e confirmar que foi ignorado.

## Riscos remanescentes

- Pagamentos antigos de Servicos sem prefixo ainda dependem de compatibilidade legado.
- As metricas ainda sao baseadas em logs, nao em tabela propria de eventos.
- A mesma conta Mercado Pago continua compartilhada; a separacao operacional depende de `external_reference`, metadata e endpoint dedicado.

## Recomendacao

Para GO LIVE, usar os endpoints dedicados nos novos pagamentos e manter o endpoint legado por uma janela de transicao para eventos antigos.
