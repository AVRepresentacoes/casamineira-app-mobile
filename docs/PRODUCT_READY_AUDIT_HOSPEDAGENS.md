# Product Ready Audit - Hospedagens Caminhos da Fe

Executive Program 001

## Decisao executiva

**Hoje o Hospedagens Caminhos da Fe pode receber os primeiros clientes reais em operacao comercial assistida, mas ainda nao esta pronto para venda paga autonoma.**

O produto esta tecnicamente maduro para um piloto acompanhado: catalogo real via Supabase, reserva real sem fallback local, disponibilidade por quarto/data, painel da pousada, RLS endurecido, grants reduzidos e pipeline Mercado Pago implementado em codigo.

O bloqueio para faturamento real autonomo e operacional, nao visual: o pagamento Mercado Pago ainda nao foi validado em staging/sandbox com webhook publico real, secrets reais/sandbox e evento externo aprovado.

## Evidencias usadas

- `docs/HOSPEDAGENS_CAMINHOS_DA_FE_RC_AUDIT.md`
- `docs/GO_LIVE_001_REPORT.md`
- `docs/GO_LIVE_002_FIRST_PAID_RESERVATION.md`
- `docs/GO_LIVE_003_MERCADO_PAGO_STAGING_VALIDATION.md`
- `docs/RLS_HOSPEDAGENS_GRANTS_MINIMUM_RC.md`
- `docs/RLS_HOSPEDAGENS_OPERATIONAL_P1_HARDENING.md`
- `docs/RLS_HOSPEDAGENS_PRIVATE_DATA_P0_HARDENING.md`
- `docs/RLS_HOSPEDAGENS_RESERVAS_HARDENING.md`
- `app/hospedagens/*`
- `lib/caminhosHospedagens.ts`
- `lib/uploadImage.ts`
- `supabase/functions/create-caminho-hospedagem-pix-payment/index.ts`
- `supabase/functions/mercadopago-webhook/index.ts`
- `supabase/tests/04_hospedagens_paid_reservation_pipeline.sql`

## 1. Auditoria funcional

| Fluxo | Status | Evidencia | Observacao executiva |
| --- | --- | --- | --- |
| Login | PRONTO | `app/(auth)/login.tsx`, `lib/tenant.ts` | Tenant lock de Hospedagens existe. Precisa validacao manual com contas reais. |
| Cadastro | PARCIAL | Fluxos auth/onboarding compartilhados | Cadastro geral existe; onboarding especifico de pousada ainda depende de perfil/contexto correto. |
| Recuperacao de senha | PARCIAL | `app/forgot-password.tsx` | Tela existe, mas auditoria nao comprovou envio real em ambiente Hospedagens dedicado. |
| Cadastro de pousada | PRONTO/PARCIAL | `app/hospedagens/pousada.tsx`, `lib/caminhosHospedagens.ts` | Cria registro real pendente se nao existir; requer validacao com pousada parceira real. |
| Cadastro de quartos | PRONTO | `adicionarPainelPousadaQuarto` | Insere em `caminho_hospedagem_quartos`. |
| Cadastro de disponibilidade | PRONTO | GO LIVE 002 | Disponibilidade por `quarto_id`/data criada e testada localmente. |
| Catalogo publico | PRONTO | `listarCatalogoHospedagens()` | Home/detalhe usam Supabase, sem array local de negocio. |
| Busca | PARCIAL | `app/hospedagens/index.tsx` | Busca por nome/cidade/ramal e filtros simples; nao e motor de disponibilidade avancada. |
| Reserva | PRONTO | GO LIVE 002 | Cria no Supabase, valida quarto, disponibilidade e conflito. |
| Pagamento | PARCIAL | Edge Function Mercado Pago | Implementado; falta validacao sandbox/staging com token real. |
| Webhook | PARCIAL | `mercadopago-webhook` | Codigo reconhece `caminho_hospedagem:{reservaId}`; falta evento externo Mercado Pago. |
| Confirmacao | PARCIAL | GO LIVE 002 | Confirmacao local simulada passou; confirmacao real depende webhook externo. |
| Cancelamento | PARCIAL | RPC `caminho_hospedagem_cancelar_por_pousada` | Cancelamento pela pousada existe; reembolso automatico nao comprovado. |
| Favoritos | PRONTO | `caminho_hospedagem_favoritos` | RLS e fluxo existem. |
| Avaliacoes | PRONTO | `caminho_hospedagem_avaliacoes` | Publicadas/proprias protegidas por RLS. |
| Chamados | PRONTO | `caminho_hospedagem_chamados` | Cliente/pousada/admin existem; P0 corrigido. |
| Notificacoes | PRONTO/PARCIAL | `caminho_hospedagem_notificacoes` | In-app pronto; push/email nao confirmado. |
| Painel da pousada | PRONTO | `app/hospedagens/pousada.tsx` | Carrega pousada, quartos, servicos, disponibilidade e reservas reais. |
| Perfil peregrino | PARCIAL | `app/hospedagens/perfil.tsx` | Usa dados reais e cache local de preferencias via AsyncStorage. |
| Administracao | PRONTO/PARCIAL | `app/hospedagens/admin.tsx` | Admin operacional basico existe; nao substitui backoffice de producao com alertas. |

