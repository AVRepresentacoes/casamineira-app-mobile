-- Hardening de RLS para integridade financeira.
-- Evita que clientes autenticados forjem registros de pagamento/comissao via API pública.

alter table public.pagamentos enable row level security;
alter table public.comissoes enable row level security;

-- PAGAMENTOS: leitura permanece para cliente dono do pedido e profissional vinculado.
-- Escrita deve ocorrer somente por funções com service role.
drop policy if exists pagamentos_insert_authenticated on public.pagamentos;
drop policy if exists pagamentos_update_authenticated on public.pagamentos;
drop policy if exists pagamentos_delete_authenticated on public.pagamentos;

revoke insert, update, delete on public.pagamentos from authenticated;
grant select on public.pagamentos to authenticated;

-- COMISSOES: leitura profissional vinculada; escrita apenas service role.
drop policy if exists comissoes_insert_authenticated on public.comissoes;
drop policy if exists comissoes_update_authenticated on public.comissoes;
drop policy if exists comissoes_delete_authenticated on public.comissoes;

revoke insert, update, delete on public.comissoes from authenticated;
grant select on public.comissoes to authenticated;
