# GO LIVE 003 - Mercado Pago Staging Validation

Hospedagens Caminhos da Fe

## Ambiente

Auditoria executada no repositorio local. Nenhum deploy remoto foi executado nesta sprint porque nao ha `PROJECT_REF` de staging/sandbox explicitamente aprovado no contexto, e o projeto dedicado documentado (`uxtqwsckvrsxjvvtdwhg`) aparece como backend de producao/dedicado de Hospedagens.

Nenhum valor secreto foi lido ou exposto. Nenhum pagamento real foi criado. Nenhuma UI, RLS, Casa Mineira Servicos ou SaaS Control Plane foi alterado.

## Objetivo

Validar o fluxo real de pagamento Mercado Pago para Hospedagens usando sandbox/staging:

```text
reserva aguardando pagamento
-> PIX sandbox Mercado Pago
-> webhook publico
-> reserva confirmada
-> painel da pousada atualizado
-> reenvio idempotente do webhook
```

## Secrets necessarios

### Obrigatorios para as Edge Functions

| Secret | Uso | Status |
| --- | --- | --- |
| `SUPABASE_URL` | URL do projeto Supabase staging. | Necessario. |
| `SUPABASE_ANON_KEY` | Validacao do usuario autenticado na function de pagamento. | Necessario. |
| `SUPABASE_SERVICE_ROLE_KEY` | Atualizar reserva e consultar dados internos nas functions. | Necessario. |
| `HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN` | Token Mercado Pago sandbox dedicado de Hospedagens. | Padronizado nesta sprint. |
| `MERCADOPAGO_WEBHOOK_SECRET` | Validacao de assinatura do webhook Mercado Pago. | Recomendado/necessario para staging real. |
| `EDGE_ALLOWED_ORIGINS` | CORS das Edge Functions. | Necessario para app/web staging. |

### Aliases aceitos por compatibilidade

As functions tambem aceitam:

- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADOPAGO_ACCESS_TOKEN`

Ordem padronizada para Hospedagens:

1. `HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN`
2. `MERCADO_PAGO_ACCESS_TOKEN`
3. `MERCADOPAGO_ACCESS_TOKEN`

Essa ordem evita usar acidentalmente token compartilhado de outro produto quando houver token dedicado de Hospedagens.

## Functions auditadas

### `create-caminho-hospedagem-pix-payment`

Arquivo:

- `supabase/functions/create-caminho-hospedagem-pix-payment/index.ts`

Confirmado:

- exige usuario autenticado;
- busca reserva por `id` e `cliente_id`;
- gera `external_reference = caminho_hospedagem:{reservaId}`;
- envia `notification_url = {SUPABASE_URL}/functions/v1/mercadopago-webhook`;
- envia metadata de `reserva_id`, `tenant_id`, `quarto_id`, `produto`, `hospedagem_slug` e `metodo`;
- salva `provider = mercadopago`;
- salva `provider_payment_id`;
- salva `status_pagamento`;
- mantem reserva como `aguardando_pagamento` quando Mercado Pago retorna pagamento pendente.

Alteracao desta sprint:

- passou a aceitar `HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN` como secret prioritario.

### `mercadopago-webhook`

Arquivo:

- `supabase/functions/mercadopago-webhook/index.ts`

Confirmado:

- aceita eventos Mercado Pago com `paymentId`;
- valida assinatura quando `MERCADOPAGO_WEBHOOK_SECRET` esta configurado;
- consulta pagamento na API Mercado Pago;
- reconhece `external_reference` com prefixo `caminho_hospedagem:`;
- atualiza a reserva de Hospedagens;
- confirma pagamento aprovado como `status = 'confirmada'` e `status_pagamento = 'aprovada'`;
- trata recusado/cancelado como `status_pagamento = 'recusada'`;
- trata estorno como `status = 'cancelada_cliente'` e `status_pagamento = 'estornada'`;
- confere `tenant_id` quando metadata existe;
- impede troca de `provider_payment_id`;
- evita downgrade de pagamento ja aprovado por evento atrasado.

Alteracao desta sprint:

- passou a aceitar `HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN` como secret prioritario.

## Webhook publico esperado

Para um projeto staging/sandbox, configurar no Mercado Pago:

```text
https://<PROJECT_REF>.supabase.co/functions/v1/mercadopago-webhook
```

Eventos minimos:

- `payment.created`
- `payment.updated`

O webhook deve ser configurado com assinatura e o mesmo valor deve ser salvo em:

```text
MERCADOPAGO_WEBHOOK_SECRET
```

## Deploy

Deploy nao executado nesta sprint por falta de projeto staging/sandbox explicitamente aprovado.

Comandos esperados quando houver staging:

```bash
supabase functions deploy create-caminho-hospedagem-pix-payment --project-ref <PROJECT_REF> --use-api
supabase functions deploy mercadopago-webhook --project-ref <PROJECT_REF> --use-api --no-verify-jwt
```

Secrets esperados:

```bash
supabase secrets set \
  SUPABASE_URL=https://<PROJECT_REF>.supabase.co \
  SUPABASE_ANON_KEY=<anon_key> \
  SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
  HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN=<mp_sandbox_token> \
  MERCADOPAGO_WEBHOOK_SECRET=<mp_webhook_secret> \
  EDGE_ALLOWED_ORIGINS=https://<staging-app-domain>