## 2. Auditoria tecnica

| Area | Status | Evidencia | Risco |
| --- | --- | --- | --- |
| Build | PRONTO | `npm run build` passou | Baixo. |
| Lint | PRONTO | `npm run lint` passou com 6 warnings antigos | Baixo. |
| TypeScript | PARCIAL | `npm run typecheck` falhou | Medio: nao bloqueou build/lint, mas precisa correção antes de RC final. |
| Edge Functions | PARCIAL | Functions existem e compilam no contexto do repo | Falta deploy/validacao staging. |
| Supabase | PRONTO local | Matrizes RLS anteriores passaram | Precisa replicar em staging/producao. |
| Storage | PARCIAL | Bucket `imagens`, upload real | Ownership por pousada ainda e fraco/amplo. |
| Storage Policies | PARCIAL | Policies permitem auth insert/update/delete por bucket | Precisa restringir por path/owner em sprint propria. |
| Realtime | AUSENTE | Nao ha uso de channel/realtime em Hospedagens | Painel depende refresh/manual. |
| Jobs | AUSENTE | Nenhum job dedicado de vencimento/expiracao encontrado | Expiracao de reserva pendente precisa operacao manual. |
| Webhooks | PARCIAL | Mercado Pago implementado | Falta evento externo real. |
| Variaveis de ambiente | PARCIAL | GO LIVE 003 padronizou docs | Falta staging aprovado e secrets configurados. |
| Logs | PARCIAL | `console.log` em Edge Functions | Falta dashboard/alertas. |
| Tratamento de erros | PARCIAL | Alertas e try/catch existem | Sem retry estruturado em pagamento/webhook. |
| Retry | AUSENTE/PARCIAL | Idempotencia existe no webhook, mas nao ha fila/retry proprio | Depende do Mercado Pago reenviar evento. |
| Timeout | AUSENTE | Nao ha timeouts explicitos em fetchs principais | Risco de UX em rede ruim. |
| Observabilidade | PARCIAL | Logs basicos e health geral | Falta alertas por webhook/pagamento/reserva. |

### TypeScript

`npm run typecheck` foi executado como auditoria complementar e falhou. Exemplos:

- `app/marketplace/[slug].tsx`: `template` possivelmente `undefined`.
- `components/brand/BrandLogo.tsx`: prop `contentFit` incompatível no tipo usado.
- `components/layout/PublicHeader.tsx` e `components/saas/SaasProductShell.tsx`: `whiteSpace` em estilos React Native.
- `lib/caminhosHospedagens.ts`: acesso a `data.id` em retorno tipado sem `id`.
- `src/digital-company/service.ts`: retorno possivelmente `undefined`.

Nao foi corrigido nesta auditoria porque lint/build passam e a regra da missao proibe desenvolvimento fora de problema critico de build/lint.

## 3. Auditoria de seguranca

| Area | Status | Evidencia | Risco |
| --- | --- | --- | --- |
| RLS | PRONTO local | Sprints 017-022 | Sem P0 local conhecido. |
| Policies | PRONTO local | Reservas, P0 privados e P1 operacionais corrigidos | Precisa aplicar/validar em staging/producao. |
| Grants | PRONTO local | Grants minimos Sprint 022 | Precisa confirmar remoto. |
| Multi-tenant | PRONTO/PARCIAL | Tenant lock e helpers `current_tenant_id` | Usuarios multi-tenant ainda dependem de contexto default correto. |
| Autorizacao | PRONTO local | Matriz de personas | Validacao real em staging pendente. |
| JWT | PARCIAL | Supabase Auth usado | Edge de pagamento exige auth; webhook usa no-verify esperado. |
| Segredos | PARCIAL | Secrets documentados | Falta cofre/staging real configurado. |
| Uploads | PARCIAL | Upload em `imagens/{user}/uploads` | Nao garante ownership por pousada. |
| Storage | PARCIAL | Bucket publico para imagens | Aceitavel para catalogo, mas precisa politicas mais finas. |
| Edge Functions | PARCIAL | Service role usado em functions | Correto para backend, mas precisa logs/alertas/secrets. |
| Rate limiting | AUSENTE | Nenhum rate limit dedicado encontrado | Risco para pagamento, suporte e uploads. |

