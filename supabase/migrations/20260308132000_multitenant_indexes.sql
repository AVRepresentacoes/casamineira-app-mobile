-- Fase 1: índices por tenant para escala

create index if not exists tenant_users_tenant_user_idx
  on public.tenant_users (tenant_id, user_id);

create index if not exists profiles_tenant_id_idx
  on public.profiles (tenant_id);

create index if not exists pedidos_tenant_created_idx
  on public.pedidos (tenant_id, created_at desc);

create index if not exists pedidos_tenant_status_idx
  on public.pedidos (tenant_id, status);

create index if not exists propostas_tenant_created_idx
  on public.propostas (tenant_id, created_at desc);

create index if not exists propostas_tenant_pedido_idx
  on public.propostas (tenant_id, pedido_id);

create index if not exists pagamentos_tenant_created_idx
  on public.pagamentos (tenant_id, created_at desc);

create index if not exists comissoes_tenant_created_idx
  on public.comissoes (tenant_id, created_at desc);

create index if not exists mensagens_tenant_created_idx
  on public.mensagens (tenant_id, created_at asc);

create index if not exists disparo_pedidos_tenant_status_idx
  on public.disparo_pedidos (tenant_id, status, enviado_em desc);

create index if not exists avaliacoes_tenant_created_idx
  on public.avaliacoes (tenant_id, created_at desc);

create index if not exists analytics_eventos_tenant_created_idx
  on public.analytics_eventos (tenant_id, created_at desc);

create index if not exists contratos_digitais_tenant_created_idx
  on public.contratos_digitais (tenant_id, created_at desc);

create index if not exists escrow_milestones_tenant_created_idx
  on public.escrow_milestones (tenant_id, created_at desc);

create index if not exists banners_publicitarios_tenant_ordem_idx
  on public.banners_publicitarios (tenant_id, posicao, ordem);

create index if not exists profissionais_tenant_idx
  on public.profissionais (tenant_id);

