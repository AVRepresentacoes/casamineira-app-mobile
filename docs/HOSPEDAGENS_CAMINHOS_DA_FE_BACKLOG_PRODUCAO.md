# Hospedagens Caminhos da Fé: Plano Marketplace Robusto

Objetivo: levar o produto para o nível de marketplace profissional, com app próprio, painel da pousada, painel administrativo, split de pagamento, conciliação financeira, moderação, suporte, dashboards, publicação Android/iOS e operação contínua.

## Posicionamento Comercial

Este projeto deve ser tratado como produto estratégico, não como app simples.

- Faixa de implantação de referência: R$ 150 mil a R$ 300 mil+
- Receita recorrente: mensalidade operacional, comissão por reserva ou ambos
- Comissão definida: 12% no lançamento e 15% após fase promocional
- Sinal do cliente: 50% da hospedagem no app
- Restante: pago na pousada, incluindo serviços adicionais confirmados
- Multa operacional da pousada por descumprimento: 10% do valor total da reserva

## Fase 1: Base De Produção

- Remover dependência de dados demonstrativos no fluxo principal
- Criar cadastro real de pousadas, quartos, preços, fotos, serviços e disponibilidade
- Criar fluxo de aprovação de pousada antes de publicar no app
- Criar reservas 100% persistidas no Supabase, sem fallback local em produção
- Corrigir e validar tenant fixo do app Hospedagens
- Aplicar migrations em ambiente Supabase de produção
- Criar seeds iniciais somente para ambiente de demonstração

## Fase 2: Painel Da Pousada

- Dashboard da pousada com reservas do dia, próximas chegadas e pendências
- Cadastro e edição de quartos
- Preço por quarto, capacidade, fotos, comodidades e serviços adicionais
- Calendário de disponibilidade por data
- Bloqueio manual de datas
- Confirmação, alteração e cancelamento de reservas
- Extrato de repasses
- Saldo negativo por multa operacional
- Cadastro de conta de pagamento para split
- Status de verificação da pousada

## Fase 3: Painel Administrativo

- Visão geral de reservas, GMV, comissão, sinal recebido e repasses
- Gestão de pousadas pendentes, aprovadas, suspensas e recusadas
- Gestão de clientes e histórico de reservas
- Moderação de fotos, descrições, preços e serviços
- Tela de disputas e ocorrências
- Cancelamento administrativo de reservas
- Aplicação e baixa de multas
- Auditoria de alterações críticas
- Exportação financeira CSV
- Dashboard por cidade, ramal e etapa

## Fase 4: Pagamentos, Split E Conciliação

- Definir provedor principal: Mercado Pago ou Asaas
- Configurar credenciais de produção e sandbox
- PIX real para sinal de 50%
- Cartão real para sinal de 50%
- Webhook específico para reservas do Caminho da Fé
- Atualização automática de status da reserva após pagamento aprovado
- Split ou repasse programado para pousada
- Registro de comissão da plataforma
- Registro de repasse inicial
- Registro de estornos e reembolsos
- Conciliação diária de pagamentos
- Tratamento de chargeback, falha, expiração de PIX e pagamento recusado

## Fase 5: Operação Do Cliente

- Histórico real de hospedagens
- Comprovante da reserva
- Controle de gastos com hospedagem e serviços adicionais
- KM percorridos por etapa real
- Cancelamento pelo cliente com cálculo automático de reembolso
- Solicitação de suporte dentro da reserva
- Notificações de pagamento, confirmação, lembrete de check-in e avaliação
- Avaliação da pousada pelo cliente
- Favoritos e planejamento de próximas etapas

## Fase 6: Suporte, Disputas E Moderação

- Central de ajuda dentro do app
- Abertura de chamado pelo cliente
- Abertura de chamado pela pousada
- Tipos de ocorrência: cancelamento, no-show, divergência de preço, pousada indisponível, problema no quarto, reembolso
- SLA por tipo de ocorrência
- Histórico de mensagens e evidências
- Anexos/fotos no chamado
- Decisão administrativa e registro de auditoria

Status técnico atual:

- Criada tabela `caminho_hospedagem_chamados` no Supabase dedicado.
- Cliente já possui tela `/hospedagens/suporte` para abrir e acompanhar chamados.
- Pousada já possui tela `/hospedagens/suporte-pousada` para ocorrências operacionais.
- Painel admin já possui aba Suporte para acompanhar, responder e resolver chamados.
- Ainda falta anexos/evidências com upload, SLA automático, notificações push e histórico conversacional completo.

## Fase 7: Jurídico E Compliance

- Termos de uso do cliente
- Política de privacidade
- Política de cancelamento do cliente
- Contrato comercial da pousada
- Regras de comissão, repasse, multa e saldo negativo
- Aceite digital dos termos no cadastro
- Versionamento dos termos aceitos
- Revisão jurídica da multa operacional
- Adequação LGPD para dados pessoais, pagamentos e suporte

## Fase 8: Publicação Android E iOS

- Conta Google Play Console
- Conta Apple Developer
- Ícone 1024x1024 final
- Screenshots reais por dispositivo
- Feature graphic Android
- Descrição curta e completa
- Política de privacidade pública
- URL de suporte
- Data Safety da Play Store
- Build AAB Android de produção
- Build iOS de produção
- Teste interno, teste fechado e submissão final

## Fase 9: Observabilidade E Manutenção

- Logs de erro do app
- Logs de Edge Functions
- Monitoramento de pagamentos
- Alerta de webhook falhando
- Alerta de reserva paga sem confirmação
- Backup e rotina de recuperação
- Rotina de atualização de dependências
- Checklist mensal de taxas, repasses e disputas
- Métricas: conversão, GMV, comissão, reservas canceladas, pousadas ativas e ticket médio

## Prioridade De Execução

1. Solidificar banco, tenant e reservas reais.
2. Criar painel da pousada.
3. Criar painel admin vertical.
4. Ativar pagamento real com webhook.
5. Implementar split/repasse e conciliação.
6. Implementar suporte, disputas e moderação.
7. Finalizar jurídico e publicação.
8. Lançar operação piloto com pousadas reais.
9. Escalar para novas cidades e ramais.

## Critério Para Chamar De Produção

O produto só deve ser considerado produção quando:

- Uma reserva real nasce no banco, recebe pagamento real e muda status automaticamente.
- A pousada consegue ver e gerenciar a reserva.
- O admin consegue auditar pagamento, comissão, repasse e ocorrência.
- O cliente consegue consultar histórico, comprovante, gastos e suporte.
- O fluxo de cancelamento e reembolso está documentado e operacional.
- Pelo menos uma pousada real está cadastrada, aprovada e testada ponta a ponta.
