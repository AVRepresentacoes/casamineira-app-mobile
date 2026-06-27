-- Persistencia real para Business DNA e Marketplace Premium da Casa Mineira SaaS.
-- Leitura publica limitada a registros ativos. Escrita apenas por super admin ou service role.

create table if not exists public.business_dna (
  id text primary key,
  slug text not null unique,
  name text not null,
  category text not null,
  segment text not null default 'B2C',
  description text not null,
  commercial_description text not null default '',
  icon text not null default 'apps',
  primary_color text not null default '#facc15',
  secondary_color text not null default '#111827',
  image_url text,
  maturity_level text not null default 'starter',
  features jsonb not null default '[]'::jsonb,
  modules jsonb not null default '[]'::jsonb,
  integrations jsonb not null default '[]'::jsonb,
  premium_features jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  use_cases jsonb not null default '[]'::jsonb,
  recommended_plan text not null default 'Starter',
  ai_preparation_contract jsonb not null default '{}'::jsonb,
  implementation_time text not null default 'Sob analise',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.premium_templates (
  id text primary key,
  slug text not null unique,
  business_dna_id text references public.business_dna(id) on delete set null,
  name text not null,
  segment text not null default 'Aplicativo',
  category text not null,
  description text not null,
  long_description text not null default '',
  image_url text,
  icon text not null default 'apps',
  primary_color text not null default '#facc15',
  secondary_color text not null default '#111827',
  badge text not null default 'Premium',
  price_tier text not null default 'Premium',
  price_label text not null default 'Sob consulta',
  popularity_score integer not null default 0,
  is_best_seller boolean not null default false,
  is_new boolean not null default false,
  rating numeric(3, 2) not null default 4.8,
  downloads integer not null default 0,
  deployments integer not null default 0,
  gallery jsonb not null default '[]'::jsonb,
  modules_count integer not null default 0,
  compatibility jsonb not null default '[]'::jsonb,
  average_implementation_time text not null default 'Sob analise',
  features jsonb not null default '[]'::jsonb,
  modules jsonb not null default '[]'::jsonb,
  integrations jsonb not null default '[]'::jsonb,
  technologies jsonb not null default '[]'::jsonb,
  version text not null default '1.0.0',
  recommended_plan text not null default 'Premium',
  recommended_template_slugs jsonb not null default '[]'::jsonb,
  related_template_slugs jsonb not null default '[]'::jsonb,
  ai_integration_contract jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_dna_modules (
  id uuid primary key default gen_random_uuid(),
  business_dna_id text not null references public.business_dna(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_dna_id, name)
);

create table if not exists public.template_modules (
  id uuid primary key default gen_random_uuid(),
  template_id text not null references public.premium_templates(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (template_id, name)
);

create table if not exists public.template_integrations (
  id uuid primary key default gen_random_uuid(),
  template_id text not null references public.premium_templates(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (template_id, name)
);

create index if not exists business_dna_active_category_idx
  on public.business_dna (is_active, category, slug);

create index if not exists premium_templates_active_category_idx
  on public.premium_templates (is_active, category, slug);

create index if not exists premium_templates_business_dna_idx
  on public.premium_templates (business_dna_id, is_active);

create or replace function public.set_business_catalog_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_business_dna_updated_at on public.business_dna;
create trigger trg_business_dna_updated_at
before update on public.business_dna
for each row execute function public.set_business_catalog_updated_at();

drop trigger if exists trg_premium_templates_updated_at on public.premium_templates;
create trigger trg_premium_templates_updated_at
before update on public.premium_templates
for each row execute function public.set_business_catalog_updated_at();

alter table public.business_dna enable row level security;
alter table public.premium_templates enable row level security;
alter table public.business_dna_modules enable row level security;
alter table public.template_modules enable row level security;
alter table public.template_integrations enable row level security;

grant select on public.business_dna to anon, authenticated;
grant select on public.premium_templates to anon, authenticated;
grant select on public.business_dna_modules to anon, authenticated;
grant select on public.template_modules to anon, authenticated;
grant select on public.template_integrations to anon, authenticated;
grant insert, update, delete on public.business_dna to authenticated;
grant insert, update, delete on public.premium_templates to authenticated;
grant insert, update, delete on public.business_dna_modules to authenticated;
grant insert, update, delete on public.template_modules to authenticated;
grant insert, update, delete on public.template_integrations to authenticated;

drop policy if exists business_dna_select_active_public on public.business_dna;
create policy business_dna_select_active_public
on public.business_dna
for select
using (is_active = true);

drop policy if exists premium_templates_select_active_public on public.premium_templates;
create policy premium_templates_select_active_public
on public.premium_templates
for select
using (is_active = true);

drop policy if exists business_dna_modules_select_active_public on public.business_dna_modules;
create policy business_dna_modules_select_active_public
on public.business_dna_modules
for select
using (
  is_active = true
  and exists (
    select 1 from public.business_dna bd
    where bd.id = business_dna_modules.business_dna_id
      and bd.is_active = true
  )
);

drop policy if exists template_modules_select_active_public on public.template_modules;
create policy template_modules_select_active_public
on public.template_modules
for select
using (
  is_active = true
  and exists (
    select 1 from public.premium_templates pt
    where pt.id = template_modules.template_id
      and pt.is_active = true
  )
);

drop policy if exists template_integrations_select_active_public on public.template_integrations;
create policy template_integrations_select_active_public
on public.template_integrations
for select
using (
  is_active = true
  and exists (
    select 1 from public.premium_templates pt
    where pt.id = template_integrations.template_id
      and pt.is_active = true
  )
);

drop policy if exists business_dna_admin_write on public.business_dna;
create policy business_dna_admin_write
on public.business_dna
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists premium_templates_admin_write on public.premium_templates;
create policy premium_templates_admin_write
on public.premium_templates
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists business_dna_modules_admin_write on public.business_dna_modules;
create policy business_dna_modules_admin_write
on public.business_dna_modules
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists template_modules_admin_write on public.template_modules;
create policy template_modules_admin_write
on public.template_modules
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists template_integrations_admin_write on public.template_integrations;
create policy template_integrations_admin_write
on public.template_integrations
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

insert into public.business_dna (
  id, slug, name, category, segment, description, commercial_description, icon,
  primary_color, secondary_color, image_url, maturity_level, features, modules,
  integrations, premium_features, benefits, use_cases, recommended_plan,
  ai_preparation_contract, implementation_time, is_active
)
values
  ('dna-hotel','hotel','Hotel','Hospitalidade','B2C','Reservas, quartos, pagamentos e painel de ocupação.','Um Business DNA para hotéis, pousadas e hospedagens que precisam vender reservas, controlar disponibilidade e profissionalizar a experiência do hóspede.','bed-outline','#38bdf8','#0f172a','placeholder://business-dna/hotel','premium','["Reservas online","Gestão de quartos","Calendário de ocupação","Checkout","Painel da hospedagem"]','["Motor de reservas","Tarifas por temporada","Avaliações","Cupons","Relatórios de ocupação"]','["Supabase","E-mail","WhatsApp","Analytics","Pagamentos","Google Maps"]','["White Label","Publishing Center","Growth Center","Automações avançadas","Gestão multiunidade"]','["Reduz atendimento manual","Organiza disponibilidade","Aumenta reservas diretas"]','["Pousadas locais","Hotéis boutique","Guias de hospedagem"]','Premium','{"briefingHints":["tipo de hospedagem","quantidade de quartos"],"requiredInputs":["nome da marca","cidades atendidas"],"suggestedOutputs":["mapa de reservas","copy comercial"]}','7 a 14 dias',true),
  ('dna-restaurante','restaurante','Restaurante','Comércio','Operação Local','Cardápio, pedidos, delivery e fidelização.','Estrutura digital para restaurantes que querem vender mais, organizar pedidos e criar relacionamento direto com clientes.','silverware-fork-knife','#fb7185','#1f2937','placeholder://business-dna/restaurante','validated','["Cardápio digital","Pedidos","Retirada/delivery","Cupons","Painel de operação"]','["Programa de fidelidade","Mesas e reservas","Combos","Campanhas sazonais"]','["Supabase","E-mail","WhatsApp","Analytics","Pagamentos","Impressão de pedidos"]','["White Label","Publishing Center","Growth Center","Cardápio multiunidade"]','["Melhora conversão","Centraliza pedidos","Fortalece canal próprio"]','["Restaurantes","Lanchonetes","Cafeterias"]','Growth','{"briefingHints":["tipo de culinária","região de entrega"],"requiredInputs":["cardápio","horários"],"suggestedOutputs":["landing de venda","campanhas"]}','5 a 10 dias',true),
  ('dna-clinica','clinica','Clínica','Saúde','B2C','Agendas, pacientes, atendimento e recorrência.','Modelo para clínicas que precisam captar pacientes, organizar agendamentos, melhorar comunicação e criar presença digital profissional.','medical-bag','#2dd4bf','#0f172a','placeholder://business-dna/clinica','premium','["Agendamento","Cadastro de pacientes","Serviços","Notificações","Painel administrativo"]','["Pré-atendimento","Convênios","Retorno automático","Agenda por profissional"]','["Supabase","E-mail","WhatsApp","Analytics","Pagamentos","Calendário"]','["White Label","Publishing Center","Growth Center","Triagem inteligente"]','["Reduz faltas","Organiza agenda","Aumenta captação"]','["Clínicas médicas","Odontologia","Estética"]','Premium','{"briefingHints":["especialidades","quantidade de profissionais"],"requiredInputs":["serviços","horários"],"suggestedOutputs":["jornada do paciente","landing page"]}','7 a 12 dias',true),
  ('dna-academia','academia','Academia','Serviços','Assinatura','Planos, alunos, check-ins e evolução.','DNA para academias, boxes e studios que precisam vender planos, acompanhar alunos e criar uma comunidade digital.','weight-lifter','#a3e635','#111827','placeholder://business-dna/academia','validated','["Planos","Alunos","Check-in","Agenda de aulas","Painel do gestor"]','["Treinos","Avaliações","Desafios","Comunidade","Renovação automática"]','["Supabase","E-mail","WhatsApp","Analytics","Pagamentos","Catraca/Check-in"]','["White Label","Publishing Center","Growth Center","Desafios gamificados"]','["Aumenta retenção","Facilita renovação","Engaja alunos"]','["Academias","Studios","Cross training"]','Growth','{"briefingHints":["modalidades","planos"],"requiredInputs":["grade de aulas","valores"],"suggestedOutputs":["campanhas de matrícula","fluxos de retenção"]}','6 a 12 dias',true),
  ('dna-barbearia','barbearia','Barbearia','Serviços','Operação Local','Agenda, profissionais, pacotes e fidelização.','Estrutura rápida para barbearias que querem profissionalizar agenda, divulgar serviços e vender pacotes recorrentes.','content-cut','#f59e0b','#111827','placeholder://business-dna/barbearia','validated','["Agendamento","Serviços","Profissionais","Galeria","Fidelidade"]','["Pacotes","Assinatura mensal","Cupons","Lembretes"]','["Supabase","E-mail","WhatsApp","Analytics","Pagamentos","Calendário"]','["White Label","Publishing Center","Growth Center","Clube de assinatura"]','["Organiza horários","Reduz no-show","Vende recorrência"]','["Barbearias","Salões masculinos","Estúdios de beleza"]','Starter','{"briefingHints":["serviços","profissionais"],"requiredInputs":["tabela de preços","agenda"],"suggestedOutputs":["copy local","fluxo de agendamento"]}','3 a 7 dias',true),
  ('dna-imobiliaria','imobiliaria','Imobiliária','Serviços','B2B','Imóveis, leads, visitas e propostas.','DNA para imobiliárias que precisam captar leads, organizar imóveis, agendar visitas e dar mais velocidade comercial.','home-city-outline','#60a5fa','#0f172a','placeholder://business-dna/imobiliaria','premium','["Catálogo de imóveis","Leads","Filtros","Agendamento de visitas","Painel comercial"]','["CRM","Simulação","Captação de proprietários","Tour virtual"]','["Supabase","E-mail","WhatsApp","Analytics","Pagamentos","Maps","CRM"]','["White Label","Publishing Center","Growth Center","Esteira comercial"]','["Aumenta leads","Organiza carteira","Acelera atendimento"]','["Imobiliárias","Corretores","Lançamentos"]','Premium','{"briefingHints":["tipo de imóvel","região"],"requiredInputs":["carteira","regras de contato"],"suggestedOutputs":["landing de captação","funil de leads"]}','10 a 18 dias',true),
  ('dna-delivery','delivery','Delivery','Comércio','Operação Local','Catálogo, checkout, status e entregas.','Modelo de delivery próprio para empresas que querem vender sem depender apenas de marketplaces externos.','moped-outline','#f97316','#111827','placeholder://business-dna/delivery','validated','["Catálogo","Carrinho","Checkout","Status do pedido","Áreas de entrega"]','["Roteirização","Cupons","Taxas dinâmicas","Programa de fidelidade"]','["Supabase","E-mail","WhatsApp","Analytics","Pagamentos","Maps"]','["White Label","Publishing Center","Growth Center","Entrega multiunidade"]','["Cria canal próprio","Reduz dependência","Melhora recompra"]','["Restaurantes","Mercadinhos","Farmácias"]','Growth','{"briefingHints":["produtos","raio de entrega"],"requiredInputs":["catálogo","formas de pagamento"],"suggestedOutputs":["fluxo de checkout","campanhas"]}','5 a 10 dias',true),
  ('dna-loja-virtual','loja-virtual','Loja Virtual','Comércio','B2C','Produtos, carrinho, pedidos e campanhas.','Base para lojas que precisam vender produtos online com catálogo, checkout e crescimento digital.','shopping-outline','#c084fc','#111827','placeholder://business-dna/loja-virtual','validated','["Produtos","Variações","Carrinho","Pedidos","Promoções"]','["Cupons","Estoque","Frete","Reviews","Upsell"]','["Supabase","E-mail","WhatsApp","Analytics","Pagamentos","Frete"]','["White Label","Publishing Center","Growth Center","Campanhas automatizadas"]','["Vende 24/7","Organiza catálogo","Aumenta ticket médio"]','["Lojas locais","Marcas autorais","Catálogos B2C"]','Growth','{"briefingHints":["categoria de produtos","ticket médio"],"requiredInputs":["produtos","preços"],"suggestedOutputs":["páginas de venda","campanhas"]}','7 a 14 dias',true),
  ('dna-marketplace','marketplace','Marketplace','Comércio','Marketplace','Vendedores, catálogo, pedidos e repasses.','DNA para negócios que conectam compradores e vendedores em uma plataforma digital com operação multi-fornecedor.','storefront-outline','#22d3ee','#0f172a','placeholder://business-dna/marketplace','enterprise','["Vendedores","Catálogo","Pedidos","Comissões","Painel de fornecedores"]','["Split","Moderação","Logística","Ranking","Onboarding de vendedores"]','["Supabase","E-mail","WhatsApp","Analytics","Pagamentos","Split de pagamento","Logística"]','["White Label","Publishing Center","Growth Center","Governança multi-fornecedor"]','["Cria ecossistema","Escala oferta","Monetiza com comissão"]','["Marketplaces locais","Verticais de nicho","Redes de fornecedores"]','Enterprise','{"briefingHints":["tipo de vendedor","regra de comissão"],"requiredInputs":["modelo de repasse","políticas"],"suggestedOutputs":["arquitetura de marketplace","regras comerciais"]}','15 a 30 dias',true),
  ('dna-servicos-locais','servicos-locais','Serviços Locais','Serviços','Marketplace','Pedidos, profissionais, propostas e agenda.','DNA para conectar clientes a prestadores de serviços com pedidos, propostas e acompanhamento operacional.','account-hard-hat-outline','#facc15','#111827','placeholder://business-dna/servicos-locais','premium','["Pedidos","Profissionais","Propostas","Categorias","Chat operacional"]','["Geolocalização","Urgência","Comissões","Avaliações","Assinatura profissional"]','["Supabase","E-mail","WhatsApp","Analytics","Pagamentos","Maps","Notificações"]','["White Label","Publishing Center","Growth Center","Distribuição inteligente de pedidos"]','["Conecta demanda e oferta","Monetiza profissionais","Organiza operação local"]','["Serviços residenciais","Manutenção","Redes locais"]','Premium','{"briefingHints":["categorias","raio de atendimento"],"requiredInputs":["regras de pedido","papéis"],"suggestedOutputs":["jornada cliente/profissional","campanhas"]}','10 a 20 dias',true),
  ('dna-escola','escola','Escola','Educação','Assinatura','Cursos, alunos, aulas e assinaturas.','Base para escolas, cursos e infoprodutores criarem ambiente digital de aprendizado e gestão.','school-outline','#818cf8','#111827','placeholder://business-dna/escola','validated','["Cursos","Aulas","Alunos","Progresso","Área do aluno"]','["Certificados","Comunidade","Assinaturas","Quiz","Conteúdo liberado por etapa"]','["Supabase","E-mail","WhatsApp","Analytics","Pagamentos","Vídeo"]','["White Label","Publishing Center","Growth Center","Trilhas de aprendizado"]','["Organiza ensino","Gera recorrência","Escala conteúdo"]','["Cursos online","Escolas livres","Treinamentos internos"]','Growth','{"briefingHints":["tipo de curso","formato de aula"],"requiredInputs":["conteúdos","módulos"],"suggestedOutputs":["trilha de curso","landing"]}','8 a 16 dias',true),
  ('dna-financeira','financeira','Financeira','Finanças','B2B','Clientes, simulações, propostas e gestão.','Modelo para operações financeiras que precisam captar clientes, organizar propostas e acompanhar funil comercial.','finance','#4ade80','#0f172a','placeholder://business-dna/financeira','premium','["Simulações","Leads","Propostas","Pipeline","Painel gerencial"]','["Score interno","Documentos","Pré-aprovação","Esteira de atendimento"]','["Supabase","E-mail","WhatsApp","Analytics","Pagamentos","CRM","Documentos"]','["White Label","Publishing Center","Growth Center","Funil financeiro avançado"]','["Aumenta conversão","Padroniza propostas","Melhora governança"]','["Correspondentes","Fintechs locais","Consultorias financeiras"]','Premium','{"briefingHints":["produto financeiro","regras comerciais"],"requiredInputs":["campos de simulação","documentos"],"suggestedOutputs":["funil de proposta","checklist LGPD"]}','12 a 24 dias',true),
  ('dna-igreja','igreja','Igreja','Comunidade','B2C','Comunidade, eventos, doações e comunicação.','DNA para igrejas e comunidades centralizarem comunicação, eventos, contribuições e relacionamento com membros.','church','#fbbf24','#1f2937','placeholder://business-dna/igreja','starter','["Eventos","Avisos","Doações","Grupos","Conteúdo"]','["Escalas","Pedidos de oração","Cursos","Transmissões"]','["Supabase","E-mail","WhatsApp","Analytics","Pagamentos","Vídeo"]','["White Label","Publishing Center","Growth Center","Gestão de comunidade"]','["Centraliza comunicação","Engaja membros","Facilita contribuições"]','["Igrejas","Comunidades","Projetos sociais"]','Starter','{"briefingHints":["tamanho da comunidade","agenda"],"requiredInputs":["eventos","conteúdos"],"suggestedOutputs":["calendário editorial","landing institucional"]}','5 a 12 dias',true),
  ('dna-construcao-civil','construcao-civil','Construção Civil','Construção','B2B','Obras, equipes, orçamentos e acompanhamento.','Modelo para construtoras, prestadores e equipes acompanharem obras, orçamentos, clientes e etapas.','hammer-wrench','#fb923c','#111827','placeholder://business-dna/construcao-civil','validated','["Obras","Orçamentos","Etapas","Equipe","Painel de acompanhamento"]','["Materiais","Diário de obra","Financeiro","Fotos por etapa","Relatórios"]','["Supabase","E-mail","WhatsApp","Analytics","Pagamentos","Arquivos"]','["White Label","Publishing Center","Growth Center","Relatórios executivos de obra"]','["Organiza execução","Aumenta transparência","Reduz retrabalho"]','["Construtoras","Reformas","Empreiteiras"]','Premium','{"briefingHints":["tipo de obra","etapas"],"requiredInputs":["processo de orçamento","documentos"],"suggestedOutputs":["fluxo de obra","painel de status"]}','10 a 20 dias',true),
  ('dna-turismo','turismo','Turismo','Turismo','B2C','Roteiros, reservas, experiências e parceiros.','DNA para agências, guias e experiências turísticas venderem roteiros, reservas e pacotes digitais.','map-marker-path','#2dd4bf','#0f172a','placeholder://business-dna/turismo','validated','["Roteiros","Experiências","Reservas","Parceiros","Checkout"]','["Guias locais","Agenda","Combos","Avaliações","Mapa interativo"]','["Supabase","E-mail","WhatsApp","Analytics","Pagamentos","Maps"]','["White Label","Publishing Center","Growth Center","Marketplace de experiências"]','["Vende experiências","Organiza parceiros","Cria canal direto"]','["Agências","Guias","Rotas turísticas"]','Growth','{"briefingHints":["destino","tipo de experiência"],"requiredInputs":["roteiros","preços"],"suggestedOutputs":["landing turística","catálogo de experiências"]}','8 a 16 dias',true)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  segment = excluded.segment,
  description = excluded.description,
  commercial_description = excluded.commercial_description,
  icon = excluded.icon,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  image_url = excluded.image_url,
  maturity_level = excluded.maturity_level,
  features = excluded.features,
  modules = excluded.modules,
  integrations = excluded.integrations,
  premium_features = excluded.premium_features,
  benefits = excluded.benefits,
  use_cases = excluded.use_cases,
  recommended_plan = excluded.recommended_plan,
  ai_preparation_contract = excluded.ai_preparation_contract,
  implementation_time = excluded.implementation_time,
  is_active = excluded.is_active;

insert into public.premium_templates (
  id, slug, business_dna_id, name, segment, category, description, long_description,
  image_url, icon, primary_color, secondary_color, badge, price_tier, price_label,
  popularity_score, is_best_seller, is_new, rating, downloads, deployments, gallery,
  modules_count, compatibility, average_implementation_time, features, modules,
  integrations, technologies, version, recommended_plan, recommended_template_slugs,
  related_template_slugs, ai_integration_contract, is_active
)
values
  ('tpl-hotel-premium','hotel-premium','dna-hotel','Hotel Premium','Aplicativo','Hospitalidade','Reservas, quartos, tarifas e painel premium para hospedagens.','Template completo para hotéis e pousadas venderem reservas diretas, organizarem disponibilidade e criarem uma operação digital com experiência premium.','placeholder://templates/hotel-premium','bed-outline','#38bdf8','#0f172a','Premium','Premium','A partir de R$ 4.900',94,true,false,4.9,128,42,'["Reservas","Quartos","Calendário","Painel"]',9,'["Android","iOS","Web","White Label"]','7 a 14 dias','["Motor de reservas","Gestão de quartos","Calendário de ocupação","Checkout","Avaliações"]','["Reservas","Tarifas","Quartos","Pagamentos","Painel de ocupação"]','["Supabase","WhatsApp","E-mail","Analytics","Google Maps","Pagamentos"]','["Expo","React Native/Web","TypeScript","Supabase","Edge Functions-ready"]','1.0.0','Premium','["turismo","marketplace-completo"]','["turismo","restaurante-delivery"]','{"recommendedPromptContext":["tipo de hospedagem"],"personalizationInputs":["marca","cidade"],"generationBoundaries":["não publicar sem revisão humana"]}',true),
  ('tpl-clinica-premium','clinica-premium','dna-clinica','Clínica Premium','Sistema Web','Saúde','Agenda, pacientes, serviços e presença digital profissional.','Template premium para clínicas organizarem captação, agendamentos, retornos e relacionamento com pacientes.','placeholder://templates/clinica-premium','medical-bag','#2dd4bf','#0f172a','Premium','Premium','A partir de R$ 4.500',91,true,false,4.8,104,37,'["Agenda","Pacientes","Serviços","Landing"]',8,'["Android","iOS","Web","White Label"]','7 a 12 dias','["Agendamento","Cadastro de pacientes","Notificações","Pré-atendimento","Painel administrativo"]','["Agenda","Profissionais","Pacientes","Serviços","Landing page","Mensagens"]','["Supabase","WhatsApp","E-mail","Analytics","Calendário"]','["Expo","React Native/Web","TypeScript","Supabase","Edge Functions-ready"]','1.0.0','Premium','["financeira","escola"]','["academia","barbearia"]','{"recommendedPromptContext":["especialidades"],"personalizationInputs":["marca","serviços"],"generationBoundaries":["não gerar diagnóstico médico"]}',true),
  ('tpl-restaurante-delivery','restaurante-delivery','dna-restaurante','Restaurante Delivery','Aplicativo','Alimentação','Cardápio, pedidos, retirada, delivery e campanhas locais.','Template para restaurantes criarem canal próprio de pedidos com cardápio digital, checkout e ações de recompra.','placeholder://templates/restaurante-delivery','silverware-fork-knife','#fb7185','#1f2937','Popular','Premium','A partir de R$ 3.900',96,true,false,4.9,186,61,'["Cardápio","Pedidos","Checkout","Promoções"]',7,'["Android","iOS","Web","White Label"]','5 a 10 dias','["Cardápio digital","Carrinho","Checkout","Cupons","Status de pedido"]','["Produtos","Combos","Delivery","Retirada","Cupons","Painel operacional"]','["Supabase","WhatsApp","E-mail","Analytics","Pagamentos","Impressão de pedidos"]','["Expo","React Native/Web","TypeScript","Supabase","Edge Functions-ready"]','1.1.0','Growth','["loja-virtual","delivery"]','["hotel-premium","marketplace-completo"]','{"recommendedPromptContext":["tipo de culinária"],"personalizationInputs":["cardápio","horários"],"generationBoundaries":["não executar pedido real"]}',true),
  ('tpl-marketplace-completo','marketplace-completo','dna-marketplace','Marketplace Completo','Marketplace','Comércio','Vendedores, catálogo, comissões, pedidos e operação multi-fornecedor.','Template robusto para lançar marketplaces de nicho com onboarding de vendedores, catálogo, pedidos, comissões e governança.','placeholder://templates/marketplace-completo','storefront-outline','#22d3ee','#0f172a','Enterprise','Enterprise','Sob consulta',89,false,false,4.8,76,18,'["Vendedores","Catálogo","Pedidos","Comissões"]',12,'["Android","iOS","Web","White Label"]','15 a 30 dias','["Onboarding de vendedores","Catálogo multi-fornecedor","Comissões","Moderação","Painel de fornecedores"]','["Vendedores","Produtos","Pedidos","Comissões","Moderação","Relatórios","Governança"]','["Supabase","WhatsApp","E-mail","Analytics","Split de pagamento","Logística"]','["Expo","React Native/Web","TypeScript","Supabase","Edge Functions-ready"]','1.0.0','Enterprise','["marketplace-multiempresa","servicos-locais"]','["loja-virtual","delivery"]','{"recommendedPromptContext":["nicho","tipo de vendedor"],"personalizationInputs":["categorias","regras"],"generationBoundaries":["não configurar split real sem revisão"]}',true),
  ('tpl-imobiliaria','imobiliaria','dna-imobiliaria','Imobiliária','Sistema Web','Serviços','Imóveis, leads, filtros, visitas e painel comercial.','Template para imobiliárias e corretores captarem leads, exibirem imóveis e organizarem atendimento comercial.','placeholder://templates/imobiliaria','home-city-outline','#60a5fa','#0f172a','Premium','Premium','A partir de R$ 4.700',84,false,false,4.7,71,22,'["Imóveis","Leads","Filtros","Visitas"]',8,'["Web","White Label","Android","iOS"]','10 a 18 dias','["Catálogo de imóveis","Filtros avançados","Captação de leads","Agendamento de visitas"]','["Imóveis","Leads","CRM","Visitas","Landing pages","Relatórios"]','["Supabase","WhatsApp","E-mail","Analytics","Google Maps","CRM"]','["Expo","React Native/Web","TypeScript","Supabase","Edge Functions-ready"]','1.0.0','Premium','["financeira","construcao-civil"]','["marketplace-completo","loja-virtual"]','{"recommendedPromptContext":["região","tipo de imóvel"],"personalizationInputs":["carteira","fotos"],"generationBoundaries":["não prometer financiamento"]}',true),
  ('tpl-academia','academia','dna-academia','Academia','Aplicativo','Serviços','Planos, alunos, aulas, check-ins e comunidade.','Template para academias e studios gerenciarem alunos, venderem planos e criarem uma experiência digital recorrente.','placeholder://templates/academia','weight-lifter','#a3e635','#111827','Popular','Premium','A partir de R$ 3.900',86,false,false,4.7,93,27,'["Planos","Alunos","Aulas","Check-in"]',7,'["Android","iOS","Web","White Label"]','6 a 12 dias','["Planos","Agenda de aulas","Check-in","Comunidade","Renovação"]','["Alunos","Planos","Aulas","Check-in","Desafios","Notificações"]','["Supabase","WhatsApp","E-mail","Analytics","Check-in"]','["Expo","React Native/Web","TypeScript","Supabase","Edge Functions-ready"]','1.0.0','Growth','["clinica-premium","barbearia"]','["escola","servicos-locais"]','{"recommendedPromptContext":["modalidades","planos"],"personalizationInputs":["grade","valores"],"generationBoundaries":["não criar cobrança real"]}',true),
  ('tpl-barbearia','barbearia','dna-barbearia','Barbearia','Aplicativo','Serviços','Agenda, profissionais, serviços, pacotes e fidelização.','Template enxuto e premium para barbearias profissionalizarem agenda, vendas recorrentes e presença local.','placeholder://templates/barbearia','content-cut','#f59e0b','#111827','Popular','Starter','A partir de R$ 2.900',88,true,false,4.8,147,53,'["Agenda","Serviços","Profissionais","Fidelidade"]',6,'["Android","iOS","Web","White Label"]','3 a 7 dias','["Agendamento","Serviços","Profissionais","Pacotes","Lembretes"]','["Agenda","Serviços","Profissionais","Fidelidade","Galeria"]','["Supabase","WhatsApp","E-mail","Analytics","Calendário"]','["Expo","React Native/Web","TypeScript","Supabase","Edge Functions-ready"]','1.0.0','Starter','["academia","servicos-locais"]','["clinica-premium","restaurante-delivery"]','{"recommendedPromptContext":["serviços","profissionais"],"personalizationInputs":["preços","agenda"],"generationBoundaries":["não confirmar agenda real"]}',true),
  ('tpl-servicos-locais','servicos-locais','dna-servicos-locais','Serviços Locais','Marketplace','Serviços','Pedidos, profissionais, propostas e operação local.','Template para conectar clientes e profissionais com pedidos, propostas, categorias e painel operacional.','placeholder://templates/servicos-locais','account-hard-hat-outline','#facc15','#111827','Premium','Premium','A partir de R$ 5.900',90,false,false,4.8,119,34,'["Pedidos","Profissionais","Propostas","Categorias"]',10,'["Android","iOS","Web","White Label"]','10 a 20 dias','["Pedidos","Categorias","Profissionais","Propostas","Chat operacional"]','["Clientes","Profissionais","Pedidos","Propostas","Avaliações","Comissões"]','["Supabase","WhatsApp","E-mail","Analytics","Maps","Notificações"]','["Expo","React Native/Web","TypeScript","Supabase","Edge Functions-ready"]','1.0.0','Premium','["marketplace-completo","barbearia"]','["delivery","academia"]','{"recommendedPromptContext":["categorias","raio"],"personalizationInputs":["serviços","regras"],"generationBoundaries":["não mexer em pagamento"]}',true),
  ('tpl-loja-virtual','loja-virtual','dna-loja-virtual','Loja Virtual','Site','Comércio','Produtos, carrinho, checkout, campanhas e catálogo.','Template para lojas venderem produtos online com catálogo profissional, checkout preparado e módulos de crescimento.','placeholder://templates/loja-virtual','shopping-outline','#c084fc','#111827','Premium','Premium','A partir de R$ 4.200',87,false,false,4.7,112,31,'["Produtos","Carrinho","Checkout","Campanhas"]',8,'["Android","iOS","Web","White Label"]','7 a 14 dias','["Produtos","Variações","Carrinho","Pedidos","Promoções"]','["Catálogo","Carrinho","Pedidos","Cupons","Estoque","Landing"]','["Supabase","WhatsApp","E-mail","Analytics","Frete","Pagamentos"]','["Expo","React Native/Web","TypeScript","Supabase","Edge Functions-ready"]','1.0.0','Growth','["restaurante-delivery","marketplace-completo"]','["delivery","financeira"]','{"recommendedPromptContext":["categoria","ticket médio"],"personalizationInputs":["produtos","preços"],"generationBoundaries":["não publicar produtos sem revisão"]}',true),
  ('tpl-financeira','financeira','dna-financeira','Financeira','Sistema Web','Finanças','Leads, simulações, propostas e pipeline comercial.','Template para operações financeiras captarem clientes, simularem propostas e organizarem atendimento comercial com governança.','placeholder://templates/financeira','finance','#4ade80','#0f172a','Enterprise','Enterprise','Sob consulta',80,false,true,4.6,44,11,'["Simulações","Leads","Propostas","Pipeline"]',9,'["Web","White Label","Android","iOS"]','12 a 24 dias','["Simulações","Leads","Propostas","Pipeline","Documentos"]','["CRM","Simulação","Documentos","Propostas","Relatórios"]','["Supabase","WhatsApp","E-mail","Analytics","CRM","Documentos"]','["Expo","React Native/Web","TypeScript","Supabase","Edge Functions-ready"]','0.9.0','Enterprise','["imobiliaria","clinica-premium"]','["construcao-civil","loja-virtual"]','{"recommendedPromptContext":["produto financeiro","regras"],"personalizationInputs":["campos","documentos"],"generationBoundaries":["não tomar decisão de crédito"]}',true),
  ('tpl-construcao-civil','construcao-civil','dna-construcao-civil','Construção Civil','Sistema Web','Construção','Obras, orçamentos, etapas, equipe e acompanhamento.','Template para construtoras e equipes acompanharem obras, orçamentos, materiais e relatórios executivos.','placeholder://templates/construcao-civil','hammer-wrench','#fb923c','#111827','Novo','Premium','A partir de R$ 5.200',73,false,true,4.6,38,9,'["Obras","Etapas","Orçamentos","Relatórios"]',8,'["Web","Android","iOS","White Label"]','10 a 20 dias','["Obras","Orçamentos","Etapas","Equipe","Relatórios"]','["Obras","Materiais","Diário","Fotos","Equipe","Financeiro"]','["Supabase","WhatsApp","E-mail","Analytics","Arquivos"]','["Expo","React Native/Web","TypeScript","Supabase","Edge Functions-ready"]','0.9.0','Premium','["imobiliaria","financeira"]','["servicos-locais","marketplace-completo"]','{"recommendedPromptContext":["tipo de obra","etapas"],"personalizationInputs":["checklists","documentos"],"generationBoundaries":["não gerar contrato legal final"]}',true),
  ('tpl-turismo','turismo','dna-turismo','Turismo','Aplicativo','Turismo','Roteiros, experiências, reservas e parceiros.','Template para agências, guias e destinos venderem experiências, pacotes e roteiros com canal digital próprio.','placeholder://templates/turismo','map-marker-path','#2dd4bf','#0f172a','Novo','Premium','A partir de R$ 4.600',77,false,true,4.7,52,13,'["Roteiros","Experiências","Reservas","Mapa"]',8,'["Android","iOS","Web","White Label"]','8 a 16 dias','["Roteiros","Experiências","Reservas","Parceiros","Mapa"]','["Roteiros","Agenda","Checkout","Parceiros","Avaliações"]','["Supabase","WhatsApp","E-mail","Analytics","Google Maps"]','["Expo","React Native/Web","TypeScript","Supabase","Edge Functions-ready"]','0.9.0','Growth','["hotel-premium","marketplace-completo"]','["restaurante-delivery","loja-virtual"]','{"recommendedPromptContext":["destino","experiências"],"personalizationInputs":["roteiros","preços"],"generationBoundaries":["não publicar reserva real"]}',true),
  ('tpl-escola','escola','dna-escola','Escola','Sistema Web','Educação','Cursos, alunos, aulas, progresso e assinatura.','Template para escolas, cursos e treinamentos criarem ambiente digital de aprendizado com área do aluno e recorrência.','placeholder://templates/escola','school-outline','#818cf8','#111827','Premium','Premium','A partir de R$ 4.400',82,false,false,4.7,67,19,'["Cursos","Aulas","Alunos","Progresso"]',8,'["Web","Android","iOS","White Label"]','8 a 16 dias','["Cursos","Aulas","Alunos","Progresso","Área do aluno"]','["Cursos","Aulas","Certificados","Comunidade","Assinaturas"]','["Supabase","WhatsApp","E-mail","Analytics","Vídeo"]','["Expo","React Native/Web","TypeScript","Supabase","Edge Functions-ready"]','1.0.0','Growth','["clinica-premium","igreja"]','["academia","loja-virtual"]','{"recommendedPromptContext":["tipo de curso","módulos"],"personalizationInputs":["conteúdo","aulas"],"generationBoundaries":["não publicar conteúdo sem revisão"]}',true),
  ('tpl-igreja','igreja','dna-igreja','Igreja','Aplicativo','Comunidade','Comunidade, eventos, doações, grupos e comunicação.','Template para comunidades e igrejas organizarem comunicação, eventos, doações e relacionamento com membros.','placeholder://templates/igreja','church','#fbbf24','#1f2937','Novo','Starter','A partir de R$ 2.900',69,false,true,4.6,35,8,'["Eventos","Avisos","Doações","Grupos"]',6,'["Android","iOS","Web","White Label"]','5 a 12 dias','["Eventos","Avisos","Doações","Grupos","Conteúdo"]','["Comunidade","Eventos","Doações","Avisos","Conteúdo"]','["Supabase","WhatsApp","E-mail","Analytics","Vídeo"]','["Expo","React Native/Web","TypeScript","Supabase","Edge Functions-ready"]','0.9.0','Starter','["escola","servicos-locais"]','["turismo","academia"]','{"recommendedPromptContext":["tamanho da comunidade","eventos"],"personalizationInputs":["agenda","conteúdos"],"generationBoundaries":["não ativar doações reais"]}',true),
  ('tpl-marketplace-multiempresa','marketplace-multiempresa','dna-marketplace','Marketplace Multiempresa','Empresa Digital','Comércio','Marketplace enterprise com múltiplas empresas, planos e governança.','Template enterprise para redes e operações multiempresa criarem ecossistemas digitais com controle, planos, fornecedores e governança.','placeholder://templates/marketplace-multiempresa','domain','#67e8f9','#020617','Enterprise','Enterprise','Sob consulta',85,false,true,4.9,41,7,'["Empresas","Fornecedores","Planos","Governança"]',15,'["Android","iOS","Web","White Label"]','20 a 40 dias','["Multiempresa","Fornecedores","Planos","Comissões","Governança","Painel executivo"]','["Tenants","Planos","Fornecedores","Produtos","Pedidos","Comissões","Security Center"]','["Supabase","WhatsApp","E-mail","Analytics","Split","Observabilidade","Publicação"]','["Expo","React Native/Web","TypeScript","Supabase","Edge Functions-ready"]','0.8.0','Enterprise','["marketplace-completo","servicos-locais"]','["financeira","hotel-premium"]','{"recommendedPromptContext":["modelo de rede","papéis"],"personalizationInputs":["planos","governança"],"generationBoundaries":["não provisionar Data Plane automaticamente"]}',true)
on conflict (slug) do update set
  business_dna_id = excluded.business_dna_id,
  name = excluded.name,
  segment = excluded.segment,
  category = excluded.category,
  description = excluded.description,
  long_description = excluded.long_description,
  image_url = excluded.image_url,
  icon = excluded.icon,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  badge = excluded.badge,
  price_tier = excluded.price_tier,
  price_label = excluded.price_label,
  popularity_score = excluded.popularity_score,
  is_best_seller = excluded.is_best_seller,
  is_new = excluded.is_new,
  rating = excluded.rating,
  downloads = excluded.downloads,
  deployments = excluded.deployments,
  gallery = excluded.gallery,
  modules_count = excluded.modules_count,
  compatibility = excluded.compatibility,
  average_implementation_time = excluded.average_implementation_time,
  features = excluded.features,
  modules = excluded.modules,
  integrations = excluded.integrations,
  technologies = excluded.technologies,
  version = excluded.version,
  recommended_plan = excluded.recommended_plan,
  recommended_template_slugs = excluded.recommended_template_slugs,
  related_template_slugs = excluded.related_template_slugs,
  ai_integration_contract = excluded.ai_integration_contract,
  is_active = excluded.is_active;

insert into public.business_dna_modules (business_dna_id, name, sort_order)
select bd.id, module_name, ordinality::integer
from public.business_dna bd
cross join lateral jsonb_array_elements_text(bd.modules) with ordinality as module_item(module_name, ordinality)
on conflict (business_dna_id, name) do update set sort_order = excluded.sort_order, is_active = true;

insert into public.template_modules (template_id, name, sort_order)
select pt.id, module_name, ordinality::integer
from public.premium_templates pt
cross join lateral jsonb_array_elements_text(pt.modules) with ordinality as module_item(module_name, ordinality)
on conflict (template_id, name) do update set sort_order = excluded.sort_order, is_active = true;

insert into public.template_integrations (template_id, name, sort_order)
select pt.id, integration_name, ordinality::integer
from public.premium_templates pt
cross join lateral jsonb_array_elements_text(pt.integrations) with ordinality as integration_item(integration_name, ordinality)
on conflict (template_id, name) do update set sort_order = excluded.sort_order, is_active = true;
