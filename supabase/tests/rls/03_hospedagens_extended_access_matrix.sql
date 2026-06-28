-- Sprint Enterprise 018/020
-- Matriz estendida de auditoria e hardening RLS para Hospedagens Caminhos da Fe.
--
-- Pre-requisito:
--   psql local -f supabase/seed/rls_personas_seed.sql
--
-- Uso:
--   psql local -v ON_ERROR_STOP=1 -f supabase/tests/rls/03_hospedagens_extended_access_matrix.sql
--
-- Nao executar em producao. As fixtures deste teste rodam dentro de transacao
-- e sao revertidas com ROLLBACK ao final.

\set ON_ERROR_STOP on

create temp table rls_hospedagens_extended_results (
  scenario text not null,
  persona text not null,
  table_name text not null,
  check_name text not null,
  severity text not null,
  expected text not null,
  actual text not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);

grant all on table rls_hospedagens_extended_results to public;

create or replace function pg_temp.visible_count(p_sql text)
returns integer
language plpgsql
as $$
declare
  v_count integer;
begin
  execute p_sql into v_count;
  return coalesce(v_count, 0);
exception
  when insufficient_privilege then
    return -1;
end;
$$;

create or replace function pg_temp.record_eq(
  p_scenario text,
  p_persona text,
  p_table_name text,
  p_check_name text,
  p_severity text,
  p_expected integer,
  p_actual integer
)
returns void
language plpgsql
as $$
begin
  insert into rls_hospedagens_extended_results (
    scenario,
    persona,
    table_name,
    check_name,
    severity,
    expected,
    actual,
    passed
  )
  values (
    p_scenario,
    p_persona,
    p_table_name,
    p_check_name,
    p_severity,
    p_expected::text,
    case when p_actual = -1 then 'permission denied' else p_actual::text end,
    p_actual = p_expected
  );
end;
$$;

create or replace function pg_temp.record_private_zero_or_denied(
  p_scenario text,
  p_persona text,
  p_table_name text,
  p_check_name text,
  p_severity text,
  p_actual integer
)
returns void
language plpgsql
as $$
begin
  insert into rls_hospedagens_extended_results (
    scenario,
    persona,
    table_name,
    check_name,
    severity,
    expected,
    actual,
    passed
  )
  values (
    p_scenario,
    p_persona,
    p_table_name,
    p_check_name,
    p_severity,
    '0 visible rows or permission denied',
    case when p_actual = -1 then 'permission denied' else p_actual::text end,
    p_actual in (-1, 0)
  );
end;
$$;

begin;

-- Fixtures transitorias de Hospedagens.
insert into public.caminho_hospedagem_pousadas (
  id,
  tenant_id,
  owner_user_id,
  slug,
  nome,
  cidade,
  uf,
  endereco,
  whatsapp,
  descricao,
  status,
  visivel,
  auto_confirmar,
  gateway_status
)
values
  ('71000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','pousada-rls-018-publica','Pousada RLS 018 Publica','Aparecida','SP','Rua Publica 18','11999991801','Fixture publica de auditoria RLS 018','aprovada',true,true,'ativa'),
  ('71000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','pousada-rls-018-privada','Pousada RLS 018 Privada','Aparecida','SP','Rua Privada 18','11999991802','Fixture privada operacional de auditoria RLS 018','pendente',false,false,'pendente')
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  owner_user_id = excluded.owner_user_id,
  slug = excluded.slug,
  nome = excluded.nome,
  cidade = excluded.cidade,
  uf = excluded.uf,
  endereco = excluded.endereco,
  whatsapp = excluded.whatsapp,
  descricao = excluded.descricao,
  status = excluded.status,
  visivel = excluded.visivel,
  auto_confirmar = excluded.auto_confirmar,
  gateway_status = excluded.gateway_status,
  updated_at = now();

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
values
  ('72000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','71000000-0000-4000-8000-000000000001','quarto-rls-018-publico','Quarto RLS 018 Publico','privativo',2,250.00,true,true),
  ('72000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','71000000-0000-4000-8000-000000000002','quarto-rls-018-privado','Quarto RLS 018 Privado','privativo',1,100.00,false,false)
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  pousada_id = excluded.pousada_id,
  slug = excluded.slug,
  nome = excluded.nome,
  tipo = excluded.tipo,
  capacidade = excluded.capacidade,
  diaria = excluded.diaria,
  disponivel = excluded.disponivel,
  ativo = excluded.ativo,
  updated_at = now();

