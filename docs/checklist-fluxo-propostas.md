# Checklist Funcional - Fluxo de Propostas

## Pré-requisitos
- Usuário A: conta `cliente` logada.
- Usuário B: conta `profissional` logada.
- Pelo menos 1 pedido criado pelo cliente com status `aguardando_proposta`.

## Fluxo 1 - Profissional envia proposta
1. No app do profissional, abrir `Pedidos`.
2. Entrar em um pedido disponível.
3. Tocar em `Enviar proposta`.
4. Preencher:
   - Valor: `150`
   - Descrição: `Executo o serviço com garantia.`
5. Tocar em `Enviar proposta`.

Resultado esperado:
- Exibir alerta de sucesso.
- Redirecionar para `Minhas propostas`.
- A proposta aparece na lista do profissional.

## Fluxo 2 - Cliente visualiza proposta em Meus Pedidos
1. No app do cliente, abrir `Meus pedidos`.
2. Localizar o mesmo pedido.

Resultado esperado:
- Botão `Minhas propostas` habilitado para o pedido.
- Badge/contagem de não lidas pode aparecer quando aplicável.

## Fluxo 3 - Cliente visualiza proposta no detalhe do pedido
1. No app do cliente, abrir o detalhe do pedido.
2. Verificar botão `Ver Propostas`.
3. Tocar em `Ver Propostas`.

Resultado esperado:
- Lista de propostas carregada.
- Proposta enviada pelo profissional aparece com valor e descrição.

## Fluxo 4 - Cliente aceita proposta
1. Na tela de propostas do pedido, tocar em `Aceitar proposta`.
2. Confirmar no alerta.

Resultado esperado:
- Status da proposta aceita muda para `aceita`.
- Pedido avança para etapa de pagamento/execução conforme fluxo atual.

## Fluxo 5 - Proteção contra envio duplicado
1. No app do profissional, voltar ao mesmo pedido após ter enviado proposta.
2. Entrar novamente em `Enviar proposta`.

Resultado esperado:
- Tela informa que proposta já foi enviada para aquele pedido.
- Não cria proposta duplicada.

## Fluxo 6 - Regressão visual/funcional
1. Atualizar (pull-to-refresh) em:
   - `Meus pedidos` (cliente)
   - `Minhas propostas` (cliente)
   - `Minhas propostas` (profissional)

Resultado esperado:
- Dados consistentes nas três telas.
- Nenhuma tela quebra ou fica em loading infinito.
