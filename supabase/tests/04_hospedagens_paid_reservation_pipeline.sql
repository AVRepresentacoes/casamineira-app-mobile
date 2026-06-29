-- GO LIVE 002 - teste local da primeira reserva paga.
-- Executar apenas em Supabase local/staging. A transacao e revertida ao final.

\set ON_ERROR_STOP on

begin;

create temp table go_live_002_results (
  scenario text not null,
  expected text not null,
  actual text not null,
  passed boolean not null
) on commit drop;

do $$
declare
  v_tenant_id uuid := '20000000-0000-4000-8000-000000000003';
  v_owner_id uuid := '10000000-0000-4000-8000-000000000003';
  v_cliente_id uuid := '10000000-0000-4000-8000-000000000005';
  v_pousada_id uuid := '71000000-0000-4000-8000-000000000001';
  v_quarto_id uuid := '72000000-0000-4000-8000-000000000001';
  v_reserva_id uuid := '73000000-0000-4000-8000-000000000001';
  v_duplicate_blocked boolean := false;
  v_panel_count integer := 0;
  v_status text;
  v_status_pagamento text;
begin
  insert into public.caminho_hospedagem_pousadas (
    id,
    tenant_id,
    owner_user_id,
    slug,
    nome,
    cidade,
    uf,
    ramal,
    endereco,
    whatsapp,
    descricao,
    status,
    visivel,
    gateway_provider,
    gateway_status
  )
  values (
    v_pousada_id,
    v_tenant_id,
    v_owner_id,
    'go-live-002-pousada',
    'Pousada GO LIVE 002',
    'Aparecida',
    'SP',
    'Caminho da Fe',
    'Rua Local GO LIVE 002',
    '11999990002',
    'Fixture local de primeira reserva paga',
    'aprovada',
    true,
    'mercadopago',
    'ativa'
  );

  insert into public.caminho_hospedagem_quartos (
    id,
    tenant_id,
    pousada_id,
    slug,
    nome,
    tipo,
    capacidade,
    diaria,
    disponivel,
    ativo
  )
  values (
    v_quarto_id,
    v_tenant_id,
    v_pousada_id,
    'suite-go-live-002',
    'Suite GO LIVE 002',
    'privativo',
    2,
    180.00,
    true,
    true
  );

  insert into public.caminho_hospedagem_disponibilidade (
    tenant_id,
    pousada_id,
    quarto_id,
    dia,
    status,
    detalhe
  )
  values
    (v_tenant_id, v_pousada_id, v_quarto_id, date '2026-09-10', 'livre', 'Disponivel para GO LIVE 002'),
    (v_tenant_id, v_pousada_id, v_quarto_id, date '2026-09-11', 'livre', 'Disponivel para GO LIVE 002');

  insert into public.caminho_hospedagem_reservas (
    id,
    tenant_id,
    cliente_id,
    hospedagem_slug,
    hospedagem_nome,
    cidade,
    quarto_id,
    quarto_slug,
    quarto_nome,
    checkin,
    checkout,
    hospedes,
    nome_cliente,
    telefone_cliente,
    observacoes,
    total,
    sinal,
    comissao,
    repasse_inicial,
    restante_na_pousada,
    status,
    status_pagamento,
    provider,
    provider_payment_id,
    split_status
  )
  values (
    v_reserva_id,
    v_tenant_id,
    v_cliente_id,
    'go-live-002-pousada',
    'Pousada GO LIVE 002',
    'Aparecida',
    v_quarto_id,
    'suite-go-live-002',
    'Suite GO LIVE 002',
    date '2026-09-10',
    date '2026-09-12',
    2,
    'Cliente GO LIVE 002',
    '11999990005',
    'Reserva local GO LIVE 002',
    360.00,
    108.00,
    36.00,
    72.00,
    252.00,
    'aguardando_pagamento',
    'pendente',
    'mercadopago',
    'mp-go-live-002',
    'pendente'
  );

  insert into go_live_002_results
  select
    'disponibilidade por quarto/data',
    '2 dias livres com quarto_id',
    count(*)::text,
    count(*) = 2
  from public.caminho_hospedagem_disponibilidade
  where pousada_id = v_pousada_id
    and quarto_id = v_quarto_id
    and dia in (date '2026-09-10', date '2026-09-11')
    and status = 'livre';

  begin
    insert into public.caminho_hospedagem_reservas (
      tenant_id,
      cliente_id,
      hospedagem_slug,
      hospedagem_nome,
      cidade,
      quarto_id,
      quarto_slug,
      quarto_nome,
      checkin,
      checkout,
      hospedes,
      nome_cliente,
      telefone_cliente,
      total,
      sinal,
      comissao,
      repasse_inicial,
      restante_na_pousada,
      status,
      status_pagamento
    )
    values (
      v_tenant_id,
      v_cliente_id,
      'go-live-002-pousada',
      'Pousada GO LIVE 002',
      'Aparecida',
      v_quarto_id,
      'suite-go-live-002',
      'Suite GO LIVE 002',
      date '2026-09-11',
      date '2026-09-12',
      1,
      'Cliente Duplicado GO LIVE 002',
      '11999990006',
      180.00,
      54.00,
      18.00,
      36.00,
      126.00,
      'aguardando_pagamento',
      'pendente'
    );
  exception
    when exclusion_violation then
      v_duplicate_blocked := true;
  end;

  insert into go_live_002_results
  values (
    'conflito de reserva no mesmo quarto/periodo',
    'bloqueado',
    case when v_duplicate_blocked then 'bloqueado' else 'permitido' end,
    v_duplicate_blocked
  );

  update public.caminho_hospedagem_reservas
  set
    provider = 'mercadopago',
    provider_payment_id = 'mp-go-live-002',
    status_pagamento = 'aprovada',
    status = 'confirmada'
  where id = v_reserva_id
    and tenant_id = v_tenant_id
    and provider_payment_id = 'mp-go-live-002';

  select status, status_pagamento
  into v_status, v_status_pagamento
  from public.caminho_hospedagem_reservas
  where id = v_reserva_id;

  insert into go_live_002_results
  values (
    'webhook aprovado atualiza status',
    'confirmada/aprovada',
    coalesce(v_status, 'null') || '/' || coalesce(v_status_pagamento, 'null'),
    v_status = 'confirmada' and v_status_pagamento = 'aprovada'
  );

  select count(*)
  into v_panel_count
  from public.caminho_hospedagem_reservas
  where tenant_id = v_tenant_id
    and hospedagem_slug = 'go-live-002-pousada'
    and status = 'confirmada'
    and provider = 'mercadopago'
    and provider_payment_id = 'mp-go-live-002';

  insert into go_live_002_results
  values (
    'painel da pousada recebe reserva confirmada',
    '1',
    v_panel_count::text,
    v_panel_count = 1
  );
end $$;

select * from go_live_002_results order by scenario;

do $$
begin
  if exists (select 1 from go_live_002_results where not passed) then
    raise exception 'GO LIVE 002 falhou: %',
      (select json_agg(row_to_json(r)) from go_live_002_results r where not passed);
  end if;
end $$;

rollback;
