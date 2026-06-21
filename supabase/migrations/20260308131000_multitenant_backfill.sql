-- Fase 1: adiciona tenant_id sem quebrar fluxo legado

create extension if not exists pgcrypto;

insert into public.tenants (slug, name, status, plan_code)
values ('default', 'Default Tenant', 'active', 'starter')
on conflict (slug) do nothing;

do $$
declare
  v_default_tenant uuid;
  v_table text;
  v_tables text[] := array[
    'profiles',
    'pedidos',
    'propostas',
    'pagamentos',
    'comissoes',
    'mensagens',
    'disparo_pedidos',
    'avaliacoes',
    'analytics_eventos',
    'contratos_digitais',
    'escrow_milestones',
    'banners_publicitarios',
    'profissionais'
  ];
begin
  select id into v_default_tenant from public.tenants where slug = 'default' limit 1;

  if v_default_tenant is null then
    raise exception 'Tenant default não encontrado';
  end if;

  foreach v_table in array v_tables loop
    if to_regclass('public.' || v_table) is not null then
      execute format('alter table public.%I add column if not exists tenant_id uuid', v_table);
      execute format('update public.%I set tenant_id = %L where tenant_id is null', v_table, v_default_tenant);
      execute format('alter table public.%I alter column tenant_id set default public.default_tenant_id()', v_table);

      begin
        execute format(
          'alter table public.%I add constraint %I foreign key (tenant_id) references public.tenants(id) not valid',
          v_table,
          v_table || '_tenant_id_fkey'
        );
      exception when duplicate_object then
        null;
      end;

      begin
        execute format('alter table public.%I validate constraint %I', v_table, v_table || '_tenant_id_fkey');
      exception when undefined_object then
        null;
      end;
    end if;
  end loop;

  -- cria membership default para usuários já existentes
  insert into public.tenant_users (tenant_id, user_id, role, is_default)
  select v_default_tenant, u.id, 'owner', true
  from auth.users u
  on conflict (tenant_id, user_id) do update
    set is_default = true;

  -- reforça unicidade de default por usuário
  with ranked as (
    select
      id,
      row_number() over (partition by user_id order by is_default desc, created_at asc) as rn
    from public.tenant_users
  )
  update public.tenant_users tu
  set is_default = (ranked.rn = 1)
  from ranked
  where ranked.id = tu.id;
end $$;

