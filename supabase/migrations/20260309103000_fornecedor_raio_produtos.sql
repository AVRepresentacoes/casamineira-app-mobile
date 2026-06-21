-- Adiciona configuração de fornecedor na tabela profissionais
-- e expõe RPC para buscar fornecedores elegíveis por distância.

alter table public.profissionais
  add column if not exists fornecedor_ativo boolean not null default false,
  add column if not exists fornecedor_raio_km integer;

update public.profissionais
set fornecedor_raio_km = coalesce(fornecedor_raio_km, raio_km, 15)
where fornecedor_raio_km is null;

alter table public.profissionais
  alter column fornecedor_raio_km set default 15,
  alter column fornecedor_raio_km set not null;

alter table public.profissionais
  drop constraint if exists profissionais_fornecedor_raio_km_check;

alter table public.profissionais
  add constraint profissionais_fornecedor_raio_km_check
  check (fornecedor_raio_km between 1 and 100);

create index if not exists profissionais_fornecedor_busca_idx
  on public.profissionais (tenant_id, fornecedor_ativo, fornecedor_raio_km);

create or replace function public.listar_fornecedores_no_raio(
  p_latitude double precision,
  p_longitude double precision,
  p_raio_cliente_km integer default 20,
  p_limite integer default 50
)
returns table (
  fornecedor_id uuid,
  nome text,
  cidade text,
  distancia_km numeric,
  raio_fornecedor_km integer
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      pr.user_id as fornecedor_id,
      pf.name as nome,
      coalesce(pf.cidade, pf.cidade_nome, '') as cidade,
      pr.fornecedor_raio_km as raio_fornecedor_km,
      (
        6371 * acos(
          least(
            1,
            greatest(
              -1,
              cos(radians(p_latitude)) * cos(radians(pr.latitude))
              * cos(radians(pr.longitude) - radians(p_longitude))
              + sin(radians(p_latitude)) * sin(radians(pr.latitude))
            )
          )
        )
      ) as distancia_km
    from public.profissionais pr
    inner join public.profiles pf on pf.id = pr.user_id
    where pr.tenant_id = public.current_tenant_id()
      and coalesce(pr.ativo, true) = true
      and coalesce(pr.disponivel, true) = true
      and coalesce(pr.fornecedor_ativo, false) = true
      and pf.role = 'profissional'
      and pr.latitude is not null
      and pr.longitude is not null
  )
  select
    b.fornecedor_id,
    b.nome,
    b.cidade,
    round(b.distancia_km::numeric, 2) as distancia_km,
    b.raio_fornecedor_km
  from base b
  where b.distancia_km <= least(coalesce(p_raio_cliente_km, 20), b.raio_fornecedor_km)
  order by b.distancia_km asc
  limit greatest(coalesce(p_limite, 50), 1);
$$;

revoke all on function public.listar_fornecedores_no_raio(double precision, double precision, integer, integer) from public;
grant execute on function public.listar_fornecedores_no_raio(double precision, double precision, integer, integer) to authenticated;