insert into public.caminho_hospedagem_servicos (
  id,
  tenant_id,
  pousada_id,
  slug,
  nome,
  descricao,
  preco,
  unidade,
  categoria,
  confirmacao,
  ativo
)
values
  ('73000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','71000000-0000-4000-8000-000000000001','servico-rls-018-publico','Servico RLS 018 Publico','Servico publico da fixture RLS 018',20.00,'por unidade','apoio','imediata',true),
  ('73000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','71000000-0000-4000-8000-000000000002','servico-rls-018-privado','Servico RLS 018 Privado','Servico privado da fixture RLS 018',99.00,'por unidade','interno','manual',false)
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  pousada_id = excluded.pousada_id,
  slug = excluded.slug,
  nome = excluded.nome,
  descricao = excluded.descricao,
  preco = excluded.preco,
  unidade = excluded.unidade,
  categoria = excluded.categoria,
  confirmacao = excluded.confirmacao,
  ativo = excluded.ativo,
  updated_at = now();

insert into public.caminho_hospedagem_disponibilidade (
  id,
  tenant_id,
  pousada_id,
  dia,
  status,
  detalhe
)
values
  ('74000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','71000000-0000-4000-8000-000000000001','2026-09-01','livre','Disponibilidade publica da fixture RLS 018'),
  ('74000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','71000000-0000-4000-8000-000000000002','2026-09-02','bloqueado','Bloqueio privado operacional da fixture RLS 018')
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  pousada_id = excluded.pousada_id,
  dia = excluded.dia,
  status = excluded.status,
  detalhe = excluded.detalhe,
  updated_at = now();

insert into public.caminho_hospedagem_aceites (
  id,
  tenant_id,
  user_id,
  papel,
  documento,
  versao,
  ip,
  user_agent,
  metadata
)
values
  ('75000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000005','cliente','termos_cliente','rls-018','127.0.0.1','rls-018','{"scope":"own"}'::jsonb),
  ('75000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000006','cliente','termos_cliente','rls-018','127.0.0.1','rls-018','{"scope":"other"}'::jsonb)
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  user_id = excluded.user_id,
  papel = excluded.papel,
  documento = excluded.documento,
  versao = excluded.versao,
  ip = excluded.ip,
  user_agent = excluded.user_agent,
  metadata = excluded.metadata;

insert into public.caminho_hospedagem_avaliacoes (
  id,
  tenant_id,
  reserva_id,
  cliente_id,
  hospedagem_slug,
  hospedagem_nome,
  nota_geral,
  limpeza,
  atendimento,
  localizacao,
  custo_beneficio,
  comentario,
  publicada
)
values
  ('76000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000005','pousada-rls-018-publica','Pousada RLS 018 Publica',5,5,5,5,5,'Avaliacao propria privada RLS 018',false),
  ('76000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000006','pousada-rls-018-privada','Pousada RLS 018 Privada',4,4,4,4,4,'Avaliacao de outro cliente privada RLS 018',false),
  ('76000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003',null,'10000000-0000-4000-8000-000000000006','pousada-rls-018-publica','Pousada RLS 018 Publica',5,5,5,5,5,'Avaliacao publica RLS 018',true)
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  reserva_id = excluded.reserva_id,
  cliente_id = excluded.cliente_id,
  hospedagem_slug = excluded.hospedagem_slug,
  hospedagem_nome = excluded.hospedagem_nome,
  nota_geral = excluded.nota_geral,
  limpeza = excluded.limpeza,
  atendimento = excluded.atendimento,
  localizacao = excluded.localizacao,
  custo_beneficio = excluded.custo_beneficio,
  comentario = excluded.comentario,
  publicada = excluded.publicada,
  updated_at = now();

