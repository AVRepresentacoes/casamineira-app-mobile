-- Provisionamento white-label: Casa Mineira Serviços
-- Execute no SQL Editor do Supabase com um usuário super_admin.

do $$
begin
  if not exists (
    select 1
    from public.tenants
    where slug = 'default'
  ) then
    perform public.saas_admin_create_empresa(
      'Casa Mineira Serviços',
      'default',
      null,
      null
    );
  end if;
end $$;

update public.tenants
set
  public_signup_enabled = true,
  logo_url = coalesce(null, logo_url),
  cor_primaria = coalesce('#facc15', cor_primaria),
  cor_secundaria = coalesce('#020617', cor_secundaria)
where slug = 'default';

insert into public.app_branding (
  tenant_slug,
  app_name,
  slogan,
  primary_color,
  secondary_color,
  accent_color,
  logo_url,
  support_whatsapp,
  active
)
values (
  'default',
  'Casa Mineira Serviços',
  'Conectando profissionais e clientes',
  '#facc15',
  '#020617',
  '#1e293b',
  null,
  null,
  true
)
on conflict (tenant_slug) do update
set
  app_name = excluded.app_name,
  slogan = excluded.slogan,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  accent_color = excluded.accent_color,
  logo_url = excluded.logo_url,
  support_whatsapp = excluded.support_whatsapp,
  active = excluded.active;
