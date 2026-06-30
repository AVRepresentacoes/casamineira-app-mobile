# GO LIVE 005 - Webhook Deployment Audit

Casa Mineira - Mercado Pago Webhooks

## Ambiente auditado

Data: 2026-06-30

Projeto Supabase de producao identificado no repositorio:

- `CASA_MINEIRA_SERVICOS_SUPABASE_URL=https://uinrmrclgzztilrtxboq.supabase.co`
- Project ref: `uinrmrclgzztilrtxboq`

Dominio web atual informado:

- `https://casamineiraservicos.app.br`

## Escopo

Funcoes auditadas:

- `mercadopago-webhook`
- `mercadopago-webhook-servicos`
- `mercadopago-webhook-hospedagens`

Nenhum codigo foi alterado. Nenhum deploy foi executado.

## Metodologia

1. Auditoria local de rotas web e Edge Functions.
2. Consulta remota publica via HTTP para cada endpoint Supabase.
3. Tentativa de listar funcoes via Supabase CLI.
4. Chamada autenticada com anon key local no endpoint legado, sem expor segredo, usando um `payment_id` ficticio para verificar se a funcao alcanca a validacao de assinatura.

## Resultado executivo

| Function | Deployado | URL publica | Pronta para pagamento real |
| --- | --- | --- | --- |
| `mercadopago-webhook` | Sim | `https://uinrmrclgzztilrtxboq.supabase.co/functions/v1/mercadopago-webhook` | **Nao** |
| `mercadopago-webhook-servicos` | Nao | `https://uinrmrclgzztilrtxboq.supabase.co/functions/v1/mercadopago-webhook-servicos` | **Nao** |
| `mercadopago-webhook-hospedagens` | Nao | `https://uinrmrclgzztilrtxboq.supabase.co/functions/v1/mercadopago-webhook-hospedagens` | **Nao** |

Motivo principal: o endpoint legado existe, mas esta protegido por JWT no gateway Supabase. O Mercado Pago nao envia `Authorization: Bearer <anon key>`, entao um webhook real sem Authorization seria bloqueado antes de entrar na funcao.

## Detalhe por function

### `mercadopago-webhook`

URL publica:

```text
https://uinrmrclgzztilrtxboq.supabase.co/functions/v1/mercadopago-webhook
```

Status remoto:

- Deployado: **sim**.
- Evidencia: chamada publica `POST` retornou `401 UNAUTHORIZED_NO_AUTH_HEADER` pelo Supabase Edge Runtime.
- Interpretação: a function existe, mas esta com verificacao JWT ativa.

Resposta publica observada:

```text
HTTP/2 401
sb-error-code: UNAUTHORIZED_NO_AUTH_HEADER
sb-project-ref: uinrmrclgzztilrtxboq
x-served-by: supabase-edge-runtime
{"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}
```

Ultima versao publicada:

- **Nao verificavel com as credenciais disponiveis nesta sessao**.
- A CLI retornou: `Access token not provided`.
- Necessario `SUPABASE_ACCESS_TOKEN` ou `supabase login` para consultar metadados/versionamento.

Assinatura secreta Mercado Pago:

- **Configurada na function**, por inferencia.
- Evidencia: chamada autenticada com anon key e `data.id` ficticio entrou na function e retornou:

```text
HTTP/2 401
{"error":"Assinatura do webhook inválida."}
```

Isso indica que `MERCADOPAGO_WEBHOOK_SECRET` esta presente e sendo usado pela funcao.

Token Mercado Pago:

- A funcao usa, em ordem de prioridade no codigo:
  1. `HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN`
  2. `MERCADO_PAGO_ACCESS_TOKEN`
  3. `MERCADOPAGO_ACCESS_TOKEN`
- Remotamente foi possivel inferir que **algum token Mercado Pago esta configurado**, porque a funcao passou pela checagem inicial de configuracao e chegou na validacao de assinatura.
- Nao foi possivel distinguir qual secret especifico esta definido sem acesso autenticado aos secrets do projeto.

Pronta para receber pagamento real:

- **Nao**.
- Motivo: sem `Authorization`, o gateway bloqueia o webhook com `UNAUTHORIZED_NO_AUTH_HEADER`. Para Mercado Pago real, a function precisa estar publicada com JWT verification desativada, ou ser chamada por uma rota/proxy que injete Authorization de forma segura.

