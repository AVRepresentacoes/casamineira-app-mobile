# Hospedagens Caminhos da Fé: Play Store e Operação

## Nome do app

Hospedagens Caminhos da Fé

## Descrição curta

Reserve pousadas e quartos no Caminho da Fé.

## Descrição completa

Planeje sua peregrinação com mais segurança.

O Hospedagens Caminhos da Fé ajuda peregrinos a encontrar pousadas, quartos e pontos de apoio por cidade, ramal e etapa da rota até Aparecida.

No app, você pode consultar hospedagens próximas ao caminho, verificar serviços úteis para peregrinos e reservar com sinal seguro de 50%.

Recursos principais:

- Pousadas por cidade e ramal
- Quartos privativos e compartilhados
- Filtros por café, jantar, lavanderia, bike e apoio ao peregrino
- Reserva com sinal de 50%
- Política clara de cancelamento
- Reembolso integral quando a pousada descumpre a reserva
- Multa operacional para pousada em caso de descumprimento

O app nasce com foco em pousadas e peregrinos do Caminho da Fé, com expansão gradual conforme novos parceiros forem validados.

## Dados comerciais modelo

- Empresa responsável: Caminhos da Fé Hospedagens LTDA
- CNPJ modelo: 00.000.000/0001-00
- WhatsApp suporte: +55 35 99999-0000
- Email suporte: suporte@hospedagenscaminhosdafe.com.br
- Política de privacidade: https://hospedagenscaminhosdafe.com.br/privacidade
- Termos de uso: https://hospedagenscaminhosdafe.com.br/termos

## Regras de negócio

- Sinal obrigatório: 50% do valor total da reserva
- Comissão de lançamento: 12% sobre o valor total da reserva
- Comissão padrão futura: 15% sobre o valor total da reserva
- Restante: pago diretamente na pousada no check-in
- Multa por descumprimento da pousada: 10% sobre o valor total da reserva

## Política de cancelamento

- Cancelamento com 72h ou mais: reembolso de 80% do sinal
- Cancelamento entre 72h e 24h: reembolso de 50% do sinal
- Cancelamento com menos de 24h: sem reembolso do sinal
- Não comparecimento: sem reembolso do sinal
- Pousada cancela ou descumpre: reembolso de 100% do sinal ao peregrino e multa de 10% do valor total para a pousada

## Credenciais pendentes

Adicionar no Supabase antes da cobrança real:

```text
HOSPEDAGENS_PAYMENT_PROVIDER=mercadopago
MERCADOPAGO_ACCESS_TOKEN=
```

Ou:

```text
HOSPEDAGENS_PAYMENT_PROVIDER=asaas
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
```

## Checklist antes da publicação

- Substituir dados comerciais modelo
- Definir logo e ícone final
- Confirmar domínio e URLs públicas
- Validar política de privacidade com advogado
- Validar termos de uso e contrato de pousadas
- Cadastrar pousadas reais autorizadas
- Testar PIX real em sandbox
- Configurar webhooks de pagamento
- Criar screenshots reais do app
- Enviar AAB para Google Play Console

## Screenshots sugeridos

1. Splash com identidade Hospedagens Caminhos da Fé
2. Home com busca por cidade, filtros e pousadas em destaque
3. Detalhe da pousada com quartos, serviços e botão de reserva
4. Tela de reserva com serviços adicionais e resumo financeiro
5. Tela de pagamento com PIX/cartão e sinal de 50%
6. Histórico de hospedagens com comprovante da reserva
7. Painel da pousada com reservas, quartos, fotos e preços
8. Painel administrativo com GMV, pousadas e conciliação

## Teste interno antes da Play Store

- Criar conta de cliente com email exclusivo
- Criar conta de pousada com outro email exclusivo
- Confirmar que conta de pousada não entra como cliente
- Confirmar que conta cliente não entra como pousada
- Cadastrar pousada, quarto, preço e foto
- Aprovar/publicar pousada no painel admin
- Criar reserva pelo cliente
- Gerar PIX em ambiente de teste
- Confirmar/cancelar reserva no painel da pousada
- Conferir histórico e comprovante do cliente
- Validar botão Minha conta, logout e retomada de sessão

## Data Safety: rascunho

Dados coletados:

- Nome, email e telefone para cadastro, login, suporte e reserva
- Cidade de origem e dados de jornada para planejamento do cliente
- Dados comerciais da pousada, CNPJ, endereço, WhatsApp, quartos, fotos e preços
- Dados de reserva: datas, hóspedes, valores, serviços adicionais e status
- Dados de pagamento processados pelo provedor configurado; o app não deve armazenar dados completos de cartão

Finalidade:

- Autenticação e segurança da conta
- Execução de reservas e atendimento ao cliente
- Comunicação entre cliente, pousada e suporte
- Processamento de pagamento do sinal
- Gestão operacional, conciliação financeira e prevenção de fraude

Compartilhamento:

- Dados essenciais da reserva são compartilhados com a pousada responsável
- Dados de pagamento são enviados ao provedor contratado
- Dados administrativos ficam restritos à operação do marketplace

Segurança:

- Supabase Auth para autenticação
- Políticas RLS por tenant e usuário
- Tokenização de cartão pelo provedor de pagamento
- Banco dedicado para Hospedagens Caminhos da Fé
