# Mercado Pago em Produção

## Objetivo
Garantir conciliação correta de pagamentos e atualização financeira no app.
Compatível com pedidos de orçamento e com pedidos no modo atendimento rápido.

## Provedor de pagamento no app
- Variável: `EXPO_PUBLIC_PAYMENT_PROVIDER`
- Valores:
  - `mercadopago` (padrão)
  - `asaas` (PIX via Asaas; cartão permanece Mercado Pago por enquanto)

## Secrets obrigatórios (Supabase Edge Functions)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET` (recomendado para validar assinatura do webhook)
- `APP_SCHEME` (ex.: `casamineira://`)

## Variável obrigatória no app (checkout transparente)
- `EXPO_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`

## Asaas (PIX)
- `create-asaas-pix-payment`
  - Cria/recupera cliente no Asaas.
  - Gera cobrança PIX.
  - Retorna `qr_code` e `qr_code_base64` para exibição no app.
  - Faz upsert idempotente em `pagamentos`.
- `asaas-webhook`
  - Consulta pagamento no Asaas pelo `payment.id`.
  - Atualiza `pagamentos`, `comissoes` e `pedidos`.
  - Deploy em produção com `--no-verify-jwt`.
- Secrets extras:
  - `ASAAS_API_KEY`
  - `ASAAS_WEBHOOK_TOKEN` (recomendado)

## Functions
- `create-mercadopago-preference`
  - Cria preference.
  - Garante comissão (upsert) quando necessário.
  - Persiste/atualiza registro em `pagamentos`.
- `create-mercadopago-card-payment`
  - Recebe token de cartão (gerado no app com `PUBLIC_KEY`).
  - Cria pagamento via `/v1/payments` sem redirecionamento.
  - Persiste/atualiza registro em `pagamentos`.
- `create-mercadopago-pix-payment`
  - Gera cobrança PIX via `/v1/payments`.
  - Retorna `qr_code` e `qr_code_base64` para exibir no app.
- `mercadopago-webhook`
  - Lê status do pagamento no MP.
  - Faz upsert idempotente em `pagamentos`.
  - Atualiza `comissoes.status_pagamento`.
  - Move pedido para `em_execucao` quando aprovado.
  - Deploy em produção com `--no-verify-jwt` (webhook externo do Mercado Pago).

## Teste ponta a ponta
1. Cliente aceita proposta.
2. Cliente abre pagamento e gera checkout.
3. Simular/aprovar pagamento no MP.
4. Verificar no banco:
   - `pagamentos.status_pagamento = aprovada`
   - `comissoes.status_pagamento = pago`
   - `pedidos.status = em_execucao`

## Queries úteis de validação
```sql
select id, pedido_id, status_pagamento, payment_id, preference_id, updated_at
from public.pagamentos
order by updated_at desc
limit 20;
```

```sql
select pedido_id, status_pagamento, valor_total, valor_comissao, valor_profissional
from public.comissoes
order by created_at desc
limit 20;
```

```sql
select id, status, updated_at
from public.pedidos
order by updated_at desc
limit 20;
```
