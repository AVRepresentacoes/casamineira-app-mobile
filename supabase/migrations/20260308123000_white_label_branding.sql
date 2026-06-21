create extension if not exists pgcrypto;

create table if not exists public.app_branding (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null,
  app_name text not null,
  slogan text,
  primary_color text not null default '#facc15',
  secondary_color text not null default '#020617',
  accent_color text not null default '#1e293b',
  logo_url text,
  support_whatsapp text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_branding
  add column if not exists tenant_slug text,
  add column if not exists app_name text,
  add column if not exists slogan text,
  add column if not exists primary_color text not null default '#facc15',
  add column if not exists secondary_color text not null default '#020617',
  add column if not exists accent_color text not null default '#1e293b',
  add column if not exists logo_url text,
  add column if not exists support_whatsapp text,
  add column if not exists active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

update public.app_branding
set tenant_slug = coalesce(nullif(tenant_slug, ''), 'default'),
    app_name = coalesce(nullif(app_name, ''), 'Casa Mineira Serviços')
where tenant_slug is null
   or app_name is null;

alter table public.app_branding
  alter column tenant_slug set not null,
  alter column app_name set not null;

create unique index if not exists app_branding_tenant_slug_idx
  on public.app_branding (tenant_slug);

create or replace function public.set_updated_at_app_branding()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_branding_updated_at on public.app_branding;
create trigger trg_app_branding_updated_at
before update on public.app_branding
for each row
execute function public.set_updated_at_app_branding();

alter table public.app_branding enable row level security;

revoke insert, update, delete on public.app_branding from anon, authenticated;
grant select on public.app_branding to anon, authenticated;

drop policy if exists app_branding_select_active on public.app_branding;
create policy app_branding_select_active
on public.app_branding
for select
to anon, authenticated
using (active = true);

insert into public.app_branding (
  tenant_slug,
  app_name,
  slogan,
  primary_color,
  secondary_color,
  accent_color,
  active
)
values (
  'default',
  'Casa Mineira Serviços',
  'Conectando profissionais e clientes',
  '#facc15',
  '#020617',
  '#1e293b',
  true
)
on conflict (tenant_slug) do update
set app_name = excluded.app_name,
    slogan = excluded.slogan,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    accent_color = excluded.accent_color,
    active = true;