insert into public.caminho_hospedagem_favoritos (
  id,
  tenant_id,
  user_id,
  hospedagem_slug,
  hospedagem_nome,
  cidade,
  etapa_ordem,
  checkin_planejado,
  observacao
)
values
  ('77000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000005','pousada-rls-018-publica','Pousada RLS 018 Publica','Aparecida',1,'2026-09-01','Favorito proprio RLS 018'),
  ('77000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000006','pousada-rls-018-privada','Pousada RLS 018 Privada','Aparecida',2,'2026-09-02','Favorito de outro cliente RLS 018')
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  user_id = excluded.user_id,
  hospedagem_slug = excluded.hospedagem_slug,
  hospedagem_nome = excluded.hospedagem_nome,
  cidade = excluded.cidade,
  etapa_ordem = excluded.etapa_ordem,
  checkin_planejado = excluded.checkin_planejado,
  observacao = excluded.observacao,
  updated_at = now();

insert into public.caminho_hospedagem_notificacoes (
  id,
  tenant_id,
  user_id,
  papel,
  titulo,
  mensagem,
  tipo,
  lida,
  metadata
)
values
  ('78000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000005','cliente','Notificacao propria RLS 018','Mensagem propria RLS 018','reserva',false,'{"scope":"own"}'::jsonb),
  ('78000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000006','cliente','Notificacao outro cliente RLS 018','Mensagem de outro cliente RLS 018','reserva',false,'{"scope":"other"}'::jsonb)
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  user_id = excluded.user_id,
  papel = excluded.papel,
  titulo = excluded.titulo,
  mensagem = excluded.mensagem,
  tipo = excluded.tipo,
  lida = excluded.lida,
  metadata = excluded.metadata;

insert into public.caminho_hospedagem_chamados (
  id,
  tenant_id,
  reserva_id,
  cliente_id,
  pousada_id,
  aberto_por,
  papel_abertura,
  tipo,
  prioridade,
  status,
  titulo,
  descricao,
  evidencias
)
values
  ('79000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000005','71000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000005','cliente','duvida','normal','aberto','Chamado proprio RLS 018','Chamado proprio do cliente hospedagens','{}'),
  ('79000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000006','71000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000006','cliente','duvida','normal','aberto','Chamado outro cliente RLS 018','Chamado de outro cliente hospedagens','{}')
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  reserva_id = excluded.reserva_id,
  cliente_id = excluded.cliente_id,
  pousada_id = excluded.pousada_id,
  aberto_por = excluded.aberto_por,
  papel_abertura = excluded.papel_abertura,
  tipo = excluded.tipo,
  prioridade = excluded.prioridade,
  status = excluded.status,
  titulo = excluded.titulo,
  descricao = excluded.descricao,
  evidencias = excluded.evidencias,
  updated_at = now();

insert into public.caminho_hospedagem_pousada_saldos (
  id,
  tenant_id,
  hospedagem_slug,
  saldo,
  saldo_negativo
)
values
  ('7a000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','pousada-rls-018-publica',150.00,0.00)
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  hospedagem_slug = excluded.hospedagem_slug,
  saldo = excluded.saldo,
  saldo_negativo = excluded.saldo_negativo,
  updated_at = now();

insert into public.caminho_hospedagem_movimentos (
  id,
  tenant_id,
  reserva_id,
  hospedagem_slug,
  tipo,
  valor,
  descricao
)
values
  ('7b000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000001','pousada-rls-018-publica','repasse',150.00,'Movimento privado RLS 018')
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  reserva_id = excluded.reserva_id,
  hospedagem_slug = excluded.hospedagem_slug,
  tipo = excluded.tipo,
  valor = excluded.valor,
  descricao = excluded.descricao;

-- cliente_hospedagens: dados privados proprios x outro cliente.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000005","role":"authenticated","tenant_id":"20000000-0000-4000-8000-000000000003"}',
  true
);

