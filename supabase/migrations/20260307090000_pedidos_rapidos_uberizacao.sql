-- Modo de atendimento rápido (uberização) coexistindo com modo orçamento
-- Implementação incremental sem quebrar fluxo de propostas atual.

create extension if not exists pgcrypto;

-- =========================================================
-- 1) PEDIDOS: novas colunas para modo rápido
-- =========================================================
alter table public.pedidos
  add column if not exists tipo_atendimento text not null default 'orcamento',
  add column if not exists status_disparo text,
  add column if not exists profissional_aceitou_id uuid references auth.users(id) on delete set null,
  add column if not exists aceito_em timestamptz,
  add column if not exists expira_em timestamptz;

update public.pedidos
set tipo_atendimento = coalesce(nullif(tipo_atendimento, ''), 'orcamento')
where tipo_atendimento is null or tipo_atendimento = '';

alter table public.pedidos
  alter column tipo_atendimento set default 'orcamento';

alter table public.pedidos
  drop constraint if exists pedidos_tipo_atendimento_check;

alter table public.pedidos
  add constraint pedidos_tipo_atendimento_check
  check (tipo_atendimento in ('orcamento', 'rapido'));

alter table public.pedidos
  drop constraint if exists pedidos_status_disparo_check;

alter table public.pedidos
  add constraint pedidos_status_disparo_check
  check (
    status_disparo is null
    or status_disparo in ('pendente', 'disparado', 'aceito', 'expirado', 'cancelado')
  );

create index if not exists pedidos_tipo_atendimento_idx
  on public.pedidos (tipo_atendimento, created_at desc);

create index if not exists pedidos_status_disparo_idx
  on public.pedidos (status_disparo, expira_em);

-- =========================================================
-- 2) PROFISSIONAIS: posição opcional para cálculo de proximidade
-- =========================================================
create table if not exists public.profissionais (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ativo boolean not null default true,
  disponivel boolean not null default true,
  raio_km integer not null default 10,
  latitude double precision,
  longitude double precision,
  location_updated_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.profissionais
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_updated_at timestamptz;

create index if not exists profissionais_location_idx
  on public.profissionais (latitude, longitude);

-- =========================================================
-- 3) TABELA DE DISPARO
-- =========================================================
create table if not exists public.disparo_pedidos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  profissional_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pendente',
  enviado_em timestamptz not null default now(),
  respondido_em timestamptz,
  unique (pedido_id, profissional_id)
);

alter table public.disparo_pedidos
  drop constraint if exists disparo_pedidos_status_check;

alter table public.disparo_pedidos
  add constraint disparo_pedidos_status_check
  check (status in ('pendente', 'visualizado', 'aceito', 'recusado', 'expirado'));

create index if not exists disparo_pedidos_profissional_status_idx
  on public.disparo_pedidos (profissional_id, status, enviado_em desc);

create index if not exists disparo_pedidos_pedido_status_idx
  on public.disparo_pedidos (pedido_id, status);

