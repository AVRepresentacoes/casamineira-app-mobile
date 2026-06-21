alter table public.gas_pedidos
  add column if not exists checkout_token text null;

create unique index if not exists gas_pedidos_checkout_token_uidx
  on public.gas_pedidos (checkout_token)
  where checkout_token is not null;
