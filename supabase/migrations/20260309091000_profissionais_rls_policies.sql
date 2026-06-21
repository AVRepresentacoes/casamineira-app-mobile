-- Corrige escrita/leitura autenticada da tabela profissionais
-- mantendo isolamento por tenant + dono da linha.

alter table public.profissionais enable row level security;

grant select, insert, update on public.profissionais to authenticated;

-- Policies permissivas por dono (combinadas com as restritivas de tenant já existentes).
drop policy if exists profissionais_select_own on public.profissionais;
create policy profissionais_select_own
on public.profissionais
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists profissionais_insert_own on public.profissionais;
create policy profissionais_insert_own
on public.profissionais
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists profissionais_update_own on public.profissionais;
create policy profissionais_update_own
on public.profissionais
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