-- =========================================================
-- 4) RPC: disparar pedido rápido para profissionais elegíveis
-- =========================================================
create or replace function public.disparar_pedido_rapido(
  p_pedido_id uuid,
  p_raio_km integer default 15,
  p_limite_profissionais integer default 5,
  p_janela_minutos integer default 10
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_total integer := 0;
  v_raio integer := greatest(coalesce(p_raio_km, 15), 1);
  v_limite integer := greatest(coalesce(p_limite_profissionais, 5), 1);
  v_janela integer := greatest(coalesce(p_janela_minutos, 10), 1);
  v_pedido public.pedidos%rowtype;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select *
    into v_pedido
    from public.pedidos
   where id = p_pedido_id
   for update;

  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  if v_pedido.cliente_id <> v_uid then
    raise exception 'Sem permissão para disparar este pedido.';
  end if;

  if coalesce(v_pedido.tipo_atendimento, 'orcamento') <> 'rapido' then
    raise exception 'Pedido não está no modo rápido.';
  end if;

  delete from public.disparo_pedidos where pedido_id = p_pedido_id and status in ('pendente', 'visualizado');

  with candidatos as (
    select
      pr.user_id as profissional_id,
      coalesce(pf.plano_ativo, false) as plano_pro,
      coalesce(pr.raio_km, v_raio) as raio_prof,
      case
        when v_pedido.latitude is not null
          and v_pedido.longitude is not null
          and pr.latitude is not null
          and pr.longitude is not null then
          (6371 * acos(
            least(
              1,
              greatest(
                -1,
                cos(radians(v_pedido.latitude))
                * cos(radians(pr.latitude))
                * cos(radians(pr.longitude) - radians(v_pedido.longitude))
                + sin(radians(v_pedido.latitude))
                * sin(radians(pr.latitude))
              )
            )
          ))
        else null
      end as distancia_km
    from public.profissionais pr
    inner join public.profiles pf on pf.id = pr.user_id
    where pf.role = 'profissional'
      and coalesce(pr.ativo, true) = true
      and coalesce(pr.disponivel, true) = true
      and coalesce((to_jsonb(pr)->>'bloqueado')::boolean, false) = false
      and coalesce((to_jsonb(pr)->>'suspenso')::boolean, false) = false
  ), elegiveis as (
    select *
    from candidatos
    where (
      distancia_km is not null and distancia_km <= least(raio_prof, v_raio)
    )
    or (
      distancia_km is null
      and coalesce(trim(lower((select cidade from public.profiles where id = candidatos.profissional_id))), '') <> ''
      and coalesce(trim(lower((select cidade from public.pedidos where id = p_pedido_id))), '') =
          coalesce(trim(lower((select cidade from public.profiles where id = candidatos.profissional_id))), '')
    )
    order by plano_pro desc, distancia_km asc nulls last
    limit v_limite
  ), upserted as (
    insert into public.disparo_pedidos (pedido_id, profissional_id, status, enviado_em, respondido_em)
    select p_pedido_id, profissional_id, 'pendente', now(), null
    from elegiveis
    on conflict (pedido_id, profissional_id)
    do update set
      status = 'pendente',
      enviado_em = now(),
      respondido_em = null
    returning 1
  )
  select count(*) into v_total from upserted;

  if v_total > 0 then
    update public.pedidos
       set status_disparo = 'disparado',
           expira_em = now() + make_interval(mins => v_janela),
           updated_at = now()
     where id = p_pedido_id;
  else
    update public.pedidos
       set status_disparo = 'expirado',
           tipo_atendimento = 'orcamento',
           expira_em = null,
           updated_at = now()
     where id = p_pedido_id;
  end if;

  return v_total;
end;
$$;

grant execute on function public.disparar_pedido_rapido(uuid, integer, integer, integer) to authenticated;

-- =========================================================
-- 5) RPC: aceitar chamado rápido (com lock para corrida)
-- =========================================================
create or replace function public.aceitar_chamado_rapido(
  p_pedido_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_pedido public.pedidos%rowtype;
  v_disparo_id uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select *
    into v_pedido
    from public.pedidos
   where id = p_pedido_id
   for update;

  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  if coalesce(v_pedido.tipo_atendimento, 'orcamento') <> 'rapido' then
    raise exception 'Pedido não está no modo rápido.';
  end if;

  if coalesce(v_pedido.status_disparo, 'pendente') <> 'disparado' then
    return false;
  end if;

  if v_pedido.profissional_aceitou_id is not null then
    return false;
  end if;

  if v_pedido.expira_em is not null and v_pedido.expira_em <= now() then
    update public.disparo_pedidos
       set status = 'expirado', respondido_em = coalesce(respondido_em, now())
     where pedido_id = p_pedido_id and status in ('pendente', 'visualizado');

    update public.pedidos
       set status_disparo = 'expirado',
           tipo_atendimento = 'orcamento',
           expira_em = null,
           updated_at = now()
     where id = p_pedido_id;

    return false;
  end if;

  update public.disparo_pedidos
     set status = 'aceito',
         respondido_em = now()
   where pedido_id = p_pedido_id
     and profissional_id = v_uid
     and status in ('pendente', 'visualizado')
  returning id into v_disparo_id;

  if v_disparo_id is null then
    raise exception 'Chamado não disponível para este profissional.';
  end if;

  update public.disparo_pedidos
     set status = 'expirado',
         respondido_em = coalesce(respondido_em, now())
   where pedido_id = p_pedido_id
     and profissional_id <> v_uid
     and status in ('pendente', 'visualizado');

  update public.pedidos
     set profissional_aceitou_id = v_uid,
         profissional_id = v_uid,
         status_disparo = 'aceito',
         aceito_em = now(),
         expira_em = null,
         status = 'aceita',
         updated_at = now()
   where id = p_pedido_id;

  return true;
end;
$$;

grant execute on function public.aceitar_chamado_rapido(uuid) to authenticated;

-- =========================================================
-- 6) RPC: recusar chamado rápido
-- =========================================================
create or replace function public.recusar_chamado_rapido(
  p_pedido_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_restantes integer := 0;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  update public.disparo_pedidos
     set status = 'recusado',
         respondido_em = now()
   where pedido_id = p_pedido_id
     and profissional_id = v_uid
     and status in ('pendente', 'visualizado');

  select count(*)
    into v_restantes
    from public.disparo_pedidos
   where pedido_id = p_pedido_id
     and status in ('pendente', 'visualizado');

  if v_restantes = 0 then
    update public.pedidos
       set status_disparo = 'expirado',
           tipo_atendimento = 'orcamento',
           expira_em = null,
           updated_at = now()
     where id = p_pedido_id
       and coalesce(status_disparo, 'pendente') = 'disparado'
       and profissional_aceitou_id is null;
  end if;

  return true;
end;
$$;

grant execute on function public.recusar_chamado_rapido(uuid) to authenticated;

-- =========================================================
-- 7) RPC: expirar chamados rápidos (fallback simples)
-- =========================================================
create or replace function public.expirar_chamados_rapidos(
  p_pedido_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer := 0;
begin
  with pedidos_expirados as (
    select p.id
    from public.pedidos p
    where coalesce(p.tipo_atendimento, 'orcamento') = 'rapido'
      and coalesce(p.status_disparo, 'pendente') = 'disparado'
      and p.profissional_aceitou_id is null
      and p.expira_em is not null
      and p.expira_em <= now()
      and (p_pedido_id is null or p.id = p_pedido_id)
  ), upd_disparos as (
    update public.disparo_pedidos dp
       set status = 'expirado',
           respondido_em = coalesce(dp.respondido_em, now())
      where dp.pedido_id in (select id from pedidos_expirados)
        and dp.status in ('pendente', 'visualizado')
    returning 1
  ), upd_pedidos as (
    update public.pedidos p
       set status_disparo = 'expirado',
           tipo_atendimento = 'orcamento',
           expira_em = null,
           updated_at = now()
      where p.id in (select id from pedidos_expirados)
    returning 1
  )
  select count(*) into v_total from upd_pedidos;

  return v_total;
end;
$$;

grant execute on function public.expirar_chamados_rapidos(uuid) to authenticated;

-- =========================================================
-- 8) RLS/POLICIES
-- =========================================================
alter table public.disparo_pedidos enable row level security;

revoke insert, update, delete on public.disparo_pedidos from authenticated;
grant select on public.disparo_pedidos to authenticated;

drop policy if exists disparo_pedidos_select_profissional on public.disparo_pedidos;
create policy disparo_pedidos_select_profissional
on public.disparo_pedidos
for select
to authenticated
using (profissional_id = auth.uid());

drop policy if exists disparo_pedidos_select_cliente_dono_pedido on public.disparo_pedidos;
create policy disparo_pedidos_select_cliente_dono_pedido
on public.disparo_pedidos
for select
to authenticated
using (
  exists (
    select 1
    from public.pedidos p
    where p.id = disparo_pedidos.pedido_id
      and p.cliente_id = auth.uid()
  )
);

-- Profissional só enxerga pedidos rápidos em que foi selecionado.
drop policy if exists pedidos_select_profissional_disparo_rapido on public.pedidos;
create policy pedidos_select_profissional_disparo_rapido
on public.pedidos
for select
to authenticated
using (
  exists (
    select 1
    from public.disparo_pedidos dp
    where dp.pedido_id = pedidos.id
      and dp.profissional_id = auth.uid()
      and dp.status in ('pendente', 'visualizado', 'aceito')
  )
);