### `mercadopago-webhook-servicos`

URL publica:

```text
https://uinrmrclgzztilrtxboq.supabase.co/functions/v1/mercadopago-webhook-servicos
```

Status remoto:

- Deployado: **nao**.
- Evidencia: chamada publica `POST` retornou `404 NOT_FOUND`.

Resposta observada:

```text
HTTP/2 404
sb-error-code: NOT_FOUND
sb-project-ref: uinrmrclgzztilrtxboq
x-served-by: supabase-edge-runtime
{"code":"NOT_FOUND","message":"Requested function was not found"}
```

Ultima versao publicada:

- Nao aplicavel: function nao encontrada no projeto remoto.

Assinatura secreta Mercado Pago:

- Nao verificavel: function nao esta deployada.

Token Mercado Pago:

- Nao verificavel: function nao esta deployada.

Pronta para receber pagamento real:

- **Nao**.
- Motivo: function dedicada de Servicos ainda nao esta publicada no projeto `uinrmrclgzztilrtxboq`.

### `mercadopago-webhook-hospedagens`

URL publica:

```text
https://uinrmrclgzztilrtxboq.supabase.co/functions/v1/mercadopago-webhook-hospedagens
```

Status remoto:

- Deployado: **nao**.
- Evidencia: chamada publica `POST` retornou `404 NOT_FOUND`.

Resposta observada:

```text
HTTP/2 404
sb-error-code: NOT_FOUND
sb-project-ref: uinrmrclgzztilrtxboq
x-served-by: supabase-edge-runtime
{"code":"NOT_FOUND","message":"Requested function was not found"}
```

Ultima versao publicada:

- Nao aplicavel: function nao encontrada no projeto remoto.

Assinatura secreta Mercado Pago:

- Nao verificavel: function nao esta deployada.

Token Mercado Pago:

- Nao verificavel: function nao esta deployada.

Pronta para receber pagamento real:

- **Nao**.
- Motivo: function dedicada de Hospedagens ainda nao esta publicada no projeto `uinrmrclgzztilrtxboq`.

## Rota web no dominio atual

Nao foi encontrada rota web:

```text
https://casamineiraservicos.app.br/api/mercadopago/webhook
```

Evidencias locais:

- Nao existe `app/api/mercadopago/webhook`.
- O projeto possui apenas `app/api/system/health+api.ts`.
- `vercel.json` exporta build estatico para `dist`.

Conclusao: o dominio `https://casamineiraservicos.app.br` nao e o endpoint correto para cadastrar webhook Mercado Pago neste momento.

## URL recomendada hoje

Como as rotas dedicadas ainda nao estao publicadas e o endpoint legado esta com JWT ativo, **nao ha endpoint pronto para pagamento real hoje**.

Quando corrigido o modo publico do endpoint legado, a URL compativel seria:

```text
https://uinrmrclgzztilrtxboq.supabase.co/functions/v1/mercadopago-webhook
```

Quando as rotas dedicadas forem deployadas, as URLs recomendadas passam a ser:

```text
https://uinrmrclgzztilrtxboq.supabase.co/functions/v1/mercadopago-webhook-servicos
https://uinrmrclgzztilrtxboq.supabase.co/functions/v1/mercadopago-webhook-hospedagens
```

## Bloqueadores para pagamento real

### P0

- `mercadopago-webhook` esta deployada, mas com JWT verification ativa no gateway Supabase.
- `mercadopago-webhook-servicos` nao esta deployada.
- `mercadopago-webhook-hospedagens` nao esta deployada.

### P1

- Ultima versao publicada nao foi auditavel sem `SUPABASE_ACCESS_TOKEN`.
- Nomes exatos dos secrets remotos nao foram auditaveis sem acesso autenticado ao projeto.

## Proxima acao recomendada

1. Fazer login/autenticar Supabase CLI com acesso ao projeto `uinrmrclgzztilrtxboq`.
2. Listar funcoes e versoes publicadas.
3. Listar nomes de secrets configurados, sem expor valores.
4. Deployar, em janela controlada, as funcoes dedicadas se aprovadas.
5. Configurar as webhook functions para receberem chamada publica do Mercado Pago sem JWT obrigatório.
6. Validar com webhook sandbox antes de cadastrar para pagamento real.

