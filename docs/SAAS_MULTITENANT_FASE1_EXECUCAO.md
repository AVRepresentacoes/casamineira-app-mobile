# Fase 1 SaaS Multi-Tenant (Plano Executável Sem Regressão)

## Objetivo da fase
Introduzir isolamento por tenant no backend sem quebrar fluxos atuais (cliente, profissional, propostas, pagamentos, chat).

## Regra de ouro desta fase
- Não remover nada existente.
- Não mudar semântica de telas/rotas.
- Só adicionar estrutura (`tenant_id`, tabelas de tenant, policies e helpers).
- Manter todos os dados atuais no tenant `default`.

## Escopo técnico da Fase 1
1. Criar núcleo multi-tenant:
   - `public.tenants`
   - `public.tenant_users`
2. Adicionar `tenant_id` em tabelas de domínio críticas.
3. Backfill de `tenant_id` para dados atuais.
4. Índices por tenant.
5. RLS tenant-safe (sem recursão).
6. Helpers SQL para resolver tenant ativo de forma segura.
7. Ajustes incrementais nas queries app/functions (somente filtro por tenant).

## Inventário de tabelas impactadas (prioridade alta)
- `public.profiles`
- `public.pedidos`
- `public.propostas`
- `public.pagamentos`
- `public.comissoes`
- `public.mensagens`
- `public.disparo_pedidos`
- `public.avaliacoes`
- `public.analytics_eventos`
- `public.contratos_digitais`
- `public.escrow_milestones`
- `public.banners_publicitarios`
- `public.profissionais`

## Tabelas existentes referenciadas no app (revisar no rollout)
- `servicos`, `portfolio`, `wallets`, `wallet_transactions`, `contratos`, `imagens`, `perfis`
  - Se existirem no banco real: também devem receber `tenant_id`.
  - Se não existirem: manter fora da Fase 1.

## Arquivos que serão alterados na execução da fase

### Migrations novas (ordem sugerida)
1. `supabase/migrations/20260308130000_multitenant_core.sql`
2. `supabase/migrations/20260308131000_multitenant_backfill.sql`
3. `supabase/migrations/20260308132000_multitenant_indexes.sql`
4. `supabase/migrations/20260308133000_multitenant_rls.sql`
5. `supabase/migrations/20260308134000_multitenant_rpc_helpers.sql`

### Backend/functions
- `supabase/functions/create-mercadopago-preference/index.ts`
- `supabase/functions/create-mercadopago-pix-payment/index.ts`
- `supabase/functions/create-mercadopago-card-payment/index.ts`
- `supabase/functions/mercadopago-webhook/index.ts`
- `supabase/functions/create-asaas-pix-payment/index.ts`
- `supabase/functions/asaas-webhook/index.ts`

### App/lib (filtro por tenant)
- `lib/supabase.ts`
- `lib/auth.ts`
- `lib/pedidos.ts`
- `lib/payments.ts`
- `lib/marketplace.ts`
- `lib/stage2.ts`
- `lib/chamadosRapidos.ts`
- telas que fazem `.from(...)` diretamente para entidades de domínio crítico.

## Estratégia de coexistência (sem quebrar o que funciona)
1. Introduzir `tenant_id` nullable + default `default_tenant_id`.
2. Backfill tudo para `default_tenant_id`.
3. Só depois tornar `tenant_id not null`.
4. Atualizar policies para permitir acesso apenas ao tenant ativo do usuário.
5. Manter fallback temporário para `default` em leituras durante rollout.

## SQL base (resumo do que cada migration fará)

### 1) multitenant_core
- Criar `public.tenants`:
  - `id uuid pk`
  - `slug text unique`
  - `name text`
  - `status text check (active|suspended|cancelled)`
  - `plan_code text`
  - `created_at`, `updated_at`
- Criar `public.tenant_users`:
  - `tenant_id uuid fk tenants`
  - `user_id uuid fk auth.users`
  - `role text check (owner|admin|manager|staff)`
  - `is_default boolean`
  - unique `(tenant_id, user_id)`
- Criar tenant `default`.
- Criar funções:
  - `public.current_tenant_id()` (baseada em claim JWT ou `tenant_users.is_default`).
  - `public.user_belongs_to_tenant(_tenant uuid)`.

### 2) multitenant_backfill
- `alter table ... add column if not exists tenant_id uuid`.
- Preencher `tenant_id` com tenant `default` nas tabelas listadas.
- Para `profiles`: inserir em `tenant_users` para usuários existentes.
- Preparar foreign keys para `tenants(id)` com `not valid`.

### 3) multitenant_indexes
- Índices:
  - `(tenant_id, created_at desc)` em tabelas de listagem.
  - `(tenant_id, status)` em tabelas de workflow.
  - `(tenant_id, user_id)` onde aplicável.

### 4) multitenant_rls
- Reescrever policies para usar:
  - `tenant_id = public.current_tenant_id()`
  - e regras originais de role/propriedade (`cliente_id`, `profissional_id`, etc).
- Evitar subqueries que referenciem a mesma tabela da policy (prevenir recursão).

### 5) multitenant_rpc_helpers
- Ajustar RPCs existentes para receber/usar tenant:
  - `disparar_pedido_rapido`
  - `aceitar_chamado_rapido`
  - `recusar_chamado_rapido`
  - `expirar_chamados_rapidos`
  - `enviar_mensagem_chat`
  - `listar_mensagens_chat`
- Garantir verificações de tenant dentro da função.

## Ordem de rollout em produção
1. Deploy migrations 1 e 2.
2. Deploy app/functions com filtro por tenant (sem exigir not null ainda).
3. Deploy migrations 3 e 4.
4. Validar smoke tests.
5. (Opcional posterior) tornar `tenant_id not null` + validar constraints.

## Testes anti-regressão (obrigatórios)

### Fluxos cliente
1. Criar pedido normal.
2. Receber propostas.
3. Aceitar proposta.
4. Gerar PIX/cartão.
5. Ver status no pedido e perfil.

### Fluxos profissional
1. Ver pedidos disponíveis.
2. Enviar proposta.
3. Aceitar chamado rápido.
4. Chat funcionando.
5. Financeiro/ carteira sem erro.

### Fluxos pagamento
1. MP PIX.
2. MP cartão.
3. Asaas PIX.
4. Webhooks atualizando `pagamentos` + `comissoes` + `pedidos`.

### Isolamento tenant
1. Usuário do tenant A não lê pedidos do tenant B.
2. Profissional do tenant A não aparece no matching do tenant B.
3. Banners/branding respeitam tenant.

## Critérios de aceite da Fase 1
- Todos fluxos atuais funcionando no tenant `default`.
- Sem erro de policy recursion.
- Sem vazamento cross-tenant.
- Sem queda de performance nas listas principais.
- `typecheck` e lint passando.

## Riscos conhecidos e mitigação
- Risco: recursão em RLS.
  - Mitigação: funções helper SECURITY DEFINER e policies sem auto-referência.
- Risco: queries legadas sem filtro tenant.
  - Mitigação: RLS bloqueia por padrão; revisão dos `.from(...)` críticos.
- Risco: webhook atualizar registro de tenant errado.
  - Mitigação: lookup de `pedido` com `tenant_id` e atualização no mesmo tenant.

## Fora da Fase 1 (próximas fases)
- Billing SaaS por tenant.
- Painel super-admin para provisionamento automático.
- Feature flags por tenant.
- SSO enterprise.
- Observabilidade/SLA avançados.
