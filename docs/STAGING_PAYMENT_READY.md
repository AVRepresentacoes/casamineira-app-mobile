# Staging Payment Ready

Hospedagens Caminhos da Fe - Executive Program 003 Revenue Zero War Room

## Objetivo

Preparar o ambiente de staging para provar a primeira transacao financeira valida do produto Hospedagens Caminhos da Fe, sem usar dinheiro real e sem alterar producao.

## Escopo validado no codigo

| Componente | Status | Evidencia |
| --- | --- | --- |
| `create-caminho-hospedagem-pix-payment` | Pronto para staging | Cria pagamento Mercado Pago com `external_reference = caminho_hospedagem:{reservaId}`. |
| `mercadopago-webhook` | Pronto para staging | Reconhece prefixo `caminho_hospedagem:` e sincroniza reserva. |
| Metadata Mercado Pago | Pronto | Envia `reserva_id`, `tenant_id`, `quarto_id`, `produto`, `hospedagem_slug` e `metodo`. |
| Idempotencia de criacao | Pronto | Usa `X-Idempotency-Key` por reserva/metodo. |
| Idempotencia de webhook | Pronto | Bloqueia downgrade indevido apos aprovacao e valida `provider_payment_id`. |
| Retry seguro | Parcial | Webhook tenta tokens candidatos e registra `retry_token_candidate_failed`. Retry operacional ainda e manual. |
| Rollback seguro | Parcial | Reversao financeira ainda depende de rotina manual/ambiente Mercado Pago. |

## Auditoria Mercado Pago

### Criacao de cobranca

Arquivo:

- `supabase/functions/create-caminho-hospedagem-pix-payment/index.ts`

Confirmado:

- exige usuario autenticado;
- busca reserva por `id` e `cliente_id`;
- rejeita reserva inexistente;
- usa `HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN` antes dos tokens genericos;
- cria `external_reference = caminho_hospedagem:{reservaId}`;
- envia metadata com:
  - `reserva_id`;
  - `tenant_id`;
  - `quarto_id`;
  - `produto = hospedagens_caminhos_da_fe`;
  - `hospedagem_slug`;
  - `metodo`;
- salva `provider = mercadopago`;
- salva `provider_payment_id`;
- salva `status_pagamento`;
- mantem reserva como `aguardando_pagamento` enquanto pagamento estiver pendente;
- confirma reserva imediatamente apenas se Mercado Pago retornar status aprovado.

### Webhook

Arquivo:

- `supabase/functions/mercadopago-webhook/index.ts`

Confirmado:

- aceita evento Mercado Pago com `paymentId` por query/body/resource;
- valida assinatura quando `MERCADOPAGO_WEBHOOK_SECRET` esta configurado;
- consulta pagamento no Mercado Pago;
- processa `external_reference` com prefixo `caminho_hospedagem:`;
- valida `tenant_id` da metadata contra a reserva;
- valida `provider_payment_id` quando ja existe;
- atualiza reserva para:
  - `confirmada` quando `approved`;
  - `aguardando_pagamento` quando `pending`, `cancelled` ou `rejected`;
  - `cancelada_cliente` quando `refunded` ou `charged_back`;
- registra logs seguros para recebido, ignorado, erro Supabase, retry e confirmacao.

## Mapeamento de status

| Mercado Pago | `status_pagamento` | `status` reserva | Observacao |
| --- | --- | --- | --- |
| `approved` | `aprovada` | `confirmada` | Pagamento validado. |
| `pending` | `pendente` | `aguardando_pagamento` | Aguardar webhook posterior ou conciliacao. |
| `cancelled` | `recusada` | `aguardando_pagamento` | Nao confirmar reserva. |
| `rejected` | `recusada` | `aguardando_pagamento` | Nao confirmar reserva. |
| `refunded` | `estornada` | `cancelada_cliente` | Exige acompanhamento operacional. |
| `charged_back` | `estornada` | `cancelada_cliente` | Incidente financeiro. |

