# Hardening RLS Hospedagens P1 Operacional

Casa Mineira SaaS - Sprint Enterprise 020

## Ambiente

**Ambiente testado:** Supabase local.

- API local: `http://127.0.0.1:54321`
- Banco local: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Nenhum comando foi executado contra producao. Nenhuma UI foi alterada. Nenhum dado foi movido ou apagado.

## Escopo corrigido

Somente os P1 operacionais de Hospedagens:

- `public.caminho_hospedagem_pousadas`
- `public.caminho_hospedagem_quartos`
- `public.caminho_hospedagem_servicos`
- `public.caminho_hospedagem_disponibilidade`

Fora do escopo e nao alterados nesta sprint:

- P0 ja corrigidos: `avaliacoes`, `chamados`, `notificacoes`
- `reservas`
- `pousada_saldos`
- `movimentos`
- Casa Mineira Servicos
- Casa Mineira SaaS Control Plane

## Policies antigas inseguras

| Tabela | Policy antiga | Problema |
| --- | --- | --- |
| `caminho_hospedagem_pousadas` | `caminho_hospedagem_pousadas_member_select` | `user_belongs_to_tenant(tenant_id)` permitia cliente ver pousada operacional privada. |
| `caminho_hospedagem_quartos` | `caminho_hospedagem_quartos_member_all` | `FOR ALL` com `user_belongs_to_tenant(tenant_id)` permitia cliente ver quarto privado/inativo e ampliava escrita operacional. |
| `caminho_hospedagem_servicos` | `caminho_hospedagem_servicos_member_all` | `FOR ALL` com `user_belongs_to_tenant(tenant_id)` permitia cliente ver servico privado/inativo e ampliava escrita operacional. |
| `caminho_hospedagem_disponibilidade` | `caminho_hospedagem_disponibilidade_member_all` | `FOR ALL` com `user_belongs_to_tenant(tenant_id)` permitia cliente ver bloqueio/manutencao operacional. |

## Colunas confirmadas

| Tabela | Colunas usadas |
| --- | --- |
| `caminho_hospedagem_pousadas` | `tenant_id`, `owner_user_id`, `status`, `visivel` |
| `caminho_hospedagem_quartos` | `tenant_id`, `pousada_id`, `ativo`, `disponivel` |
| `caminho_hospedagem_servicos` | `tenant_id`, `pousada_id`, `ativo` |
| `caminho_hospedagem_disponibilidade` | `tenant_id`, `pousada_id`, `status` |

## Migration criada

Arquivo:

- `supabase/migrations/20260628003000_harden_caminho_hospedagem_operational_p1.sql`

Mudancas:

- Removeu somente as quatro policies amplas inseguras do escopo.
- Criou SELECT publico filtrado para catalogo.
- Criou SELECT operacional para owner/equipe do tenant.
- Substituiu `FOR ALL` por INSERT e UPDATE operacionais explicitos.
- Nao criou DELETE amplo.
- Nao alterou notificacoes INSERT.

## Policies novas

### Pousadas

- `caminho_hospedagem_pousadas_select_public`: `anon` e `authenticated` veem somente `status = 'aprovada'` e `visivel = true`.
- `caminho_hospedagem_pousadas_select_operacional`: owner, equipe operacional do tenant ou super admin veem dados operacionais.
- `caminho_hospedagem_pousadas_insert_operacional`: escrita restrita a owner, equipe operacional do tenant ou super admin.
- `caminho_hospedagem_pousadas_update_operacional`: escrita restrita a owner, equipe operacional do tenant ou super admin.

### Quartos

- `caminho_hospedagem_quartos_select_public`: publico ve somente `ativo = true`, `disponivel = true` e pousada publica/aprovada/visivel.
- `caminho_hospedagem_quartos_select_operacional`: owner da pousada, equipe operacional do tenant ou super admin.
- `caminho_hospedagem_quartos_insert_operacional`: escrita operacional.
- `caminho_hospedagem_quartos_update_operacional`: escrita operacional.

### Servicos

- `caminho_hospedagem_servicos_select_public`: publico ve somente `ativo = true` e pousada publica/aprovada/visivel.
- `caminho_hospedagem_servicos_select_operacional`: owner da pousada, equipe operacional do tenant ou super admin.
- `caminho_hospedagem_servicos_insert_operacional`: escrita operacional.
- `caminho_hospedagem_servicos_update_operacional`: escrita operacional.

### Disponibilidade

- `caminho_hospedagem_disponibilidade_select_public`: publico ve somente `status = 'livre'` e pousada publica/aprovada/visivel.
- `caminho_hospedagem_disponibilidade_select_operacional`: owner da pousada, equipe operacional do tenant ou super admin.
- `caminho_hospedagem_disponibilidade_insert_operacional`: escrita operacional.
- `caminho_hospedagem_disponibilidade_update_operacional`: escrita operacional.

Roles operacionais aceitos nas novas policies:

