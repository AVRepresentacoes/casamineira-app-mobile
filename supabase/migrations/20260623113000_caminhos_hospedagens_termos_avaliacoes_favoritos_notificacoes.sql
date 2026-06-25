create table if not exists public.caminho_hospedagem_aceites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  papel text not null,
  documento text not null,
  versao text not null,
  ip text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  accepted_at timestamptz not null default now(),
  unique (tenant_id, user_id, documento, versao),
  constraint caminho_hospedagem_aceites_papel_check check (papel in ('cliente', 'pousada', 'admin')),
  constraint caminho_hospedagem_aceites_documento_check check (documento in ('termos_cliente', 'politica_privacidade', 'contrato_pousada', 'politicas_pousada'))
);

create table if not exists public.caminho_hospedagem_avaliacoes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  reserva_id uuid references public.caminho_hospedagem_reservas(id) on delete set null,
  cliente_id uuid references auth.users(id) on delete set null,
  hospedagem_slug text not null,
  hospedagem_nome text not null,
  nota_geral integer not null,
  limpeza integer not null default 5,
  atendimento integer not null default 5,
  localizacao integer not null default 5,
  custo_beneficio integer not null default 5,
  comentario text,
  publicada boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint caminho_hospedagem_avaliacoes_nota_check check (
    nota_geral between 1 and 5 and limpeza between 1 and 5 and atendimento between 1 and 5 and localizacao between 1 and 5 and custo_beneficio between 1 and 5
  )
);

create unique index if not exists caminho_hospedagem_avaliacoes_reserva_cliente_uidx
  on public.caminho_hospedagem_avaliacoes (reserva_id, cliente_id)
  where reserva_id is not null and cliente_id is not null;

create table if not exists public.caminho_hospedagem_favoritos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  hospedagem_slug text not null,
  hospedagem_nome text not null,
  cidade text,
  etapa_ordem integer,
  checkin_planejado date,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id, hospedagem_slug)
);

create table if not exists public.caminho_hospedagem_notificacoes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  papel text not null default 'cliente',
  titulo text not null,
  mensagem text not null,
  tipo text not null default 'sistema',
  lida boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint caminho_hospedagem_notificacoes_papel_check check (papel in ('cliente', 'pousada', 'admin')),
  constraint caminho_hospedagem_notificacoes_tipo_check check (tipo in ('sistema', 'reserva', 'pagamento', 'suporte', 'avaliacao', 'admin'))
);

create index if not exists caminho_hospedagem_notificacoes_user_idx on public.caminho_hospedagem_notificacoes (user_id, created_at desc);

drop trigger if exists trg_caminho_hospedagem_avaliacoes_updated_at on public.caminho_hospedagem_avaliacoes;
create trigger trg_caminho_hospedagem_avaliacoes_updated_at before update on public.caminho_hospedagem_avaliacoes for each row execute function public.set_updated_at();
drop trigger if exists trg_caminho_hospedagem_favoritos_updated_at on public.caminho_hospedagem_favoritos;
create trigger trg_caminho_hospedagem_favoritos_updated_at before update on public.caminho_hospedagem_favoritos for each row execute function public.set_updated_at();

alter table public.caminho_hospedagem_aceites enable row level security;
alter table public.caminho_hospedagem_avaliacoes enable row level security;
alter table public.caminho_hospedagem_favoritos enable row level security;
alter table public.caminho_hospedagem_notificacoes enable row level security;

drop policy if exists caminho_hospedagem_aceites_own_all on public.caminho_hospedagem_aceites;
create policy caminho_hospedagem_aceites_own_all on public.caminho_hospedagem_aceites for all to authenticated using (user_id = auth.uid() or public.is_empresa_admin(tenant_id) or public.is_super_admin()) with check (user_id = auth.uid() and tenant_id = public.current_tenant_id());
drop policy if exists caminho_hospedagem_avaliacoes_select_public on public.caminho_hospedagem_avaliacoes;
create policy caminho_hospedagem_avaliacoes_select_public on public.caminho_hospedagem_avaliacoes for select to anon, authenticated using (publicada = true or cliente_id = auth.uid() or public.user_belongs_to_tenant(tenant_id) or public.is_super_admin());
drop policy if exists caminho_hospedagem_avaliacoes_insert_cliente on public.caminho_hospedagem_avaliacoes;
create policy caminho_hospedagem_avaliacoes_insert_cliente on public.caminho_hospedagem_avaliacoes for insert to authenticated with check (cliente_id = auth.uid() and tenant_id = public.current_tenant_id());
drop policy if exists caminho_hospedagem_avaliacoes_update_admin on public.caminho_hospedagem_avaliacoes;
create policy caminho_hospedagem_avaliacoes_update_admin on public.caminho_hospedagem_avaliacoes for update to authenticated using (public.is_empresa_admin(tenant_id) or public.is_super_admin()) with check (public.is_empresa_admin(tenant_id) or public.is_super_admin());
drop policy if exists caminho_hospedagem_favoritos_own_all on public.caminho_hospedagem_favoritos;
create policy caminho_hospedagem_favoritos_own_all on public.caminho_hospedagem_favoritos for all to authenticated using (user_id = auth.uid() or public.is_empresa_admin(tenant_id) or public.is_super_admin()) with check (user_id = auth.uid() and tenant_id = public.current_tenant_id());
drop policy if exists caminho_hospedagem_notificacoes_own_select on public.caminho_hospedagem_notificacoes;
create policy caminho_hospedagem_notificacoes_own_select on public.caminho_hospedagem_notificacoes for select to authenticated using (user_id = auth.uid() or public.user_belongs_to_tenant(tenant_id) or public.is_super_admin());
drop policy if exists caminho_hospedagem_notificacoes_admin_insert on public.caminho_hospedagem_notificacoes;
create policy caminho_hospedagem_notificacoes_admin_insert on public.caminho_hospedagem_notificacoes for insert to authenticated with check (public.is_empresa_admin(tenant_id) or public.is_super_admin() or user_id = auth.uid());
drop policy if exists caminho_hospedagem_notificacoes_own_update on public.caminho_hospedagem_notificacoes;
create policy caminho_hospedagem_notificacoes_own_update on public.caminho_hospedagem_notificacoes for update to authenticated using (user_id = auth.uid() or public.is_empresa_admin(tenant_id) or public.is_super_admin()) with check (user_id = auth.uid() or public.is_empresa_admin(tenant_id) or public.is_super_admin());