## 4. Auditoria UX

| Area | Status | Evidencia | Observacao |
| --- | --- | --- | --- |
| Estados vazios | PRONTO/PARCIAL | Home, painel e listas mostram vazios | Precisa teste manual em contas zeradas reais. |
| Loading | PRONTO | ActivityIndicator em telas principais | Bom para piloto. |
| Offline | AUSENTE/PARCIAL | Sem modo offline estruturado | App mostra erro, mas nao opera offline. |
| Erros | PARCIAL | Alerts e mensagens existem | Mensagens de gateway nao configurado sao tecnicas para usuario final. |
| Mensagens | PRONTO/PARCIAL | CTAs claros | Alguns textos ainda indicam operacao assistida/24h. |
| Responsividade | PRONTO/PARCIAL | Build web e RN mobile | Falta rodada manual em dispositivos reais. |
| Fluxos quebrados | PARCIAL | Nenhum build quebrado | Pagamento real externo ainda nao comprovado. |
| Duplicidade de acoes | PARCIAL | Botao usa `processing/saving` | Webhook idempotente, mas faltam travas visuais em todos os fluxos. |

## 5. Auditoria operacional

| Area | Status | Evidencia | Risco |
| --- | --- | --- | --- |
| Backup | PARCIAL | Checklist docs | Nao comprovado em staging/producao. |
| Rollback | PARCIAL | Plano documentado na RC audit | Falta runbook remoto validado. |
| Deploy | PARCIAL | Scripts/clients existem | Push GitHub e staging ainda bloqueados por credencial/contexto. |
| Secrets | PARCIAL | GO LIVE 003 | Falta configuracao real em Supabase staging. |
| Monitoramento | AUSENTE/PARCIAL | Logs basicos | Falta alertas e dashboards. |
| Logs | PARCIAL | Console logs Edge | Sem padrao de correlacao/retencao. |
| Alertas | AUSENTE | Nenhum alerta dedicado encontrado | P1 para operacao paga. |
| Migrations | PRONTO local | GO LIVE/RLS migrations criadas | Precisa aplicar em staging/producao com janela. |
| Checklist producao | PARCIAL | Docs existentes | Ainda falta execucao operacional real. |

## 6. Matriz executiva

| Dimensao | Nota 0-10 | Justificativa |
| --- | ---: | --- |
| Arquitetura | 8 | Produto separado, clients/configs e data plane documentado. Ainda convive no monorepo. |
| Seguranca | 8 | RLS/grants fortes localmente. Storage/rate limit e validacao remota pendentes. |
| Banco | 8 | Schema cobre fluxo, disponibilidade por quarto e conflito. Staging/producao pendentes. |
| Frontend | 7 | Fluxos principais existem e build passa. TypeScript falha e UX precisa teste manual. |
| Backend | 7 | Edge Functions implementadas. Falta deploy/validacao sandbox real. |
| UX | 7 | Experiencia dedicada e clara. Offline/erros/gateway precisam polimento. |
| Performance | 7 | Consultas simples e catalogo direto. Sem testes de carga/cache. |
| Operacao | 5 | Faltam staging validado, monitoramento, alertas, backups comprovados e runbook executado. |
| Escalabilidade | 6 | Base suporta piloto; faltam jobs, rate limiting, observabilidade e processo operacional. |
| Prontidao Comercial | 7 | Pronto para piloto assistido; nao para venda paga autonoma. |

**Nota geral:** 71/100.

## 7. Roadmap executivo

### P0 - Impede venda

1. Pagamento Mercado Pago ainda nao validado em staging/sandbox com webhook publico real.
2. Secrets sandbox/producao de Hospedagens ainda nao configurados em ambiente aprovado.
3. Webhook real externo ainda nao comprovou confirmacao automatica de reserva.

### P1 - Venda possivel, mas corrigir rapidamente

1. TypeScript falha em `npm run typecheck`, incluindo um ponto em `lib/caminhosHospedagens.ts`.
2. Storage de imagens precisa ownership por pousada/path.
3. Ausencia de monitoramento/alertas para webhook, pagamento e reserva.
4. Ausencia de rate limiting dedicado para endpoints sensiveis.
5. Reembolso/estorno automatico nao comprovado.
6. Cancelamento pelo cliente e fluxo financeiro completo nao comprovados.
7. Staging remoto nao executado ponta a ponta.
8. Falta rodada manual em dispositivo real com pousada parceira.

