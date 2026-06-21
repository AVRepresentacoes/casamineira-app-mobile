create extension if not exists pgcrypto;

create table if not exists public.banners_publicitarios (
  id uuid primary key default gen_random_uuid(),
  posicao text not null default 'pedidos_profissional_topo',
  titulo text not null,
  subtitulo text,
  badge text,
  link_url text not null,
  image_url text,
  ordem integer not null default 0,
  ativo boolean not null default true,
  inicio_em timestamptz,
  fim_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.banners_publicitarios
  add column if not exists posicao text not null default 'pedidos_profissional_topo',
  add column if not exists titulo text,
  add column if not exists subtitulo text,
  add column if not exists badge text,
  add column if not exists link_url text,
  add column if not exists image_url text,
  add column if not exists ordem integer not null default 0,
  add column if not exists ativo boolean not null default true,
  add column if not exists inicio_em timestamptz,
  add column if not exists fim_em timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update public.banners_publicitarios
set titulo = coalesce(titulo, 'Banner sem título'),
    link_url = coalesce(link_url, 'https://www.mercadolivre.com.br/')
where titulo is null or link_url is null;

alter table public.banners_publicitarios
  alter column titulo set not null,
  alter column link_url set not null;

alter table public.banners_publicitarios
  drop constraint if exists banners_publicitarios_posicao_check;

alter table public.banners_publicitarios
  add constraint banners_publicitarios_posicao_check
  check (posicao in ('pedidos_profissional_topo', 'home_cliente_topo', 'global'));

create index if not exists banners_publicitarios_posicao_ativo_ordem_idx
  on public.banners_publicitarios (posicao, ativo, ordem);

create or replace function public.set_updated_at_banners_publicitarios()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_banners_publicitarios_updated_at on public.banners_publicitarios;
create trigger trg_banners_publicitarios_updated_at
before update on public.banners_publicitarios
for each row
execute function public.set_updated_at_banners_publicitarios();

alter table public.banners_publicitarios enable row level security;

revoke insert, update, delete on public.banners_publicitarios from authenticated;
grant select on public.banners_publicitarios to authenticated;

drop policy if exists banners_publicitarios_select_authenticated on public.banners_publicitarios;
create policy banners_publicitarios_select_authenticated
on public.banners_publicitarios
for select
to authenticated
using (
  ativo = true
  and (inicio_em is null or inicio_em <= now())
  and (fim_em is null or fim_em >= now())
);

insert into public.banners_publicitarios (posicao, titulo, subtitulo, badge, link_url, ordem, ativo)
values
  ('pedidos_profissional_topo', 'Ofertas do dia no Mercado Livre', 'Divulgue ferramentas e acessórios e gere renda extra.', 'Afiliado', 'https://www.mercadolivre.com.br/', 1, true),
  ('pedidos_profissional_topo', 'Produtos para casa com alta conversão', 'Banners patrocinados para clientes com intenção de compra.', 'Monetização', 'https://www.mercadolivre.com.br/c/ferramentas', 2, true),
  ('pedidos_profissional_topo', 'Espaço premium para campanhas sazonais', 'Venda espaços para marcas parceiras e aumente ticket da plataforma.', 'Destaque', 'https://www.mercadolivre.com.br/ofertas', 3, true)
on conflict do nothing;
