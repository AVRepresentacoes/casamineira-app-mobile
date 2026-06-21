# Checklist QA - Módulo Profissional

Data de execução: ____/____/______
Responsável: ______________________
Build/versão testada: ______________________
Ambiente: `Android` / `iOS` / `Web`

Legenda:
- Status: `PASSOU` | `FALHOU` | `N/A`
- Severidade (se falhou): `Baixa` | `Média` | `Alta` | `Crítica`

| ID | Fluxo | Cenário | Passos | Resultado esperado | Status | Severidade | Evidência / Observação |
|---|---|---|---|---|---|---|---|
| F01 | Navegação | Menu abre e lista opções | Abrir aba `Menu` | Lista exibe telas internas premium |  |  |  |
| F02 | Navegação | Voltar padrão | Entrar em tela interna pelo menu e voltar | Retorna para `Menu` |  |  |  |
| F03 | Navegação | Voltar vindo do perfil | Entrar em tela interna via `Perfil` e voltar | Retorna para `Perfil` |  |  |  |
| F04 | Rodapé | Tabs principais | Verificar rodapé | Apenas `Menu`, `Pedidos disponíveis`, `Financeiro`, `Perfil` |  |  |  |

| F05 | Dashboard | KPIs carregam | Abrir `Dashboard` | Propostas, aceite e pagamentos renderizam sem erro |  |  |  |
| F06 | Dashboard | Estado vazio | Testar conta sem dados | Mensagens de vazio sem crash |  |  |  |
| F07 | Dashboard | Resiliência de rede | Abrir sem internet | Exibe erro amigável |  |  |  |

| F08 | Agenda | Criar janela válida | Adicionar `Seg 08:00-12:00` | Janela criada |  |  |  |
| F09 | Agenda | Bloqueio de conflito | Adicionar `Seg 10:00-11:00` | Conflito impedido com alerta |  |  |  |
| F10 | Agenda | Ativar/Desativar | Usar switch da janela | Estado atualizado corretamente |  |  |  |
| F11 | Agenda | Remoção | Excluir janela | Janela removida da lista |  |  |  |
| F12 | Agenda | Persistência | Fechar/reabrir app | Janela permanece salva |  |  |  |

| F13 | Carteira | Resumo financeiro | Abrir `Carteira` | Saldo, bloqueado e disponível consistentes |  |  |  |
| F14 | Carteira | Validação campos | Solicitar saque sem preencher tudo | Bloqueia com alerta |  |  |  |
| F15 | Carteira | Saldo insuficiente | Solicitar saque acima do disponível | Bloqueia com alerta |  |  |  |
| F16 | Carteira | Saque válido | Solicitar saque válido | Solicitação registrada e UI atualizada |  |  |  |
| F17 | Carteira | Liquidação simulada | `TESTE: Liquidar saque` | Bloqueado zera e saldo ajusta |  |  |  |

| F18 | Propostas | Filtros | Alternar `Todas/Aceitas/Análise/Recusadas` | Lista respeita filtro |  |  |  |
| F19 | Propostas | Métricas | Ver topo da tela | Taxa de aceite e totais corretos |  |  |  |
| F20 | Propostas | Navegação item | Abrir card de proposta | Abre pedido relacionado |  |  |  |
| F21 | Propostas | Estado vazio | Filtrar sem itens | Mensagem de vazio aparece |  |  |  |

| F22 | Contratos | KPIs sem corte | Abrir `Contratos e Escrow` | `Contratos/Concluídos/Valor total` legíveis |  |  |  |
| F23 | Contratos | Criar contrato | Preencher e salvar | Contrato criado na lista |  |  |  |
| F24 | Contratos | Editar contrato | Editar e salvar | Item atualizado |  |  |  |
| F25 | Contratos | Status contrato | Iniciar/Concluir | Status muda corretamente |  |  |  |
| F26 | Escrow | Criar marcos | Salvar com `pedido_id` e valor | Marcos aparecem no bloco escrow |  |  |  |
| F27 | Escrow | Atualizar marcos | Iniciar/Aprovar/Liberar marco | Status de marco atualiza |  |  |  |
| F28 | Contratos | Botões sem corte | Ver botões em tela menor | Textos completos e centralizados |  |  |  |

| F29 | Portfólio | Permissão galeria | Selecionar imagem | Solicita permissão corretamente |  |  |  |
| F30 | Portfólio | Upload imagem | Escolher imagem e publicar | Item criado com imagem |  |  |  |
| F31 | Portfólio | Excluir item | Excluir trabalho | Item removido da lista |  |  |  |
| F32 | Portfólio | Estado vazio | Conta sem portfolio | Mensagem de vazio aparece |  |  |  |

| F33 | Crescimento | Métricas tela | Abrir `Crescimento` | KPIs renderizam sem erro |  |  |  |
| F34 | Crescimento | Atualização manual | Pull-to-refresh | Dados recarregam |  |  |  |

| F35 | Notificações | Lista inicial | Abrir `Notificações` | Lista ordenada por data |  |  |  |
| F36 | Notificações | Atualização manual | Pull-to-refresh | Dados recarregam sem erro |  |  |  |
| F37 | Notificações | Estado vazio | Conta sem eventos/propostas | Mensagem de vazio aparece |  |  |  |

| F38 | Perfil | Dados comerciais | Abrir `Perfil` | Score, métricas e badges visíveis |  |  |  |
| F39 | Perfil | Atalhos premium | Usar atalhos para telas internas | Navegação funciona com retorno correto |  |  |  |
| F40 | Perfil | Logout | Sair da conta | Redireciona para login |  |  |  |

## Defeitos encontrados

| ID Defeito | Fluxo | Descrição | Passos para reproduzir | Resultado atual | Resultado esperado | Severidade | Status |
|---|---|---|---|---|---|---|---|
| D-001 |  |  |  |  |  |  | Aberto |
| D-002 |  |  |  |  |  |  | Aberto |

## Resumo final
- Total de casos: `40`
- Passou: `____`
- Falhou: `____`
- N/A: `____`
- Taxa de aprovação: `____%`

Aprovado para produção? `SIM` / `NÃO`
Assinatura QA: ______________________
