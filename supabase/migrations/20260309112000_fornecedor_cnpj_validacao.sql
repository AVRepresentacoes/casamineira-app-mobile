-- Cadastro de fornecedor com CNPJ obrigatório e válido.

create or replace function public.is_valid_cnpj(p_cnpj text)
returns boolean
language plpgsql
immutable
as $$
declare
  v_cnpj text;
  v_soma integer;
  v_resto integer;
  v_dv1 integer;
  v_dv2 integer;
  v_pesos1 integer[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  v_pesos2 integer[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
  i integer;
begin
  v_cnpj := regexp_replace(coalesce(p_cnpj, ''), '\D', '', 'g');

  if length(v_cnpj) <> 14 then
    return false;
  end if;

  if v_cnpj ~ '^(\d)\1{13}$' then
    return false;
  end if;

  v_soma := 0;
  for i in 1..12 loop
    v_soma := v_soma + (substr(v_cnpj, i, 1)::integer * v_pesos1[i]);
  end loop;
  v_resto := v_soma % 11;
  v_dv1 := case when v_resto < 2 then 0 else 11 - v_resto end;

  v_soma := 0;
  for i in 1..13 loop
    v_soma := v_soma + (substr(v_cnpj, i, 1)::integer * v_pesos2[i]);
  end loop;
  v_resto := v_soma % 11;
  v_dv2 := case when v_resto < 2 then 0 else 11 - v_resto end;

  return v_dv1 = substr(v_cnpj, 13, 1)::integer
    and v_dv2 = substr(v_cnpj, 14, 1)::integer;
end;
$$;

alter table public.profissionais
  add column if not exists fornecedor_cnpj text,
  add column if not exists fornecedor_razao_social text,
  add column if not exists fornecedor_nome_fantasia text,
  add column if not exists fornecedor_categoria text,
  add column if not exists fornecedor_descricao text;

update public.profissionais
set fornecedor_cnpj = regexp_replace(fornecedor_cnpj, '\D', '', 'g')
where fornecedor_cnpj is not null;

alter table public.profissionais
  drop constraint if exists profissionais_fornecedor_cnpj_valid_check;

alter table public.profissionais
  add constraint profissionais_fornecedor_cnpj_valid_check
  check (fornecedor_cnpj is null or public.is_valid_cnpj(fornecedor_cnpj));

create unique index if not exists profissionais_tenant_fornecedor_cnpj_uk
  on public.profissionais (tenant_id, fornecedor_cnpj)
  where fornecedor_cnpj is not null;