select pg_temp.record_eq('cliente ve apenas dados privados proprios', 'cliente_hospedagens', 'caminho_hospedagem_aceites', 'aceites proprios', 'P0', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_aceites where user_id = auth.uid() and versao = 'rls-018'$$));
select pg_temp.record_eq('cliente ve apenas dados privados proprios', 'cliente_hospedagens', 'caminho_hospedagem_aceites', 'aceites de outro cliente', 'P0', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_aceites where user_id <> auth.uid() and versao = 'rls-018'$$));
select pg_temp.record_eq('cliente ve apenas dados privados proprios', 'cliente_hospedagens', 'caminho_hospedagem_favoritos', 'favoritos proprios', 'P0', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_favoritos where user_id = auth.uid() and hospedagem_slug like 'pousada-rls-018%'$$));
select pg_temp.record_eq('cliente ve apenas dados privados proprios', 'cliente_hospedagens', 'caminho_hospedagem_favoritos', 'favoritos de outro cliente', 'P0', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_favoritos where user_id <> auth.uid() and hospedagem_slug like 'pousada-rls-018%'$$));
select pg_temp.record_eq('cliente ve apenas dados privados proprios', 'cliente_hospedagens', 'caminho_hospedagem_notificacoes', 'notificacoes proprias', 'P0', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_notificacoes where user_id = auth.uid() and metadata->>'scope' = 'own'$$));
select pg_temp.record_eq('cliente ve apenas dados privados proprios', 'cliente_hospedagens', 'caminho_hospedagem_notificacoes', 'notificacoes de outro cliente', 'P0', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_notificacoes where user_id <> auth.uid() and metadata->>'scope' = 'other'$$));
select pg_temp.record_eq('cliente ve apenas dados privados proprios', 'cliente_hospedagens', 'caminho_hospedagem_chamados', 'chamados proprios', 'P0', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_chamados where cliente_id = auth.uid() and titulo like '%RLS 018%'$$));
select pg_temp.record_eq('cliente ve apenas dados privados proprios', 'cliente_hospedagens', 'caminho_hospedagem_chamados', 'chamados de outro cliente', 'P0', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_chamados where cliente_id <> auth.uid() and titulo like '%RLS 018%'$$));
select pg_temp.record_eq('cliente ve apenas dados privados proprios', 'cliente_hospedagens', 'caminho_hospedagem_avaliacoes', 'avaliacoes privadas proprias', 'P0', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_avaliacoes where cliente_id = auth.uid() and publicada = false and comentario like '%RLS 018%'$$));
select pg_temp.record_eq('cliente ve apenas dados privados proprios', 'cliente_hospedagens', 'caminho_hospedagem_avaliacoes', 'avaliacoes privadas de outro cliente', 'P0', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_avaliacoes where cliente_id <> auth.uid() and publicada = false and comentario like '%RLS 018%'$$));

select pg_temp.record_eq('cliente nao ve dados operacionais privados', 'cliente_hospedagens', 'caminho_hospedagem_pousadas', 'pousadas privadas operacionais', 'P1', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_pousadas where slug = 'pousada-rls-018-privada'$$));
select pg_temp.record_eq('cliente ve catalogo operacional publico', 'cliente_hospedagens', 'caminho_hospedagem_pousadas', 'pousadas publicas', 'P1', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_pousadas where slug = 'pousada-rls-018-publica'$$));
select pg_temp.record_eq('cliente nao ve dados operacionais privados', 'cliente_hospedagens', 'caminho_hospedagem_quartos', 'quartos privados operacionais', 'P1', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_quartos where slug = 'quarto-rls-018-privado'$$));
select pg_temp.record_eq('cliente ve catalogo operacional publico', 'cliente_hospedagens', 'caminho_hospedagem_quartos', 'quartos publicos', 'P1', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_quartos where slug = 'quarto-rls-018-publico'$$));
select pg_temp.record_eq('cliente nao ve dados operacionais privados', 'cliente_hospedagens', 'caminho_hospedagem_servicos', 'servicos privados operacionais', 'P1', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_servicos where slug = 'servico-rls-018-privado'$$));
select pg_temp.record_eq('cliente ve catalogo operacional publico', 'cliente_hospedagens', 'caminho_hospedagem_servicos', 'servicos publicos', 'P1', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_servicos where slug = 'servico-rls-018-publico'$$));
select pg_temp.record_eq('cliente nao ve dados operacionais privados', 'cliente_hospedagens', 'caminho_hospedagem_disponibilidade', 'bloqueios privados operacionais', 'P1', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_disponibilidade where status <> 'livre' and detalhe like '%RLS 018%'$$));
select pg_temp.record_eq('cliente ve catalogo operacional publico', 'cliente_hospedagens', 'caminho_hospedagem_disponibilidade', 'disponibilidade livre publica', 'P1', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_disponibilidade where status = 'livre' and detalhe like '%RLS 018%'$$));

