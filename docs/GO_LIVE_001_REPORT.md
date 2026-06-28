# GO LIVE 001 - Primeira Reserva Real Hospedagens Caminhos da Fe

Casa Mineira SaaS - Programa GO LIVE

## Ambiente

Execucao local. Nenhuma alteracao foi aplicada em producao. Nenhuma policy RLS foi alterada. Nenhum dado foi movido ou apagado.

## Objetivo

Substituir mocks pelo fluxo real existente de Hospedagens Caminhos da Fe, aproximando o produto da primeira reserva paga real.

## O que foi alterado

- Home de Hospedagens passou a consumir somente Supabase.
- Detalhe da pousada passou a consumir somente Supabase.
- Reserva deixou de usar AsyncStorage/fallback local.
- Reserva agora exige pousada publicada, quarto ativo/disponivel e disponibilidade `livre` para as datas.
- Painel da pousada deixou de criar quartos/servicos/reservas demonstrativos.
- Minhas reservas, admin, chamados e notificacoes deixaram de cair para dados demonstrativos.
- Webhook Mercado Pago passou a reconhecer `external_reference = caminho_hospedagem:{reservaId}`.
- Ao receber pagamento aprovado no webhook, a reserva e atualizada para `status_pagamento = 'aprovada'` e `status = 'confirmada'`.

## Fluxo real esperado

```text
Pousada entra no painel
-> cria/atualiza cadastro real
-> cria quarto real
-> cadastra disponibilidade livre
-> catalogo publico le Supabase
-> peregrino reserva
-> reserva e gravada no Supabase
-> pagamento Mercado Pago e criado
-> webhook confirma status
-> painel da pousada lista a nova reserva
```

## Teste local executado

Foi executada uma simulacao transacional local com `ROLLBACK`, sem persistir dados:

1. Inseriu pousada aprovada/visivel.
2. Inseriu quarto ativo/disponivel.
3. Inseriu servico ativo.
4. Inseriu disponibilidade `livre`.
5. Inseriu reserva pendente.
6. Simulou confirmacao de pagamento.
7. Confirmou que a reserva ficaria visivel para o painel.
8. Reverteu tudo com `ROLLBACK`.

Resultado:

| Etapa | Resultado |
| --- | --- |
| Catalogo publico | 1 linha real encontrada |
| Quarto publico | 1 linha real encontrada |
| Disponibilidade livre | 1 linha real encontrada |
| Reserva confirmada para painel | 1 linha real encontrada |

## Perguntas GO LIVE

### O catalogo ja e totalmente real?

**Sim, no fluxo principal.**

Home e detalhe consultam Supabase. Nada vem de arrays locais. O catalogo depende de:

- `caminho_hospedagem_pousadas.status = 'aprovada'`
- `visivel = true`
- quartos `ativo = true` e `disponivel = true`
- servicos `ativo = true`
- disponibilidade `status = 'livre'`

### A reserva ja e totalmente real?

**Sim, com uma restricao.**

A reserva nao usa mais AsyncStorage nem fallback local. Ela grava em `caminho_hospedagem_reservas`.

Restricao: a validacao de disponibilidade e por pousada/dia, porque o schema atual nao tem disponibilidade por quarto/dia. Para uma primeira reserva real controlada, isso e aceitavel; para escala, precisa hardening.

### O pagamento ja e totalmente real?

**Parcial.**

A Edge Function cria pagamento Mercado Pago real quando os secrets estao configurados. Se os secrets nao existirem, retorna checkout nao configurado.

Asaas segue documentado, mas nao ativado para cobranca real de Hospedagens.

### O webhook esta funcionando?

**Implementado no codigo para Hospedagens, pendente de validacao externa real.**

O webhook agora trata `caminho_hospedagem:{reservaId}` e atualiza a reserva. Ainda precisa ser testado com evento real do Mercado Pago em ambiente com credencial e webhook publico.

### O painel recebe reservas automaticamente?

**Sim para reservas persistidas no Supabase.**

O painel consulta `caminho_hospedagem_reservas` pelo `hospedagem_slug` da pousada. Quando a reserva e criada e depois confirmada pelo webhook, ela aparece no painel com status, cliente, datas e valores.

### O que ainda impede a primeira reserva real?

Para primeira reserva paga real, faltam:

1. Configurar secrets reais/sandbox do Mercado Pago no Supabase.
2. Publicar/validar webhook Mercado Pago apontando para a Edge Function.
3. Fazer teste real de pagamento aprovado com `external_reference = caminho_hospedagem:{reservaId}`.
4. Cadastrar uma pousada real aprovada/visivel.
5. Cadastrar quarto real ativo/disponivel.
6. Cadastrar disponibilidade livre na data da reserva.
7. Validar manualmente painel da pousada apos webhook.

## Percentual de conclusao

**82% para primeira reserva real controlada.**

Que ja esta pronto:

- Catalogo real: 100%
- Reserva real: 85%
- Painel real: 90%
- Pagamento criado via Mercado Pago: 75%
- Webhook Hospedagens implementado: 70%
- Disponibilidade por pousada: 70%

O percentual nao e 100% porque ainda falta validacao externa do gateway/webhook e disponibilidade granular por quarto.

## Riscos remanescentes

### P0

- Nenhum P0 confirmado localmente.

### P1

- Webhook precisa teste real com Mercado Pago.
- Disponibilidade nao bloqueia quarto especifico por data.
- Secrets de producao/sandbox precisam alinhamento e validacao.
- Asaas nao esta ativo para Hospedagens.

### P2

- Km percorridos depende de campo real de rota/distancia.
- Storage de fotos ainda deve ter hardening de ownership por pousada.
- Perfil usa AsyncStorage para cache local de preferencias do usuario.

## Status lint/build

- `npm run lint`: passou com 6 warnings preexistentes.
- `npm run build`: passou e exportou `dist`.

## Recomendacao

Hospedagens Caminhos da Fe esta pronto para um **ensaio de primeira reserva real em ambiente local/staging com Mercado Pago sandbox**.

Ainda nao e recomendado abrir venda publica ampla antes de validar webhook real, secrets, disponibilidade por quarto e operacao manual de rollback.

## Proxima sprint recomendada

GO LIVE 002 - Pagamento Real Assistido:

1. Configurar Mercado Pago sandbox/staging.
2. Executar pagamento PIX real de teste.
3. Receber webhook real.
4. Confirmar reserva automaticamente.
5. Validar painel da pousada com a reserva confirmada.
6. Definir plano para disponibilidade por quarto/dia.
