-- GO LIVE 002 - primeira reserva paga validada.
-- Escopo: disponibilidade por quarto/data e bloqueio de conflito de reserva.

create extension if not exists btree_gist;

alter table public.caminho_hospedagem_disponibilidade
  add column if not exists quarto_id uuid references public.caminho_hospedagem_quartos(id) on delete set null;

alter table public.caminho_hospedagem_reservas
  add column if not exists quarto_id uuid references public.caminho_hospedagem_quartos(id) on delete set null;

update public.caminho_hospedagem_reservas r
set quarto_id = q.id
from public.caminho_hospedagem_pousadas p
join public.caminho_hospedagem_quartos q
  on q.pousada_id = p.id
where r.quarto_id is null
  and r.tenant_id = p.tenant_id
  and r.hospedagem_slug = p.slug
  and r.quarto_slug = q.slug;

alter table public.caminho_hospedagem_disponibilidade
  drop constraint if exists caminho_hospedagem_disponibilidade_pousada_id_dia_key;

alter table public.caminho_hospedagem_disponibilidade
  drop constraint if exists caminho_hospedagem_disponibilidade_pousada_quarto_dia_key;

alter table public.caminho_hospedagem_disponibilidade
  add constraint caminho_hospedagem_disponibilidade_pousada_quarto_dia_key
  unique (pousada_id, quarto_id, dia);

create index if not exists caminho_hospedagem_disponibilidade_quarto_dia_idx
  on public.caminho_hospedagem_disponibilidade (quarto_id, dia, status);

create index if not exists caminho_hospedagem_reservas_quarto_periodo_idx
  on public.caminho_hospedagem_reservas (quarto_id, checkin, checkout)
  where status in ('aguardando_pagamento', 'confirmada');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'caminho_hospedagem_reservas_quarto_periodo_excl'
  ) then
    alter table public.caminho_hospedagem_reservas
      add constraint caminho_hospedagem_reservas_quarto_periodo_excl
      exclude using gist (
        tenant_id with =,
        quarto_id with =,
        daterange(checkin, checkout, '[)') with &&
      )
      where (
        quarto_id is not null
        and status in ('aguardando_pagamento', 'confirmada')
      );
  end if;
end $$;
