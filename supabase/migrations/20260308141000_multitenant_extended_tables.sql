-- Expande tenant_id para tabelas usadas no app e aplica guardas onde houver RLS.

do $$
declare
  v_default_tenant uuid;
  v_table text;
  v_has_user_id boolean;
  v_has_profissional_id boolean;
  v_has_cliente_id boolean;
  v_has_created_at boolean;
  v_has_status boolean;
  v_rls_enabled boolean;
  v_tables text[] := array[
    'wallets',
    'wallet_transactions',
    'servicos',
    'portfolio',
    'contratos'
  ];
begin
  v_default_tenant := public.default_tenant_id();
  if v_default_tenant is null then
    raise exception 'Tenant default não encontrado';
  end if;

  foreach v_table in array v_tables loop
    if to_regclass('public.' || v_table) is null then
      continue;
    end if;

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

    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = v_table and column_name = 'user_id'
    ) into v_has_user_id;

    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = v_table and column_name = 'profissional_id'
    ) into v_has_profissional_id;

    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = v_table and column_name = 'cliente_id'
    ) into v_has_cliente_id;

    if v_has_user_id then
      execute format(
        'update public.%I t
            set tenant_id = coalesce(
              (select tu.tenant_id from public.tenant_users tu where tu.user_id = t.user_id and tu.is_default = true limit 1),
              tenant_id
            )
          where t.user_id is not null and t.tenant_id is not null',
        v_table
      );
    end if;

    if v_has_profissional_id then
      execute format(
        'update public.%I t
            set tenant_id = coalesce(
              (select tu.tenant_id from public.tenant_users tu where tu.user_id = t.profissional_id and tu.is_default = true limit 1),
              tenant_id
            )
          where t.profissional_id is not null and t.tenant_id is not null',
        v_table
      );
    end if;

    if v_has_cliente_id then
      execute format(
        'update public.%I t
            set tenant_id = coalesce(
              (select tu.tenant_id from public.tenant_users tu where tu.user_id = t.cliente_id and tu.is_default = true limit 1),
              tenant_id
            )
          where t.cliente_id is not null and t.tenant_id is not null',
        v_table
      );
    end if;

    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = v_table and column_name = 'created_at'
    ) into v_has_created_at;

    if v_has_created_at then
      execute format(
        'create index if not exists %I on public.%I (tenant_id, created_at desc)',
        v_table || '_tenant_created_idx',
        v_table
      );
    else
      execute format(
        'create index if not exists %I on public.%I (tenant_id)',
        v_table || '_tenant_idx',
        v_table
      );
    end if;

    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = v_table and column_name = 'status'
    ) into v_has_status;

    if v_has_status then
      execute format(
        'create index if not exists %I on public.%I (tenant_id, status)',
        v_table || '_tenant_status_idx',
        v_table
      );
    end if;

    select c.relrowsecurity
      into v_rls_enabled
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = v_table
     limit 1;

    if coalesce(v_rls_enabled, false) then
      execute format('drop policy if exists %I on public.%I', v_table || '_tenant_guard_select', v_table);
      execute format(
        'create policy %I on public.%I as restrictive for select to authenticated using (tenant_id = public.current_tenant_id())',
        v_table || '_tenant_guard_select',
        v_table
      );

      execute format('drop policy if exists %I on public.%I', v_table || '_tenant_guard_mod', v_table);
      execute format(
        'create policy %I on public.%I as restrictive for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id())',
        v_table || '_tenant_guard_mod',
        v_table
      );
    end if;
  end loop;
end $$;
