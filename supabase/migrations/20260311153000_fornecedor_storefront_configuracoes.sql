-- Upgrade de configurações de loja do fornecedor (identidade, contato e operação).

alter table public.profissionais
  add column if not exists fornecedor_capa_url text,
  add column if not exists fornecedor_logo_url text,
  add column if not exists fornecedor_whatsapp text,
  add column if not exists fornecedor_email_publico text,
  add column if not exists fornecedor_instagram text,
  add column if not exists fornecedor_site_url text,
  add column if not exists fornecedor_endereco text,
  add column if not exists fornecedor_bairro text,
  add column if not exists fornecedor_cep text,
  add column if not exists fornecedor_horario_funcionamento text,
  add column if not exists fornecedor_prazo_entrega text,
  add column if not exists fornecedor_pedido_minimo numeric(12,2) not null default 0,
  add column if not exists fornecedor_taxa_entrega numeric(12,2) not null default 0,
  add column if not exists fornecedor_sobre text,
  add column if not exists fornecedor_politica_troca text,
  add column if not exists fornecedor_aberto_agora boolean not null default true;

alter table public.profissionais
  drop constraint if exists profissionais_fornecedor_pedido_minimo_check;

alter table public.profissionais
  add constraint profissionais_fornecedor_pedido_minimo_check
  check (fornecedor_pedido_minimo >= 0);

alter table public.profissionais
  drop constraint if exists profissionais_fornecedor_taxa_entrega_check;

alter table public.profissionais
  add constraint profissionais_fornecedor_taxa_entrega_check
  check (fornecedor_taxa_entrega >= 0);
