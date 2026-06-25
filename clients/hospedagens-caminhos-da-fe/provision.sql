-- Provisionamento white-label: Hospedagens Caminhos da Fé
-- Execute no SQL Editor do Supabase com um usuário super_admin.

do $$
begin
  if not exists (
    select 1
    from public.tenants
    where slug = 'hospedagens-caminhos-da-fe'
  ) then
    perform public.saas_admin_create_empresa(
      'Hospedagens Caminhos da Fé',
      'hospedagens-caminhos-da-fe',
      null,
      'hospedagenscaminhosdafe.com.br'
    );
  end if;
end $$;

update public.tenants
set
  public_signup_enabled = true,
  logo_url = coalesce(null, logo_url),
  cor_primaria = coalesce('#D8A84F', cor_primaria),
  cor_secundaria = coalesce('#12372A', cor_secundaria)
where slug = 'hospedagens-caminhos-da-fe';

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
  'hospedagens-caminhos-da-fe',
  'Hospedagens Caminhos da Fé',
  'Reserve pousadas e quartos no Caminho da Fé.',
  '#D8A84F',
  '#12372A',
  '#4E7C59',
  null,
  '+5535999990000',
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