-- hospedagens_owner: deve ver dados do tenant.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated","tenant_id":"20000000-0000-4000-8000-000000000003"}',
  true
);

select pg_temp.record_eq('owner ve dados do tenant', 'hospedagens_owner', 'caminho_hospedagem_pousadas', 'pousadas rls018', 'P1', 2, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_pousadas where slug like 'pousada-rls-018%'$$));
select pg_temp.record_eq('owner ve dados do tenant', 'hospedagens_owner', 'caminho_hospedagem_quartos', 'quartos rls018', 'P1', 2, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_quartos where slug like 'quarto-rls-018%'$$));
select pg_temp.record_eq('owner ve dados do tenant', 'hospedagens_owner', 'caminho_hospedagem_servicos', 'servicos rls018', 'P1', 2, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_servicos where slug like 'servico-rls-018%'$$));
select pg_temp.record_eq('owner ve dados do tenant', 'hospedagens_owner', 'caminho_hospedagem_disponibilidade', 'disponibilidades rls018', 'P1', 2, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_disponibilidade where detalhe like '%RLS 018%'$$));
select pg_temp.record_eq('owner ve dados do tenant', 'hospedagens_owner', 'caminho_hospedagem_chamados', 'chamados rls018', 'P1', 2, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_chamados where titulo like '%RLS 018%'$$));
select pg_temp.record_eq('owner ve dados do tenant', 'hospedagens_owner', 'caminho_hospedagem_notificacoes', 'notificacoes rls018', 'P1', 2, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_notificacoes where titulo like '%RLS 018%'$$));
select pg_temp.record_eq('owner ve dados do tenant', 'hospedagens_owner', 'caminho_hospedagem_pousada_saldos', 'saldos rls018', 'P1', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_pousada_saldos where hospedagem_slug = 'pousada-rls-018-publica'$$));
select pg_temp.record_eq('owner ve dados do tenant', 'hospedagens_owner', 'caminho_hospedagem_movimentos', 'movimentos rls018', 'P1', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_movimentos where descricao like '%RLS 018%'$$));

-- usuario de outro tenant: nao deve ver dados privados de Hospedagens.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated","tenant_id":"20000000-0000-4000-8000-000000000002"}',
  true
);

select pg_temp.record_eq('outro tenant nao ve hospedagens privadas', 'casa_mineira_servicos_owner', 'caminho_hospedagem_chamados', 'chamados rls018', 'P0', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_chamados where titulo like '%RLS 018%'$$));
select pg_temp.record_eq('outro tenant nao ve hospedagens privadas', 'casa_mineira_servicos_owner', 'caminho_hospedagem_notificacoes', 'notificacoes rls018', 'P0', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_notificacoes where titulo like '%RLS 018%'$$));
select pg_temp.record_eq('outro tenant nao ve hospedagens privadas', 'casa_mineira_servicos_owner', 'caminho_hospedagem_favoritos', 'favoritos rls018', 'P0', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_favoritos where hospedagem_slug like 'pousada-rls-018%'$$));
select pg_temp.record_eq('outro tenant nao ve hospedagens privadas', 'casa_mineira_servicos_owner', 'caminho_hospedagem_pousadas', 'pousadas privadas operacionais', 'P1', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_pousadas where slug = 'pousada-rls-018-privada'$$));
select pg_temp.record_eq('outro tenant nao ve hospedagens privadas', 'casa_mineira_servicos_owner', 'caminho_hospedagem_quartos', 'quartos privados operacionais', 'P1', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_quartos where slug = 'quarto-rls-018-privado'$$));
select pg_temp.record_eq('outro tenant nao ve hospedagens privadas', 'casa_mineira_servicos_owner', 'caminho_hospedagem_servicos', 'servicos privados operacionais', 'P1', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_servicos where slug = 'servico-rls-018-privado'$$));
select pg_temp.record_eq('outro tenant nao ve hospedagens privadas', 'casa_mineira_servicos_owner', 'caminho_hospedagem_disponibilidade', 'bloqueios privados operacionais', 'P1', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_disponibilidade where status <> 'livre' and detalhe like '%RLS 018%'$$));
select pg_temp.record_eq('outro tenant nao ve hospedagens privadas', 'casa_mineira_servicos_owner', 'caminho_hospedagem_pousada_saldos', 'saldos rls018', 'P1', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_pousada_saldos where hospedagem_slug = 'pousada-rls-018-publica'$$));
select pg_temp.record_eq('outro tenant nao ve hospedagens privadas', 'casa_mineira_servicos_owner', 'caminho_hospedagem_movimentos', 'movimentos rls018', 'P1', 0, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_movimentos where descricao like '%RLS 018%'$$));