- `owner`
- `admin`
- `admin_empresa`
- `gestor`
- `operador`
- `atendente`
- `manager`
- `staff`

`manager` e `staff` foram mantidos por compatibilidade com roles ja existentes na base/helper atual.

## Decisao de catalogo publico

Decisao adotada nesta sprint: **Opcao A - catalogo publico via policies RLS filtradas**.

Motivo: as telas publicas de Hospedagens consultam dados de catalogo diretamente. As novas policies permitem leitura anonima apenas de linhas publicas e publicaveis, sem expor:

- pousada pendente/oculta;
- quarto inativo/indisponivel;
- servico inativo;
- bloqueio, manutencao ou indisponibilidade operacional.

Recomendacao futura: avaliar RPC/Edge Function se o produto precisar ocultar colunas operacionais mesmo em linhas publicas.

## Revisao de notificacoes INSERT

Policy revisada e nao alterada nesta sprint:

- `caminho_hospedagem_notificacoes_admin_insert`

Regra atual:

```sql
public.is_empresa_admin(tenant_id)
or public.is_super_admin()
or user_id = auth.uid()
```

Risco remanescente: usuario autenticado pode inserir notificacao para si mesmo sem exigir explicitamente `tenant_id = public.current_tenant_id()`. Classificacao: **P1 para sprint propria**, pois nao e vazamento SELECT horizontal e corrigir agora ampliaria o escopo.

## Resultado antes

Sprint Enterprise 018/019:

| Check | Esperado | Atual |
| --- | --- | --- |
| `cliente_hospedagens` ve pousada privada | `0` | `1` |
| `cliente_hospedagens` ve quarto privado/inativo | `0` | `1` |
| `cliente_hospedagens` ve servico privado/inativo | `0` | `1` |
| `cliente_hospedagens` ve bloqueio/manutencao | `0` | `1` |

## Resultado depois

Com a migration aplicada localmente:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls/02_persona_access_matrix.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls/03_hospedagens_extended_access_matrix.sql
```

Resultados:

- Matriz `02`: **36 checks passaram, 0 falhas**.
- Matriz `03`: **47 checks passaram, 0 falhas P0/P1**.

Resumo P1:

| Check | Esperado | Atual | Resultado |
| --- | ---: | ---: | --- |
| Cliente nao ve pousada privada | 0 | 0 | Passou |
| Cliente ve pousada publica | 1 | 1 | Passou |
| Cliente nao ve quarto privado/inativo | 0 | 0 | Passou |
| Cliente ve quarto publico ativo/disponivel | 1 | 1 | Passou |
| Cliente nao ve servico privado/inativo | 0 | 0 | Passou |
| Cliente ve servico publico ativo | 1 | 1 | Passou |
| Cliente nao ve bloqueio/manutencao | 0 | 0 | Passou |
| Cliente ve disponibilidade livre publica | 1 | 1 | Passou |
| Anon ve somente catalogo publico filtrado | 1 por tabela publica | 1 por tabela publica | Passou |
| Anon nao ve dados privados operacionais | 0 | 0 | Passou |
| Hospedagens owner ve dados operacionais do tenant | 2 | 2 | Passou |
| Casa Mineira Servicos owner nao ve dados privados Hospedagens | 0 | 0 | Passou |

## Riscos remanescentes

- `caminho_hospedagem_notificacoes_admin_insert` permanece para hardening separado.
- Grants amplos de tabela para `anon` e `authenticated` existem no ambiente local, mas as novas policies RLS bloqueiam escrita anonima por ausencia de INSERT/UPDATE policies para `anon` e filtram SELECT publico.
- As roles `gestor`, `operador` e `atendente` aparecem nas policies, mas podem exigir alinhamento futuro da constraint `tenant_users_role_check` se forem usadas oficialmente.
- Linhas publicas podem expor colunas existentes da propria tabela. Se o produto precisar projetar apenas campos especificos, preferir RPC/Edge Function em sprint futura.

## Status de seguranca

**Seguro no recorte P1 operacional corrigido:** cliente final e anon nao veem dados operacionais privados de pousadas, quartos, servicos e disponibilidade nos testes locais.

**Ainda requer hardening pontual:** INSERT de notificacoes e eventual contrato de API publica por colunas.

## Recomendacao para producao

Nao aplicar em producao sem revisao humana e janela controlada. Antes de producao:

1. Validar se `manager`/`staff` devem continuar como roles operacionais oficiais.
2. Confirmar se catalogo publico direto por tabela e a decisao final do produto.
3. Executar as matrizes `02` e `03` em ambiente staging/local equivalente.

## Proxima sprint recomendada

Sprint Enterprise 021 - Hardening RLS Notificacoes e Contrato Publico:

1. Corrigir `caminho_hospedagem_notificacoes_admin_insert`.
2. Revisar grants amplos de `anon`/`authenticated` para tabelas de Hospedagens.
3. Decidir RPC/Edge Function para catalogo publico com projecao segura de colunas.