```

## Validacao sandbox

Nao executada contra Mercado Pago real/sandbox remoto nesta sprint, pelos bloqueios:

- falta `PROJECT_REF` de staging/sandbox explicitamente aprovado;
- falta token sandbox Mercado Pago no ambiente seguro;
- falta webhook publico configurado no painel Mercado Pago;
- push remoto GitHub segue bloqueado por credencial no ambiente atual.

## Checklist de validacao quando staging estiver pronto

1. Aplicar migrations de Hospedagens no projeto staging.
2. Configurar secrets sem expor valores.
3. Deployar `create-caminho-hospedagem-pix-payment`.
4. Deployar `mercadopago-webhook` com `--no-verify-jwt`.
5. Configurar webhook Mercado Pago para `https://<PROJECT_REF>.supabase.co/functions/v1/mercadopago-webhook`.
6. Criar pousada teste aprovada/visivel.
7. Criar quarto teste ativo/disponivel.
8. Criar disponibilidade real por `quarto_id`.
9. Criar reserva com `status = 'aguardando_pagamento'` e `status_pagamento = 'pendente'`.
10. Gerar PIX sandbox pela tela/app ou chamada autenticada.
11. Confirmar que `provider_payment_id` foi salvo.
12. Aprovar pagamento sandbox.
13. Confirmar webhook recebido em logs.
14. Confirmar reserva `status = 'confirmada'` e `status_pagamento = 'aprovada'`.
15. Reenviar webhook e confirmar idempotencia.
16. Validar painel da pousada exibindo reserva confirmada.

## Respostas obrigatorias

### Secrets necessarios

Necessarios e padronizados neste documento:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `EDGE_ALLOWED_ORIGINS`

Aliases aceitos:

- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADOPAGO_ACCESS_TOKEN`

### Functions deployadas

Nao deployadas nesta sprint. Motivo: sem projeto staging/sandbox explicitamente aprovado. Nao foi feito deploy no projeto dedicado documentado para evitar tocar producao/dedicado sem aprovacao.

### Webhook configurado

Nao configurado nesta sprint. A URL e o procedimento foram documentados.

### Pagamento sandbox aprovado?

Nao. Pagamento sandbox externo nao foi realizado por falta de credenciais sandbox e webhook publico configurado.

### Reserva confirmou?

Nao em staging externo. Localmente, na GO LIVE 002, a simulacao de webhook aprovado confirmou a reserva e a consulta do painel encontrou o registro.

### Painel atualizou?

Nao validado em staging externo. O caminho tecnico ja esta implementado e validado localmente por banco.

### Falhas encontradas

P1:

- ausencia de staging explicitamente aprovado para deploy;
- ausencia de token Mercado Pago sandbox no ambiente seguro;
- webhook Mercado Pago ainda nao configurado externamente;
- validacao real de evento Mercado Pago ainda pendente.

P2:

- docs antigos ainda citavam tokens genericos; nesta sprint foi padronizado o token dedicado `HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN`.

### Pronto para piloto pago assistido?

**Ainda nao.**

O codigo esta preparado para staging, mas o piloto pago assistido exige uma validacao real Mercado Pago sandbox com webhook publico recebido e idempotencia comprovada no ambiente remoto.

## Proxima sprint recomendada

GO LIVE 004 - Execucao Sandbox Assistida:

1. Fornecer/aprovar `PROJECT_REF` de staging.
2. Configurar secrets sandbox em canal seguro.
3. Deployar as duas Edge Functions.
4. Configurar webhook Mercado Pago.
5. Realizar PIX sandbox aprovado.
6. Validar logs, reserva confirmada e painel da pousada.
