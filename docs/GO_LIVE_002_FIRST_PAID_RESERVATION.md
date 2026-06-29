# GO LIVE 002 - First Paid Reservation

Hospedagens Caminhos da Fe

## Ambiente

Validacao executada em Supabase local.

- API local: `http://127.0.0.1:54321`
- Banco local: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Nenhum comando foi executado contra producao. Nenhuma UI visual foi alterada. Nenhuma policy RLS foi alterada. Casa Mineira Servicos e SaaS Control Plane ficaram fora do escopo.

## Objetivo

Fechar o ciclo da primeira reserva paga:

```text
pousada real
-> quarto real
-> disponibilidade por quarto/data
-> reserva pendente
-> pagamento Mercado Pago
-> webhook aprovado
-> reserva confirmada
-> painel da pousada
```

## Migration criada

Arquivo:

- `supabase/migrations/20260629090000_go_live_002_hospedagens_paid_reservation_pipeline.sql`

Mudancas:

- adiciona `quarto_id` em `caminho_hospedagem_disponibilidade`;
- adiciona `quarto_id` em `caminho_hospedagem_reservas`;
- troca a unicidade de disponibilidade para `pousada_id, quarto_id, dia`;
- cria indice de disponibilidade por quarto/data/status;
- cria constraint de exclusao para impedir sobreposicao de reservas `aguardando_pagamento` ou `confirmada` no mesmo `tenant_id`, `quarto_id` e periodo.

## Disponibilidade por quarto

**Existe agora.**

A disponibilidade deixa de depender somente de `pousada_id + dia` e passa a aceitar `quarto_id + dia`.

O painel da pousada manteve a mesma experiencia visual, mas ao salvar um dia ele grava disponibilidade para os quartos reais cadastrados da pousada.

## Reserva

Antes de criar a reserva, o app agora valida:

- pousada aprovada e visivel;
- quarto real com `quarto_id`;
- quarto ativo e disponivel;
- disponibilidade livre para todos os dias do periodo;
- conflito com reserva pendente ou confirmada no mesmo quarto/periodo.

Depois de criar:

- `status = 'aguardando_pagamento'`;
- `status_pagamento = 'pendente'`;
- `quarto_id` fica gravado na reserva.

O banco tambem bloqueia corrida concorrente por constraint, entao duas reservas simultaneas para o mesmo quarto/periodo nao devem passar.

## Pagamento Mercado Pago

O endpoint `create-caminho-hospedagem-pix-payment` ja criava:

```text
external_reference = caminho_hospedagem:{reservaId}
```

Nesta sprint, o payload Mercado Pago tambem passou a enviar metadata de:

- `tenant_id`;
- `quarto_id`;
- `reserva_id`;
- `produto = hospedagens_caminhos_da_fe`.

O `provider_payment_id` e o `status_pagamento` seguem sendo salvos na reserva quando o Mercado Pago retorna a cobranca.

## Webhook

O `mercadopago-webhook` foi endurecido para reservas de Hospedagens:

- reconhece `external_reference = caminho_hospedagem:{reservaId}`;
- busca a reserva antes de atualizar;
- confere `tenant_id` quando recebido na metadata;
- impede trocar `provider_payment_id` de uma reserva;
- evita downgrade de pagamento ja aprovado por evento atrasado;
- atualiza aprovado para `status = 'confirmada'` e `status_pagamento = 'aprovada'`;
- atualiza recusado/cancelado para `status_pagamento = 'recusada'`;
- atualiza estorno para `status = 'cancelada_cliente'`, `status_pagamento = 'estornada'` e `cancelado_por = 'sistema'`.

Validacao local: o teste SQL simulou o efeito de webhook aprovado no banco. Validacao com evento externo real do Mercado Pago ainda depende de secrets reais/sandbox e callback acessivel.

## Painel da pousada

O painel consulta `caminho_hospedagem_reservas` por `tenant_id` e `hospedagem_slug`.

No teste local, apos a simulacao de pagamento aprovado, a reserva apareceu como:

- cliente: presente na linha de reserva;
- datas: `checkin`/`checkout`;
- status: `confirmada`;
- valor: `total`, `sinal`, `repasse_inicial`, `restante_na_pousada`;
- pagamento: `provider = mercadopago` e `provider_payment_id` gravado.

## Testes executados

Migration local:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/migrations/20260629090000_go_live_002_hospedagens_paid_reservation_pipeline.sql
```

Seed e matrizes:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/seed/rls_personas_seed.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls/02_persona_access_matrix.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls/03_hospedagens_extended_access_matrix.sql
```

Resultados:

- Matriz `02`: **36 checks passaram, 0 falhas**.
- Matriz `03`: **52 checks passaram, 0 falhas P0/P1**.

Teste GO LIVE 002:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/04_hospedagens_paid_reservation_pipeline.sql
```

Resultado:

| Cenario | Esperado | Atual | Resultado |
| --- | --- | --- | --- |
| Disponibilidade por quarto/data | 2 dias livres com `quarto_id` | 2 | Passou |
| Conflito no mesmo quarto/periodo | bloqueado | bloqueado | Passou |
| Webhook aprovado atualiza status | confirmada/aprovada | confirmada/aprovada | Passou |
| Painel recebe reserva confirmada | 1 | 1 | Passou |

## Respostas obrigatorias

### O catalogo ja e totalmente real?

Sim no fluxo de dados principal: home/detalhe usam Supabase. Nesta sprint, a reserva tambem passou a exigir quarto real com `quarto_id`.

### A reserva ja e totalmente real?

Sim no recorte local: a reserva e criada somente no Supabase, sem fallback local de sucesso. Agora grava `quarto_id`, valida disponibilidade do quarto e bloqueia conflito de periodo.

### O pagamento ja e totalmente real?

Parcial. O endpoint Mercado Pago esta preparado para cobranca real quando os secrets estiverem configurados. Sem token real/sandbox, o fluxo retorna configuracao pendente.

### O webhook esta funcionando?

Funcional em codigo para `external_reference = caminho_hospedagem:{reservaId}` e endurecido contra tenant/payment id incorretos. Validado localmente por simulacao de status aprovado no banco. Falta validar evento real Mercado Pago em staging com token e webhook publico.

### O painel recebe reservas automaticamente?

Sim. A consulta do painel enxerga a reserva confirmada gravada em `caminho_hospedagem_reservas` para a pousada.

### O que ainda impede pagamento real?

- configurar secrets Mercado Pago reais/sandbox no ambiente de staging;
- expor a Edge Function de webhook em URL acessivel pelo Mercado Pago;
- disparar pagamento real/sandbox e confirmar recebimento do evento externo;
- validar assinatura do webhook com `MERCADOPAGO_WEBHOOK_SECRET` quando configurado.

## Status de conclusao

Conclusao tecnica local do pipeline: **85%**.

O ciclo banco/app/webhook esta pronto para teste pago em staging. Os 15% restantes dependem de credenciais Mercado Pago, URL publica de webhook e validacao com evento real externo.

## Proxima sprint recomendada

GO LIVE 003 - Validacao Mercado Pago em staging:

1. Configurar secrets Mercado Pago sandbox.
2. Publicar/servir webhook em URL acessivel.
3. Executar PIX sandbox real.
4. Confirmar evento externo no webhook.
5. Validar painel da pousada com pagamento real aprovado.
