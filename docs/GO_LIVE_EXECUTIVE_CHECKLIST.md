# GO LIVE Executive Checklist

Hospedagens Caminhos da Fe

## Decisao de entrada

Use este checklist antes de receber clientes/pousadas reais.

Status recomendado hoje:

- **Piloto assistido:** permitido com controles.
- **Venda paga autonoma:** nao permitido.

## Gate 1 - Produto

- [ ] Pousada parceira real cadastrada.
- [ ] Pousada revisada e aprovada.
- [ ] Quartos reais cadastrados.
- [ ] Disponibilidade real por quarto/data cadastrada.
- [ ] Catalogo publico exibindo apenas pousadas aprovadas/visiveis.
- [ ] Reserva criada no Supabase.
- [ ] Painel da pousada exibindo a reserva.
- [ ] Canal de suporte ativo.

## Gate 2 - Pagamento

- [ ] Projeto staging/sandbox aprovado.
- [ ] `SUPABASE_URL` configurado.
- [ ] `SUPABASE_ANON_KEY` configurado.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado.
- [ ] `HOSPEDAGENS_MERCADO_PAGO_ACCESS_TOKEN` configurado com token sandbox.
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` configurado.
- [ ] `EDGE_ALLOWED_ORIGINS` configurado.
- [ ] `create-caminho-hospedagem-pix-payment` deployada.
- [ ] `mercadopago-webhook` deployada com webhook publico.
- [ ] Webhook Mercado Pago apontando para `/functions/v1/mercadopago-webhook`.
- [ ] PIX sandbox gerado.
- [ ] PIX sandbox aprovado.
- [ ] Webhook recebido.
- [ ] Reserva alterada para `confirmada/aprovada`.
- [ ] Reenvio de webhook validado como idempotente.

## Gate 3 - Seguranca

- [ ] Matrizes RLS `02` e `03` executadas em ambiente equivalente.
- [ ] Grants minimos aplicados.
- [ ] Anon sem acesso a dados privados.
- [ ] Cliente sem acesso a dados de outro cliente.
- [ ] Owner/pousada acessa apenas dados do tenant/produto.
- [ ] Storage revisado para o piloto.
- [ ] Secrets nao expostos em logs, docs ou app.
- [ ] Service role usado somente em Edge Functions.

## Gate 4 - Operacao

- [ ] Backup/snapshot antes de migrations remotas.
- [ ] Plano de rollback definido.
- [ ] Logs das Edge Functions acessiveis.
- [ ] Responsavel operacional definido.
- [ ] Canal de suporte para peregrino definido.
- [ ] Canal de suporte para pousada definido.
- [ ] Processo manual para falha de pagamento definido.
- [ ] Processo manual para reembolso definido.
- [ ] Processo manual para cancelamento definido.
- [ ] Checklist de plantao nas primeiras 24h definido.

## Gate 5 - UX

- [ ] Teste em celular real.
- [ ] Login testado com peregrino.
- [ ] Login testado com pousada.
- [ ] Conta sem reservas testada.
- [ ] Conta com reserva pendente testada.
- [ ] Conta com reserva confirmada testada.
- [ ] Estado de gateway nao configurado nao aparece para usuario real.
- [ ] Mensagens de erro compreensiveis.
- [ ] Loading sem travamento.
- [ ] Botao de pagamento nao permite clique duplicado durante processamento.

## Gate 6 - Juridico e publico

- [ ] Termos de uso publicados.
- [ ] Politica de privacidade publicada.
- [ ] Canal LGPD publicado.
- [ ] Politica de cancelamento validada.
- [ ] Politica de reembolso validada.
- [ ] Politica da pousada validada.
- [ ] Dominio publico validado.
- [ ] CORS validado no dominio final ou staging.

## Criterios para piloto assistido

Todos estes precisam estar verdadeiros:

- [ ] Uma pousada real aprovada.
- [ ] Um quarto real disponivel.
- [ ] Um operador acompanhando.
- [ ] Suporte manual ativo.
- [ ] Pagamento sandbox validado ou cobranca manual assumida explicitamente.
- [ ] Reserva aparece no painel da pousada.
- [ ] Plano de contingencia para falha de pagamento.

## Criterios para venda paga autonoma

Todos estes precisam estar verdadeiros:

- [ ] PIX Mercado Pago sandbox aprovado ponta a ponta.
- [ ] Webhook externo validado.
- [ ] Idempotencia validada por reenvio.
- [ ] Monitoramento e alertas ativos.
- [ ] Reembolso/cancelamento operacional fechado.
- [ ] Storage com ownership endurecido.
- [ ] `npm run typecheck` passando.
- [ ] Backup/rollback testado.
- [ ] Rodada mobile real concluida.
- [ ] Juridico publicado.

## Go/No-Go

### GO para piloto assistido

Permitido quando Gates 1, 3, 4 e UX minimo estiverem verdes, e Gate 2 estiver em sandbox validado ou cobranca manual assumida.

### NO-GO para venda paga autonoma

Se qualquer item abaixo estiver pendente:

- webhook real nao validado;
- secrets ausentes;
- pagamento aprovado nao confirma reserva;
- painel nao mostra reserva confirmada;
- sem suporte/manual rollback;
- sem termos/politica publicados.
