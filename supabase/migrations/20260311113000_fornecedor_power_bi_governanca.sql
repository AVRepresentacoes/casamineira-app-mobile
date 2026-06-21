-- Governança do Power BI do fornecedor: auditoria e controle de escopo por papel.

create table if not exists public.fornecedor_bi_auditoria (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id) on delete cascade,
  fornecedor_id uuid not null references auth.users(id) on delete cascade,
  evento text not null,
  pagina text not null default 'power_bi',
  contexto jsonb,
  created_at timestamptz not null default now()
);

create index if not exists fornecedor_bi_auditoria_tenant_created_idx
  on public.fornecedor_bi_auditoria (tenant_id, created_at desc);

create index if not exists fornecedor_bi_auditoria_user_created_idx
  on public.fornecedor_bi_auditoria (tenant_id, fornecedor_id, created_at desc);

alter table public.fornecedor_bi_auditoria enable row level security;

drop policy if exists fornecedor_bi_auditoria_select_own on public.fornecedor_bi_auditoria;
create policy fornecedor_bi_auditoria_select_own
on public.fornecedor_bi_auditoria
for select
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

drop policy if exists fornecedor_bi_auditoria_insert_own on public.fornecedor_bi_auditoria;
create policy fornecedor_bi_auditoria_insert_own
on public.fornecedor_bi_auditoria
for insert
to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and fornecedor_id = auth.uid()
);

grant select, insert on public.fornecedor_bi_auditoria to authenticated;

create or replace function public.registrar_fornecedor_bi_evento(
  p_evento text,
  p_contexto jsonb default '{}'::jsonb,
  p_pagina text default 'power_bi'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_id uuid;
  v_evento text;
  v_pagina text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  v_evento := lower(trim(coalesce(p_evento, '')));
  if v_evento = '' then
    raise exception 'Evento é obrigatório';
  end if;

  v_pagina := lower(trim(coalesce(p_pagina, 'power_bi')));
  if v_pagina = '' then
    v_pagina := 'power_bi';
  end if;

  insert into public.fornecedor_bi_auditoria (
    tenant_id,
    fornecedor_id,
    evento,
    pagina,
    contexto
  ) values (
    v_tenant,
    v_uid,
    v_evento,
    v_pagina,
    coalesce(p_contexto, '{}'::jsonb)
  ) returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.listar_fornecedor_bi_auditoria(
  p_limit integer default 30
)
returns table (
  id uuid,
  fornecedor_id uuid,
  nome text,
  email text,
  role text,
  evento text,
  pagina text,
  contexto jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_tenant uuid;
  v_role text;
  v_limit integer;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_tenant := public.current_tenant_id();
  if v_tenant is null then
    raise exception 'Tenant ativo não encontrado';
  end if;

  select tu.role
    into v_role
    from public.tenant_users tu
   where tu.tenant_id = v_tenant
     and tu.user_id = v_uid
   limit 1;

  if v_role is null then
    raise exception 'Usuário não pertence ao tenant';
  end if;

  v_limit := greatest(1, least(coalesce(p_limit, 30), 200));

  return query
  select
    a.id,
    a.fornecedor_id,
    coalesce(p.name, split_part(coalesce(u.email, ''), '@', 1), 'Usuário') as nome,
    coalesce(u.email, '') as email,
    coalesce(tu.role, 'staff') as role,
    a.evento,
    a.pagina,
    a.contexto,
    a.created_at
  from public.fornecedor_bi_auditoria a
  left join public.profiles p on p.id = a.fornecedor_id
  left join auth.users u on u.id = a.fornecedor_id
  left join public.tenant_users tu
    on tu.tenant_id = a.tenant_id
   and tu.user_id = a.fornecedor_id
  where a.tenant_id = v_tenant
    and (
      v_role in ('owner', 'admin')
      or a.fornecedor_id = v_uid
    )
  order by a.created_at desc
  limit v_limit;
end;
$$;

revoke all on function public.registrar_fornecedor_bi_evento(text, jsonb, text) from public;
revoke all on function public.listar_fornecedor_bi_auditoria(integer) from public;

grant execute on function public.registrar_fornecedor_bi_evento(text, jsonb, text) to authenticated;
grant execute on function public.listar_fornecedor_bi_auditoria(integer) to authenticated;
