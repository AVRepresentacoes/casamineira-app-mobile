-- Sprint Enterprise 016
-- Seed local para testes RLS com personas reais.
--
-- Uso: executar apenas no Supabase local. Nao executar em producao.
-- Este seed e idempotente e nao apaga dados, nao altera policies e nao move dados.

create extension if not exists pgcrypto;

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  ('10000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','saas_owner+rls016@local.test',crypt('local-rls-016', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"name":"RLS 016 SaaS Owner"}'::jsonb,now(),now()),
  ('10000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','casa_mineira_servicos_owner+rls016@local.test',crypt('local-rls-016', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"name":"RLS 016 Casa Mineira Servicos Owner"}'::jsonb,now(),now()),
  ('10000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','hospedagens_owner+rls016@local.test',crypt('local-rls-016', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"name":"RLS 016 Hospedagens Owner"}'::jsonb,now(),now()),
  ('10000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','cliente_servicos+rls016@local.test',crypt('local-rls-016', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"name":"RLS 016 Cliente Servicos"}'::jsonb,now(),now()),
  ('10000000-0000-4000-8000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','cliente_hospedagens+rls016@local.test',crypt('local-rls-016', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"name":"RLS 016 Cliente Hospedagens"}'::jsonb,now(),now()),
  ('10000000-0000-4000-8000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','controle_cliente+rls016@local.test',crypt('local-rls-016', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"name":"RLS 016 Cliente Controle"}'::jsonb,now(),now())
on conflict (id) do update
set
  email = excluded.email,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into public.tenants (id, slug, name, status, plan_code)
values
  ('20000000-0000-4000-8000-000000000001','casa-mineira-saas','Casa Mineira SaaS','active','enterprise'),
  ('20000000-0000-4000-8000-000000000002','casa-mineira-servicos','Casa Mineira Servicos','active','enterprise'),
  ('20000000-0000-4000-8000-000000000003','hospedagens-caminhos-da-fe','Hospedagens Caminhos da Fe','active','enterprise')
on conflict (slug) do update
set
  name = excluded.name,
  status = excluded.status,
  plan_code = excluded.plan_code,
  updated_at = now();

insert into public.tenant_users (tenant_id, user_id, role, is_default, ativo)
values
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','owner',true,true),
  ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','owner',true,true),
  ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','owner',true,true),
  ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000004','cliente',true,true),
  ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000005','cliente',true,true),
  ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000006','cliente',true,true),
  ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000006','cliente',false,true)
on conflict (tenant_id, user_id) do update
set
  role = excluded.role,
  is_default = excluded.is_default,
  ativo = excluded.ativo,
  updated_at = now();

insert into public.profiles (id, tenant_id, name, full_name, nome, email, role, tipo)
values
  ('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','RLS 016 SaaS Owner','RLS 016 SaaS Owner','RLS 016 SaaS Owner','saas_owner+rls016@local.test','owner','owner'),
  ('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','RLS 016 Servicos Owner','RLS 016 Servicos Owner','RLS 016 Servicos Owner','casa_mineira_servicos_owner+rls016@local.test','owner','profissional'),
  ('10000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003','RLS 016 Hospedagens Owner','RLS 016 Hospedagens Owner','RLS 016 Hospedagens Owner','hospedagens_owner+rls016@local.test','owner','owner'),
  ('10000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','RLS 016 Cliente Servicos','RLS 016 Cliente Servicos','RLS 016 Cliente Servicos','cliente_servicos+rls016@local.test','cliente','cliente'),
  ('10000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000003','RLS 016 Cliente Hospedagens','RLS 016 Cliente Hospedagens','RLS 016 Cliente Hospedagens','cliente_hospedagens+rls016@local.test','cliente','cliente'),
  ('10000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000002','RLS 016 Cliente Controle','RLS 016 Cliente Controle','RLS 016 Cliente Controle','controle_cliente+rls016@local.test','cliente','cliente')
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  name = excluded.name,
  full_name = excluded.full_name,
  nome = excluded.nome,
  email = excluded.email,
  role = excluded.role,
  tipo = excluded.tipo,
  updated_at = now();

insert into public.saas_products (
  name,
  slug,
  product_type,
  status,
  app_slug,
  app_scheme,
  tenant_slug,
  requires_dedicated_supabase
)
values
  ('Casa Mineira Servicos','casa-mineira-servicos','services_marketplace','active','casa-mineira','casamineira','casa-mineira-servicos',true),
  ('Hospedagens Caminhos da Fe','hospedagens-caminhos-da-fe','hotel_booking','active','hospedagens-caminhos-da-fe','hospedagenscaminhosdafe','hospedagens-caminhos-da-fe',true)
on conflict (slug) do update
set
  name = excluded.name,
  product_type = excluded.product_type,
  status = excluded.status,
  app_slug = excluded.app_slug,
  app_scheme = excluded.app_scheme,
  tenant_slug = excluded.tenant_slug,
  requires_dedicated_supabase = excluded.requires_dedicated_supabase,
  updated_at = now();

insert into public.pedidos (
  id,
  tenant_id,
  cliente_id,
  profissional_id,
  categoria,
  servico,
  descricao,
  status,
  cidade,
  bairro,
  endereco
)
values
  ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002','manutencao','Reparo hidraulico','Pedido RLS 016 Casa Mineira Servicos - cliente principal','em_andamento','Belo Horizonte','Centro','Rua Local 16'),
  ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000002','limpeza','Limpeza residencial','Pedido RLS 016 Casa Mineira Servicos - controle de outro cliente','aberto','Belo Horizonte','Funcionarios','Rua Controle 16')
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  cliente_id = excluded.cliente_id,
  profissional_id = excluded.profissional_id,
  categoria = excluded.categoria,
  servico = excluded.servico,
  descricao = excluded.descricao,
  status = excluded.status,
  cidade = excluded.cidade,
  bairro = excluded.bairro,
  endereco = excluded.endereco,
  updated_at = now();

insert into public.pagamentos (
  id,
  tenant_id,
  pedido_id,
  profissional_id,
  valor_total,
  valor_comissao,
  valor_profissional,
  payment_id,
  external_reference,
  status_pagamento
)
values
  ('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002',250.00,25.00,225.00,'rls016-servicos-pagamento-1','rls016:servicos:pedido:1','aprovada'),
  ('40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002',180.00,18.00,162.00,'rls016-servicos-pagamento-2','rls016:servicos:pedido:2','pendente')
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  pedido_id = excluded.pedido_id,
  profissional_id = excluded.profissional_id,
  valor_total = excluded.valor_total,
  valor_comissao = excluded.valor_comissao,
  valor_profissional = excluded.valor_profissional,
  payment_id = excluded.payment_id,
  external_reference = excluded.external_reference,
  status_pagamento = excluded.status_pagamento,
  updated_at = now();

insert into public.caminho_hospedagem_reservas (
  id,
  tenant_id,
  cliente_id,
  hospedagem_slug,
  hospedagem_nome,
  cidade,
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
values
  ('50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000005','pousada-rls-016','Pousada RLS 016','Aparecida','suite-rls-016','Suite RLS 016','2026-08-10','2026-08-12',2,'Cliente Hospedagens RLS 016','11999990005','Reserva principal do teste RLS 016',600.00,180.00,60.00,120.00,420.00,'confirmada','aprovada','local','rls016-hospedagens-pagamento-1','processado'),
  ('50000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000006','pousada-rls-016','Pousada RLS 016','Aparecida','suite-controle-rls-016','Suite Controle RLS 016','2026-08-15','2026-08-16',1,'Cliente Controle RLS 016','11999990006','Reserva controle de outro cliente',320.00,96.00,32.00,64.00,224.00,'aguardando_pagamento','pendente','local','rls016-hospedagens-pagamento-2','pendente')
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  cliente_id = excluded.cliente_id,
  hospedagem_slug = excluded.hospedagem_slug,
  hospedagem_nome = excluded.hospedagem_nome,
  cidade = excluded.cidade,
  quarto_slug = excluded.quarto_slug,
  quarto_nome = excluded.quarto_nome,
  checkin = excluded.checkin,
  checkout = excluded.checkout,
  hospedes = excluded.hospedes,
  nome_cliente = excluded.nome_cliente,
  telefone_cliente = excluded.telefone_cliente,
  observacoes = excluded.observacoes,
  total = excluded.total,
  sinal = excluded.sinal,
  comissao = excluded.comissao,
  repasse_inicial = excluded.repasse_inicial,
  restante_na_pousada = excluded.restante_na_pousada,
  status = excluded.status,
  status_pagamento = excluded.status_pagamento,
  provider = excluded.provider,
  provider_payment_id = excluded.provider_payment_id,
  split_status = excluded.split_status,
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
  ('60000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000001','pousada-rls-016','repasse',120.00,'Movimento RLS 016 de repasse inicial da reserva principal')
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  reserva_id = excluded.reserva_id,
  hospedagem_slug = excluded.hospedagem_slug,
  tipo = excluded.tipo,
  valor = excluded.valor,
  descricao = excluded.descricao;

insert into public.business_dna (
  id,
  slug,
  name,
  category,
  segment,
  description,
  commercial_description,
  icon,
  primary_color,
  secondary_color,
  features,
  modules,
  integrations,
  premium_features,
  benefits,
  use_cases,
  recommended_plan,
  ai_preparation_contract,
  implementation_time,
  is_active
)
values
  ('dna-rls-016-publico','rls-016-publico','RLS 016 Public Business DNA','QA','B2B','Registro publico local para validar leitura anonima de Business DNA.','Registro publico local para matriz RLS 016.','shield-check','#0ea5e9','#111827','["publico"]'::jsonb,'["rls"]'::jsonb,'["supabase"]'::jsonb,'["auditoria"]'::jsonb,'["valida leitura publica"]'::jsonb,'["teste local"]'::jsonb,'Enterprise','{"scope":"rls-016"}'::jsonb,'1 dia',true),
  ('dna-rls-016-privado','rls-016-privado','RLS 016 Private Business DNA','QA','B2B','Registro inativo local para validar bloqueio publico.','Registro inativo local para matriz RLS 016.','lock','#64748b','#111827','["privado"]'::jsonb,'["rls"]'::jsonb,'["supabase"]'::jsonb,'["auditoria"]'::jsonb,'["valida bloqueio"]'::jsonb,'["teste local"]'::jsonb,'Enterprise','{"scope":"rls-016"}'::jsonb,'1 dia',false)
on conflict (id) do update
set
  slug = excluded.slug,
  name = excluded.name,
  category = excluded.category,
  segment = excluded.segment,
  description = excluded.description,
  commercial_description = excluded.commercial_description,
  icon = excluded.icon,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  features = excluded.features,
  modules = excluded.modules,
  integrations = excluded.integrations,
  premium_features = excluded.premium_features,
  benefits = excluded.benefits,
  use_cases = excluded.use_cases,
  recommended_plan = excluded.recommended_plan,
  ai_preparation_contract = excluded.ai_preparation_contract,
  implementation_time = excluded.implementation_time,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.premium_templates (
  id,
  slug,
  business_dna_id,
  name,
  segment,
  category,
  description,
  long_description,
  icon,
  primary_color,
  secondary_color,
  features,
  modules,
  integrations,
  technologies,
  recommended_template_slugs,
  related_template_slugs,
  ai_integration_contract,
  is_active
)
values
  ('tpl-rls-016-publico','rls-016-publico','dna-rls-016-publico','RLS 016 Public Premium Template','Aplicativo','QA','Template publico local para validar leitura anonima.','Template publico local para matriz RLS 016.','shield-check','#0ea5e9','#111827','["publico"]'::jsonb,'["rls"]'::jsonb,'["supabase"]'::jsonb,'["SQL"]'::jsonb,'[]'::jsonb,'[]'::jsonb,'{"scope":"rls-016"}'::jsonb,true),
  ('tpl-rls-016-privado','rls-016-privado','dna-rls-016-privado','RLS 016 Private Premium Template','Aplicativo','QA','Template inativo local para validar bloqueio publico.','Template inativo local para matriz RLS 016.','lock','#64748b','#111827','["privado"]'::jsonb,'["rls"]'::jsonb,'["supabase"]'::jsonb,'["SQL"]'::jsonb,'[]'::jsonb,'[]'::jsonb,'{"scope":"rls-016"}'::jsonb,false)
on conflict (id) do update
set
  slug = excluded.slug,
  business_dna_id = excluded.business_dna_id,
  name = excluded.name,
  segment = excluded.segment,
  category = excluded.category,
  description = excluded.description,
  long_description = excluded.long_description,
  icon = excluded.icon,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  features = excluded.features,
  modules = excluded.modules,
  integrations = excluded.integrations,
  technologies = excluded.technologies,
  recommended_template_slugs = excluded.recommended_template_slugs,
  related_template_slugs = excluded.related_template_slugs,
  ai_integration_contract = excluded.ai_integration_contract,
  is_active = excluded.is_active,
  updated_at = now();
