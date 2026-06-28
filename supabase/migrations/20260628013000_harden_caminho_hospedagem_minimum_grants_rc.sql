-- Sprint Enterprise 022
-- Grants minimos para Hospedagens Caminhos da Fe antes da Release Candidate.
--
-- Escopo:
-- - public.caminho_hospedagem_%
--
-- Reduz permissoes amplas de anon/authenticated. Nao altera dados, RLS,
-- UI ou logica de negocio.

revoke all privileges on table public.caminho_hospedagem_aceites from anon, authenticated;
revoke all privileges on table public.caminho_hospedagem_avaliacoes from anon, authenticated;
revoke all privileges on table public.caminho_hospedagem_chamados from anon, authenticated;
revoke all privileges on table public.caminho_hospedagem_disponibilidade from anon, authenticated;
revoke all privileges on table public.caminho_hospedagem_favoritos from anon, authenticated;
revoke all privileges on table public.caminho_hospedagem_movimentos from anon, authenticated;
revoke all privileges on table public.caminho_hospedagem_notificacoes from anon, authenticated;
revoke all privileges on table public.caminho_hospedagem_pousada_saldos from anon, authenticated;
revoke all privileges on table public.caminho_hospedagem_pousadas from anon, authenticated;
revoke all privileges on table public.caminho_hospedagem_quartos from anon, authenticated;
revoke all privileges on table public.caminho_hospedagem_reservas from anon, authenticated;
revoke all privileges on table public.caminho_hospedagem_servicos from anon, authenticated;

-- Catalogo publico e avaliacoes publicadas. As policies RLS filtram as linhas.
grant select on table public.caminho_hospedagem_avaliacoes to anon;
grant select on table public.caminho_hospedagem_disponibilidade to anon;
grant select on table public.caminho_hospedagem_pousadas to anon;
grant select on table public.caminho_hospedagem_quartos to anon;
grant select on table public.caminho_hospedagem_servicos to anon;

-- Usuarios autenticados: comandos alinhados as policies RLS existentes.
grant select, insert, update on table public.caminho_hospedagem_aceites to authenticated;
grant select, insert, update on table public.caminho_hospedagem_avaliacoes to authenticated;
grant select, insert, update on table public.caminho_hospedagem_chamados to authenticated;
grant select, insert, update on table public.caminho_hospedagem_disponibilidade to authenticated;
grant select, insert, update, delete on table public.caminho_hospedagem_favoritos to authenticated;
grant select on table public.caminho_hospedagem_movimentos to authenticated;
grant select, insert, update on table public.caminho_hospedagem_notificacoes to authenticated;
grant select on table public.caminho_hospedagem_pousada_saldos to authenticated;
grant select, insert, update on table public.caminho_hospedagem_pousadas to authenticated;
grant select, insert, update on table public.caminho_hospedagem_quartos to authenticated;
grant select, insert, update on table public.caminho_hospedagem_reservas to authenticated;
grant select, insert, update on table public.caminho_hospedagem_servicos to authenticated;
