# GO LIVE 007 - First Sandbox Payment End-to-End

Hospedagens Caminhos da Fe - Mercado Pago Sandbox

## Ambiente auditado

Data: 2026-06-30

Projeto Supabase:

- Project ref: `uinrmrclgzztilrtxboq`
- Base URL: `https://uinrmrclgzztilrtxboq.supabase.co`

Nenhum secret foi exposto. Nenhuma UI, RLS ou arquitetura foi alterada.

## Resultado executivo

**Sandbox end-to-end ainda nao concluido.**

O ambiente de webhook esta pronto para receber notificacoes externas do Mercado Pago, mas a transacao completa nao foi executada porque falta uma conta de usuario sandbox autenticada com reserva real de Hospedagens no projeto de producao/staging auditado.

Sem sessao de usuario e reserva real, a Edge Function de criacao de PIX bloqueia corretamente a chamada.

## Etapa 1 - Auditoria

### Edge Functions

Resultado de `supabase functions list --project-ref uinrmrclgzztilrtxboq`:

| Function | Status | Versao | Updated at UTC |
| --- | --- | ---: | --- |
| `mercadopago-webhook` | ACTIVE | 38 | 2026-06-30 03:57:30 |
| `mercadopago-webhook-servicos` | ACTIVE | 4 | 2026-06-30 04:01:24 |
| `mercadopago-webhook-hospedagens` | ACTIVE | 4 | 2026-06-30 04:01:23 |
| `create-caminho-hospedagem-pix-payment` | ACTIVE | 1 | 2026-06-22 22:37:27 |

### Secrets

Resultado de `supabase secrets list --project-ref uinrmrclgzztilrtxboq` confirmou nomes de secrets, sem expor valores.

| Secret | Status |
| --- | --- |
| `MERCADO_PAGO_ACCESS_TOKEN` | Configurado |
| `MERCADOPAGO_WEBHOOK_SECRET` | Configurado |
| `SUPABASE_SERVICE_ROLE_KEY` | Configurado |
| `SUPABASE_URL` | Configurado |
| `SUPABASE_ANON_KEY` | Configurado |
| `HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN` | **Nao configurado** |

Observacao: `create-caminho-hospedagem-pix-payment` e `mercadopago-webhook-hospedagens` usam fallback para `MERCADO_PAGO_ACCESS_TOKEN` quando `HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN` nao existe. Portanto, a ausencia do token dedicado nao bloqueia tecnicamente o sandbox, mas reduz isolamento operacional de Hospedagens.

### Deploy correto

As tres Edge Functions de webhook estao publicadas e publicas sem JWT obrigatorio.

Teste sem `Authorization`:

| Endpoint | Resultado |
| --- | --- |
| `/functions/v1/mercadopago-webhook` | `HTTP/2 401` com `Assinatura do webhook invalida` |
| `/functions/v1/mercadopago-webhook-servicos` | `HTTP/2 401` com `Assinatura do webhook invalida` |
| `/functions/v1/mercadopago-webhook-hospedagens` | `HTTP/2 401` com `Assinatura do webhook invalida` |

Veredito: **correto**. Nao ha mais `Missing authorization header` nos webhooks; a protecao passa pela assinatura Mercado Pago.

## Etapa 2 - Fluxo completo

Fluxo solicitado:

```text
Reserva
-> Criar preferencia/cobranca Mercado Pago
-> Gerar PIX Sandbox
-> Efetuar pagamento Sandbox
-> Webhook
-> Atualizar banco
-> Reserva Confirmada
-> Painel da pousada atualizado
```

### Execucao realizada

Foi testada a entrada publica da Edge Function de criacao de PIX sem sessao de usuario:

```bash
curl -i -sS -X POST "https://uinrmrclgzztilrtxboq.supabase.co/functions/v1/create-caminho-hospedagem-pix-payment" \
  -H "Content-Type: application/json" \
  -d '{"reservaId":"go-live-007-audit","metodo":"pix"}'
```

Resultado:

```text
HTTP/2 401
{"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}
```

Veredito: **correto para seguranca**. A funcao de criacao de pagamento exige usuario autenticado. Isso impede gerar PIX sem uma reserva real pertencente ao usuario.

### Onde o fluxo parou

O fluxo parou antes da criacao de cobranca Mercado Pago.

Motivo:

