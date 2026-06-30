# GO LIVE 006 - Public Mercado Pago Webhook Deploy

Casa Mineira - Mercado Pago Webhooks

## Ambiente

Data: 2026-06-30

Projeto Supabase de producao:

- Project ref: `uinrmrclgzztilrtxboq`
- Base URL: `https://uinrmrclgzztilrtxboq.supabase.co`

Nenhum secret foi exposto. Nenhuma UI, RLS, tabela ou regra de banco foi alterada.

## Objetivo

Deixar os webhooks Mercado Pago publicos para POST externo sem JWT obrigatorio, mantendo a seguranca pela assinatura secreta Mercado Pago.

## Configuracao local aplicada

Arquivo:

- `supabase/config.toml`

Configuracao adicionada:

```toml
[functions.mercadopago-webhook]
verify_jwt = false

[functions.mercadopago-webhook-servicos]
verify_jwt = false

[functions.mercadopago-webhook-hospedagens]
verify_jwt = false
```

## Functions deployadas

Deploy executado no projeto `uinrmrclgzztilrtxboq`:

```bash
supabase functions deploy mercadopago-webhook --project-ref uinrmrclgzztilrtxboq --no-verify-jwt
supabase functions deploy mercadopago-webhook-servicos --project-ref uinrmrclgzztilrtxboq --no-verify-jwt
supabase functions deploy mercadopago-webhook-hospedagens --project-ref uinrmrclgzztilrtxboq --no-verify-jwt
```

Resultado: as tres functions foram deployadas com sucesso.

## URLs publicas

| Produto | URL |
| --- | --- |
| Legado/compatibilidade | `https://uinrmrclgzztilrtxboq.supabase.co/functions/v1/mercadopago-webhook` |
| Casa Mineira Servicos | `https://uinrmrclgzztilrtxboq.supabase.co/functions/v1/mercadopago-webhook-servicos` |
| Hospedagens Caminhos da Fe | `https://uinrmrclgzztilrtxboq.supabase.co/functions/v1/mercadopago-webhook-hospedagens` |

## Seguranca

A seguranca nao depende mais de JWT no gateway Supabase para estes webhooks.

A protecao fica em:

- `MERCADOPAGO_WEBHOOK_SECRET`;
- headers `x-signature` e `x-request-id`;
- validacao HMAC ja implementada em `validarAssinaturaMercadoPago`;
- roteamento por `external_reference`;
- isolamento por produto;
- validacao de `tenant_id` e `provider_payment_id` no fluxo de Hospedagens.

## Teste sem Authorization

Chamadas executadas sem header `Authorization`.

### `mercadopago-webhook`

Comando:

```bash
curl -i -sS -X POST "https://uinrmrclgzztilrtxboq.supabase.co/functions/v1/mercadopago-webhook?data.id=go-live-006-audit"
```

Resultado:

```text
HTTP/2 401
{"error":"Assinatura do webhook inválida."}
```

Veredito: **passou**. Nao retornou `UNAUTHORIZED_NO_AUTH_HEADER`.

### `mercadopago-webhook-servicos`

Comando:

```bash
curl -i -sS -X POST "https://uinrmrclgzztilrtxboq.supabase.co/functions/v1/mercadopago-webhook-servicos?data.id=go-live-006-audit"
```

Resultado:

```text
HTTP/2 401
{"error":"Assinatura do webhook inválida."}
```

Veredito: **passou**. Nao retornou `UNAUTHORIZED_NO_AUTH_HEADER` nem `NOT_FOUND`.

### `mercadopago-webhook-hospedagens`

Comando:

```bash
curl -i -sS -X POST "https://uinrmrclgzztilrtxboq.supabase.co/functions/v1/mercadopago-webhook-hospedagens?data.id=go-live-006-audit"
```

Resultado:

```text
HTTP/2 401
{"error":"Assinatura do webhook inválida."}
```

Veredito: **passou**. Nao retornou `UNAUTHORIZED_NO_AUTH_HEADER` nem `NOT_FOUND`.

## Ajuste nos endpoints dedicados

Durante o teste, os wrappers dedicados inicialmente responderam `301` para o endpoint legado. Para webhook financeiro real, isso nao era ideal.

Correcao aplicada:

- `mercadopago-webhook-servicos` agora possui handler completo com produto fixo `servicos`;
- `mercadopago-webhook-hospedagens` agora possui handler completo com produto fixo `hospedagens`;
- ambos continuam usando a mesma logica do webhook legado, mas sem depender de redirect/proxy HTTP interno.

## Status final

| Function | Deployada | JWT obrigatorio | Assinatura Mercado Pago | Status |
| --- | --- | --- | --- | --- |
| `mercadopago-webhook` | Sim | Nao | Sim | Pronta para receber webhook assinado |
| `mercadopago-webhook-servicos` | Sim | Nao | Sim | Pronta para receber webhook assinado |
| `mercadopago-webhook-hospedagens` | Sim | Nao | Sim | Pronta para receber webhook assinado |

## Pronto para Mercado Pago?

**Sim, no criterio de recebimento publico de webhook.**

Os tres endpoints:

- estao deployados;
- nao exigem JWT;
- rejeitam chamada sem assinatura valida;
- estao prontos para receber POST externo do Mercado Pago.

## Proxima validacao obrigatoria

Antes de pagamento real:

1. Configurar no painel Mercado Pago a URL dedicada correta por produto.
2. Enviar evento sandbox real assinado.
3. Confirmar que a reserva/pedido correto foi atualizado.
4. Reenviar o mesmo webhook para validar idempotencia em evento real.
5. Monitorar logs por produto.

