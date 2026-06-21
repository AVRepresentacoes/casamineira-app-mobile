-- Controle de leitura de propostas pelo cliente (badge de notificações)
-- Idempotente.

alter table public.propostas
  add column if not exists lida_cliente boolean not null default false;

create index if not exists propostas_lida_cliente_idx
  on public.propostas (lida_cliente, created_at desc);