- nao ha credencial de usuario sandbox/peregrino real disponivel nesta sessao;
- nao ha `access_token` de usuario autenticado para chamar `create-caminho-hospedagem-pix-payment`;
- nao foi fornecido `reservaId` real de Hospedagens pertencente a um usuario autenticado;
- os dados de personas `cliente_hospedagens+rls016@local.test` sao locais e nao devem ser usados como producao.

## Etapa 3 - Evidencias

| Evidencia | Resultado |
| --- | --- |
| ID da reserva | Nao gerado nesta execucao |
| ID do pagamento | Nao gerado nesta execucao |
| `external_reference` | Nao gerado nesta execucao |
| `tenant_id` | Nao aplicavel sem reserva |
| `quarto_id` | Nao aplicavel sem reserva |
| Status antes | Nao aplicavel sem reserva |
| Status depois | Nao aplicavel sem reserva |
| Resposta do webhook | Webhook sem assinatura retorna `401 Assinatura do webhook invalida` |
| Logs da Edge Function | Nao consultados via dashboard nesta sessao |
| Atualizacao da reserva | Nao executada |
| Atualizacao do painel | Nao executada |

## Etapa 4 - Validacao

| Check | Resultado | Observacao |
| --- | --- | --- |
| Webhook recebido | Parcial | Endpoints recebem POST publico e chegam na validacao de assinatura. |
| Assinatura validada | Parcial | Assinatura ausente/invalida e rejeitada corretamente; nao houve evento assinado real. |
| Idempotencia funcionando | Nao validado com pagamento real | Requer reenvio de webhook real assinado com mesmo `payment_id`. |
| Nenhuma atualizacao duplicada | Nao validado com pagamento real | Requer pagamento aprovado e reenvio. |
| Reserva confirmada automaticamente | Nao validado | Requer PIX sandbox pago e webhook assinado. |

## Checklist final

### Sandbox OK?

**Nao concluido.**

Infra de webhook esta OK, mas a transacao sandbox nao foi executada.

### Webhook OK?

**Sim para recebimento publico e bloqueio por assinatura.**

Ainda falta validar com evento real assinado do Mercado Pago.

### Banco atualizado?

**Nao.**

Nao houve pagamento sandbox aprovado nem webhook real para atualizar reserva.

### Painel atualizado?

**Nao.**

Sem reserva confirmada, nao houve alteracao a refletir no painel.

### Pode receber o primeiro cliente real?

**Nao ainda.**

Pode receber apenas piloto operacional assistido depois de validar uma conta peregrino/pousada real em staging e executar PIX sandbox aprovado.

### Pode receber o primeiro PIX real?

**Nao ainda.**

Antes do PIX real, e obrigatorio executar:

1. reserva real de teste;
2. PIX sandbox gerado;
3. pagamento sandbox aprovado;
4. webhook assinado recebido;
5. reserva confirmada automaticamente;
6. painel da pousada atualizado;
7. reenvio do webhook para idempotencia.

## Bloqueios

### P0 - Falta conta/reserva sandbox autenticada

Sem usuario autenticado e `reservaId` real, a function de pagamento bloqueia corretamente com `UNAUTHORIZED_NO_AUTH_HEADER`.

Acao necessaria:

- criar ou informar uma conta peregrino sandbox;
- criar uma pousada/quarto/disponibilidade real de teste;
- criar uma reserva real;
- executar o pagamento pela tela ou por chamada autenticada.

### P1 - Token dedicado de Hospedagens ausente

`HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN` nao esta configurado.

O fallback `MERCADO_PAGO_ACCESS_TOKEN` existe e permite operacao com a conta compartilhada, mas para metricas e isolamento operacional recomenda-se configurar o secret dedicado ou documentar oficialmente que Hospedagens usara o token compartilhado.

## Proxima execucao recomendada

1. Criar usuario peregrino sandbox no projeto `uinrmrclgzztilrtxboq`.
2. Criar pousada, quarto e disponibilidade real de teste.
3. Criar reserva real pelo app.
4. Gerar PIX pelo app.
5. Pagar PIX sandbox pelo Mercado Pago.
6. Verificar logs da Edge Function no dashboard.
7. Confirmar status no banco.
8. Confirmar painel da pousada.
9. Reenviar webhook real para idempotencia.

## Status final

**Nao pronto para primeiro PIX real.**

**Pronto para executar a primeira validacao sandbox assistida assim que houver usuario/reserva sandbox real.**