-- anon: somente publico quando houver policy/grant publico; privados devem ficar invisiveis.
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select pg_temp.record_private_zero_or_denied('anon nao ve dados privados', 'anon', 'caminho_hospedagem_pousada_saldos', 'saldos privados', 'P1', pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_pousada_saldos where hospedagem_slug = 'pousada-rls-018-publica'$$));
select pg_temp.record_private_zero_or_denied('anon nao ve dados privados', 'anon', 'caminho_hospedagem_movimentos', 'movimentos privados', 'P1', pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_movimentos where descricao like '%RLS 018%'$$));
select pg_temp.record_private_zero_or_denied('anon nao ve dados privados', 'anon', 'caminho_hospedagem_chamados', 'chamados privados', 'P0', pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_chamados where titulo like '%RLS 018%'$$));
select pg_temp.record_private_zero_or_denied('anon nao ve dados privados', 'anon', 'caminho_hospedagem_notificacoes', 'notificacoes privadas', 'P0', pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_notificacoes where titulo like '%RLS 018%'$$));
select pg_temp.record_private_zero_or_denied('anon nao ve dados privados', 'anon', 'caminho_hospedagem_pousadas', 'pousadas privadas operacionais', 'P1', pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_pousadas where slug = 'pousada-rls-018-privada'$$));
select pg_temp.record_private_zero_or_denied('anon nao ve dados privados', 'anon', 'caminho_hospedagem_quartos', 'quartos privados operacionais', 'P1', pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_quartos where slug = 'quarto-rls-018-privado'$$));
select pg_temp.record_private_zero_or_denied('anon nao ve dados privados', 'anon', 'caminho_hospedagem_servicos', 'servicos privados operacionais', 'P1', pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_servicos where slug = 'servico-rls-018-privado'$$));
select pg_temp.record_private_zero_or_denied('anon nao ve dados privados', 'anon', 'caminho_hospedagem_disponibilidade', 'bloqueios privados operacionais', 'P1', pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_disponibilidade where status <> 'livre' and detalhe like '%RLS 018%'$$));
select pg_temp.record_eq('anon catalogo publico permitido por RLS filtrada', 'anon', 'caminho_hospedagem_pousadas', 'pousadas publicas', 'P1', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_pousadas where slug = 'pousada-rls-018-publica'$$));
select pg_temp.record_eq('anon catalogo publico permitido por RLS filtrada', 'anon', 'caminho_hospedagem_quartos', 'quartos publicos', 'P1', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_quartos where slug = 'quarto-rls-018-publico'$$));
select pg_temp.record_eq('anon catalogo publico permitido por RLS filtrada', 'anon', 'caminho_hospedagem_servicos', 'servicos publicos', 'P1', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_servicos where slug = 'servico-rls-018-publico'$$));
select pg_temp.record_eq('anon catalogo publico permitido por RLS filtrada', 'anon', 'caminho_hospedagem_disponibilidade', 'disponibilidade publica', 'P1', 1, pg_temp.visible_count($$select count(*) from public.caminho_hospedagem_disponibilidade where status = 'livre' and detalhe like '%RLS 018%'$$));

reset role;

select
  severity,
  persona,
  table_name,
  scenario,
  check_name,
  expected,
  actual,
  passed
from rls_hospedagens_extended_results
order by
  case severity when 'P0' then 0 when 'P1' then 1 else 2 end,
  persona,
  table_name,
  check_name;

do $$
declare
  v_blocking_failures integer;
begin
  select count(*) into v_blocking_failures
  from rls_hospedagens_extended_results
  where passed = false
    and severity in ('P0', 'P1');

  if v_blocking_failures > 0 then
    raise exception 'Hospedagens extended RLS matrix failed: % failing P0/P1 checks. See result rows above.', v_blocking_failures;
  end if;
end;
$$;

rollback;
