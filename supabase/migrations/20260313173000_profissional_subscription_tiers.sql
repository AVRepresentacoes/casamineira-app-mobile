alter table public.profiles
  add column if not exists plano_ativo boolean not null default false,
  add column if not exists subscription_tier text;

alter table public.profissionais
  add column if not exists plano_ativo boolean not null default false,
  add column if not exists subscription_tier text;

update public.profiles
set subscription_tier = case
  when lower(coalesce(subscription_tier, '')) in ('starter', 'pro', 'elite') then lower(subscription_tier)
  when coalesce(plano_ativo, false) then 'pro'
  else 'starter'
end
where subscription_tier is null
   or lower(coalesce(subscription_tier, '')) not in ('starter', 'pro', 'elite');

update public.profissionais pf
set subscription_tier = case
  when lower(coalesce(pf.subscription_tier, '')) in ('starter', 'pro', 'elite') then lower(pf.subscription_tier)
  when lower(coalesce(pr.subscription_tier, '')) in ('starter', 'pro', 'elite') then lower(pr.subscription_tier)
  when coalesce(pr.plano_ativo, false) then 'pro'
  else 'starter'
end
from public.profiles pr
where pr.id = pf.user_id
  and (
    pf.subscription_tier is null
    or lower(coalesce(pf.subscription_tier, '')) not in ('starter', 'pro', 'elite')
  );

update public.profiles
set plano_ativo = subscription_tier in ('pro', 'elite')
where coalesce(plano_ativo, false) is distinct from (subscription_tier in ('pro', 'elite'));

update public.profissionais
set plano_ativo = subscription_tier in ('pro', 'elite')
where coalesce(plano_ativo, false) is distinct from (subscription_tier in ('pro', 'elite'));

alter table public.profiles
  drop constraint if exists profiles_subscription_tier_check;

alter table public.profiles
  add constraint profiles_subscription_tier_check
  check (subscription_tier in ('starter', 'pro', 'elite'));

alter table public.profissionais
  drop constraint if exists profissionais_subscription_tier_check;

alter table public.profissionais
  add constraint profissionais_subscription_tier_check
  check (subscription_tier in ('starter', 'pro', 'elite'));

create or replace function public.get_my_profissional_subscription_context()
returns table (
  subscription_tier text,
  services_limit integer,
  portfolio_limit integer,
  analytics_mode text,
  growth_dashboard boolean,
  ranking_boost text
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      case
        when lower(coalesce(pf.subscription_tier, '')) in ('starter', 'pro', 'elite') then lower(pf.subscription_tier)
        when lower(coalesce(pr.subscription_tier, '')) in ('starter', 'pro', 'elite') then lower(pr.subscription_tier)
        when coalesce(pr.plano_ativo, false) then 'pro'
        else 'starter'
      end as tier
    from auth.users u
    left join public.profiles pr on pr.id = u.id
    left join public.profissionais pf on pf.user_id = u.id
    where u.id = auth.uid()
  )
  select
    tier as subscription_tier,
    case tier when 'starter' then 10 when 'pro' then 30 else null end as services_limit,
    case tier when 'starter' then 10 when 'pro' then 40 else null end as portfolio_limit,
    case tier when 'starter' then 'basic' when 'pro' then 'advanced' else 'complete' end as analytics_mode,
    case when tier in ('pro', 'elite') then true else false end as growth_dashboard,
    case tier when 'pro' then 'boosted' when 'elite' then 'elite' else 'base' end as ranking_boost
  from base;
$$;

grant execute on function public.get_my_profissional_subscription_context() to authenticated;
