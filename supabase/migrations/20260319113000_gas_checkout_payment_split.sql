alter table public.gas_revendedores
  add column if not exists fornecedor_id uuid null references auth.users(id) on delete set null;

update public.gas_revendedores
set fornecedor_id = empresa_id
where fornecedor_id is null
  and empresa_id is not null;

create index if not exists gas_revendedores_fornecedor_idx
  on public.gas_revendedores (fornecedor_id);

alter table public.gas_pedidos
  add column if not exists pedido_id uuid null references public.pedidos(id) on delete set null,
  add column if not exists recebedor text null,
  add column if not exists complemento text null,
  add column if not exists referencia text null,
  add column if not exists taxa_entrega numeric(12,2) null default 0,
  add column if not exists taxa_servico numeric(12,2) null default 0,
  add column if not exists total numeric(12,2) null,
  add column if not exists valor_plataforma numeric(12,2) null,
  add column if not exists valor_revendedor numeric(12,2) null,
  add column if not exists metodo_pagamento text null,
  add column if not exists status_pagamento text not null default 'pending',
  add column if not exists payment_id text null,
  add column if not exists preference_id text null;

create unique index if not exists gas_pedidos_pedido_id_uidx
  on public.gas_pedidos (pedido_id)
  where pedido_id is not null;

create index if not exists gas_pedidos_status_pagamento_idx
  on public.gas_pedidos (status_pagamento, created_at desc);

alter table public.gas_pedidos
  drop constraint if exists gas_pedidos_status_pagamento_check;

alter table public.gas_pedidos
  add constraint gas_pedidos_status_pagamento_check
  check (status_pagamento in ('pending', 'processing', 'paid', 'failed', 'refunded', 'canceled'));
