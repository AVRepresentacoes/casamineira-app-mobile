-- Compatibilidade entre esquemas antigos/novos de pagamentos:
-- alguns ambientes usaram `status_pagamentos` (plural).
-- O app usa `status_pagamento` (singular).

alter table public.pagamentos
  add column if not exists status_pagamento text default 'pendente',
  add column if not exists status_pagamentos text;

update public.pagamentos
set status_pagamento = coalesce(status_pagamento, status_pagamentos, 'pendente')
where status_pagamento is null;

update public.pagamentos
set status_pagamentos = status_pagamento
where status_pagamentos is distinct from status_pagamento;

alter table public.pagamentos
  alter column status_pagamento set default 'pendente';

create or replace function public.sync_pagamentos_status_columns()
returns trigger
language plpgsql
as $$
begin
  if new.status_pagamento is null and new.status_pagamentos is not null then
    new.status_pagamento := new.status_pagamentos;
  end if;

  if new.status_pagamentos is null and new.status_pagamento is not null then
    new.status_pagamentos := new.status_pagamento;
  end if;

  if new.status_pagamento is null and new.status_pagamentos is null then
    new.status_pagamento := 'pendente';
    new.status_pagamentos := 'pendente';
  end if;

  if new.status_pagamento is not null then
    new.status_pagamentos := new.status_pagamento;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_pagamentos_status_columns on public.pagamentos;
create trigger trg_sync_pagamentos_status_columns
before insert or update on public.pagamentos
for each row
execute function public.sync_pagamentos_status_columns();