## Checklist staging

Nao registrar valores neste documento.

| Item | Obrigatorio | Status esperado |
| --- | --- | --- |
| `PROJECT_REF` | Sim | Projeto Supabase staging correto. |
| `SUPABASE_URL` | Sim | URL do projeto staging. |
| `SUPABASE_ANON_KEY` | Sim | Configurada no app staging. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Configurada somente nas Edge Functions. |
| JWT/Auth | Sim | Login de peregrino e pousada funcionando. |
| `HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN` | Sim | Token sandbox Mercado Pago dedicado de Hospedagens. |
| `MERCADO_PAGO_ACCESS_TOKEN` | Opcional | Fallback documentado. |
| `MERCADOPAGO_ACCESS_TOKEN` | Opcional | Fallback documentado. |
| `MERCADOPAGO_WEBHOOK_SECRET` | Recomendado | Obrigatorio se assinatura estiver habilitada no Mercado Pago. |
| `EDGE_ALLOWED_ORIGINS` | Sim | Inclui origem staging do app. |
| Functions deployadas | Sim | `create-caminho-hospedagem-pix-payment` e `mercadopago-webhook`. |
| Webhook Mercado Pago | Sim | Aponta para `https://<PROJECT_REF>.supabase.co/functions/v1/mercadopago-webhook`. |

## Roteiro de teste assistido

1. Criar pousada teste no tenant `hospedagens-caminhos-da-fe`.
2. Criar quarto real teste.
3. Criar disponibilidade `livre` para o quarto e periodo.
4. Criar reserva com usuario peregrino.
5. Confirmar que a reserva ficou `aguardando_pagamento` e `status_pagamento = pendente`.
6. Gerar PIX sandbox pela tela de pagamento.
7. Confirmar que a reserva recebeu `provider_payment_id`.
8. Aprovar PIX no ambiente sandbox Mercado Pago.
9. Confirmar recebimento do webhook.
10. Confirmar reserva `confirmada` e `status_pagamento = aprovada`.
11. Reenviar webhook e validar idempotencia.
12. Entrar no painel da pousada e confirmar reserva visivel.

## Evidencias obrigatorias

Para considerar o teste Revenue Zero concluido, registrar:

- ID da pousada.
- ID do quarto.
- ID da reserva.
- Payment ID Mercado Pago.
- Horario de criacao da reserva.
- Horario de geracao do PIX.
- Horario do webhook recebido.
- Horario de confirmacao da reserva.
- Print ou log do painel da pousada com reserva confirmada.
- Resultado do reenvio do webhook.

## Tudo que falta para um pagamento real

1. Confirmar secrets sandbox em Supabase staging.
2. Deployar as duas Edge Functions no projeto staging.
3. Configurar webhook publico no painel Mercado Pago sandbox.
4. Criar massa real de teste: pousada, quarto, disponibilidade e peregrino.
5. Executar PIX sandbox aprovado com evento real.
6. Registrar evidencias no scoreboard.
7. Validar processo manual de reembolso/cancelamento antes de qualquer producao.
8. Aprovar janela e checklist antes de trocar para credenciais reais.

## GO / NO-GO

| Marco | Decisao | Motivo |
| --- | --- | --- |
| Primeiro pagamento sandbox | GO condicionado | Codigo esta pronto; falta ambiente staging com secrets e webhook publico. |
| Primeiro pagamento producao | NO-GO | Falta prova sandbox com evidencia e rotina de contingencia assinada. |
| Primeira pousada | GO | Cadastro/painel ja existem para operacao assistida. |
| Primeiro cliente | GO condicionado | Requer pousada/quarto/disponibilidade reais e acompanhamento humano. |
| Primeiro faturamento | NO-GO ate sandbox aprovado | Nao usar dinheiro real antes da prova completa em staging. |

