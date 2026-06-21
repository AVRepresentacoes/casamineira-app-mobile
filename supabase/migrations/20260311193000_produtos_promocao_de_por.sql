-- Promoções de produto (De/Por) para lojistas no marketplace.

alter table public.produtos_fornecedor
  add column if not exists preco_de numeric(12,2),
  add column if not exists preco_por numeric(12,2);

update public.produtos_fornecedor
set preco_de = coalesce(preco_de, preco)
where preco_de is null;

alter table public.produtos_fornecedor
  drop constraint if exists produtos_fornecedor_preco_de_check;

alter table public.produtos_fornecedor
  add constraint produtos_fornecedor_preco_de_check
  check (preco_de is null or preco_de > 0);

alter table public.produtos_fornecedor
  drop constraint if exists produtos_fornecedor_preco_por_check;

alter table public.produtos_fornecedor
  add constraint produtos_fornecedor_preco_por_check
  check (preco_por is null or preco_por > 0);

alter table public.produtos_fornecedor
  drop constraint if exists produtos_fornecedor_preco_por_menor_que_de_check;

alter table public.produtos_fornecedor
  add constraint produtos_fornecedor_preco_por_menor_que_de_check
  check (
    preco_por is null
    or preco_por < coalesce(preco_de, preco)
  );
