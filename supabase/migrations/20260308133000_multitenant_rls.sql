-- Fase 1: guarda tenant via RLS restritiva (mantendo policies antigas)

do $$
declare
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
  foreach v_table in array v_tables loop
    if to_regclass('public.' || v_table) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', v_table);

    begin
      execute format('drop policy if exists %I on public.%I', v_table || '_tenant_guard_select', v_table);
      execute format(
        'create policy %I on public.%I as restrictive for select to authenticated using (tenant_id = public.current_tenant_id())',
        v_table || '_tenant_guard_select',
        v_table
      );
    exception when others then
      null;
    end;

    begin
      execute format('drop policy if exists %I on public.%I', v_table || '_tenant_guard_mod', v_table);
      execute format(
        'create policy %I on public.%I as restrictive for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id())',
        v_table || '_tenant_guard_mod',
        v_table
      );
    exception when others then
      null;
    end;
  end loop;
end $$;