### P2 - Pode esperar

1. Catalogo publico por tabela ainda expoe colunas das linhas liberadas por RLS.
2. Notificacoes sao apenas in-app; push/email nao confirmados.
3. Offline nao estruturado.
4. Realtime ausente no painel.
5. Busca ainda simples, sem calendario avancado.
6. Servicos adicionais ainda nao têm criacao completa ampliada.
7. Km percorridos depende de dados reais de rota/distancia.

### P3 - Melhorias futuras

1. RPC/Edge Function para catalogo publico com projection segura.
2. Painel operacional de alertas.
3. Jobs de expiracao de reserva pendente.
4. SLA e playbook de suporte.
5. Testes de carga e observabilidade por funil.

## 8. Top 10 problemas

1. Falta validacao Mercado Pago sandbox/staging com webhook publico real.
2. Falta configuracao de secrets em ambiente staging aprovado.
3. Falta deploy remoto validado das Edge Functions de pagamento/webhook.
4. Falta monitoramento e alerta para falha de pagamento/webhook.
5. Falta rate limiting em endpoints sensiveis.
6. Storage de fotos ainda precisa ownership mais fino.
7. `npm run typecheck` falha.
8. Reembolso/estorno automatico nao comprovado.
9. Cancelamento pelo cliente nao esta fechado operacionalmente.
10. Falta rodada manual com pousada e peregrino reais em dispositivo real.

## 9. Top 10 pontos fortes

1. Catalogo principal usa Supabase, sem mock de negocio.
2. Reserva grava no Supabase e nao usa fallback local de sucesso.
3. Disponibilidade por quarto/data implementada e testada localmente.
4. Conflito de reserva no mesmo quarto/periodo bloqueado no banco.
5. Painel da pousada carrega dados reais.
6. RLS de reservas, dados privados e dados operacionais foi endurecido em sprints anteriores.
7. Grants publicos foram reduzidos.
8. Webhook Mercado Pago reconhece `caminho_hospedagem:{reservaId}`.
9. Idempotencia basica do webhook foi implementada.
10. Documentacao GO LIVE e RC esta extensa e rastreavel.

## 10. Respostas executivas

### O produto pode receber clientes reais?

**Sim, em piloto assistido.** Pode receber peregrinos reais com acompanhamento operacional, desde que pagamento seja sandbox/manual ou supervisionado.

### O produto pode receber pousadas reais?

**Sim, em onboarding assistido.** Cadastro de pousada/quartos/disponibilidade existe, mas deve ser acompanhado por operador na primeira leva.

### O produto pode receber pagamentos reais?

**Ainda nao recomendado.** O codigo esta preparado, mas falta validar Mercado Pago em staging/sandbox com webhook publico real antes de dinheiro real.

### O produto suporta operacao assistida?

**Sim.** Para volume pequeno, com operador acompanhando reservas, pagamentos, webhook, suporte e painel.

### O que impede faturamento hoje?

O principal impeditivo e a ausencia de validacao real do Mercado Pago sandbox/staging com webhook publico, secrets configurados e confirmacao automatica comprovada. Sem isso, pagamento aprovado pode nao virar reserva confirmada em operacao real.

### Estimativa para GO LIVE

**3 a 7 dias uteis** para GO LIVE assistido, assumindo:

- staging aprovado;
- secrets Mercado Pago sandbox disponiveis;
- deploy das Edge Functions;
- teste PIX sandbox aprovado;
- rodada manual com uma pousada real.

Para venda paga autonoma, estimativa conservadora: **10 a 15 dias uteis**, incluindo monitoramento, alertas, storage hardening, reembolso/cancelamento e typecheck.

## 11. Recomendacao final

**Aprovado para operacao comercial assistida limitada, nao aprovado para venda paga autonoma.**

Critérios para iniciar piloto assistido:

- limitar numero de pousadas;
- limitar volume de reservas;
- pagamento em sandbox/manual ate validacao real do gateway;
- operador acompanhando cada reserva;
- canal de suporte ativo;
- rollback manual documentado.

## 12. Proximo programa recomendado

**Executive Program 002 - Assisted Commercial Pilot Readiness**

Objetivo:

1. Validar Mercado Pago sandbox real.
2. Configurar staging e secrets.
3. Executar reserva paga sandbox ponta a ponta.
4. Criar runbook operacional de suporte.
5. Criar checklist de primeira pousada parceira.
6. Corrigir typecheck antes da RC comercial autonoma.
