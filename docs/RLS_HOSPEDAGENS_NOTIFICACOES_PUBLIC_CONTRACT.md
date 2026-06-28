# Hardening RLS Notificacoes e Contrato Publico Hospedagens

Casa Mineira SaaS - Sprint Enterprise 021

## Ambiente

**Ambiente testado:** Supabase local.

- API local: `http://127.0.0.1:54321`
- Banco local: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Nenhum comando foi executado contra producao. Nenhuma UI foi alterada. Nenhum dado foi movido ou apagado.

## Escopo

Corrigido nesta sprint:

- `public.caminho_hospedagem_notificacoes` INSERT

Auditado e nao corrigido automaticamente:

- grants amplos `anon`/`authenticated` em tabelas de Hospedagens;
- contrato publico de catalogo via tabela versus RPC/Edge Function.

## Policy antiga removida

Policy:

- `caminho_hospedagem_notificacoes_admin_insert`

Regra antiga:

```sql
public.is_empresa_admin(tenant_id)
or public.is_super_admin()
or user_id = auth.uid()
```

Problema: usuario autenticado podia inserir notificacao para si mesmo sem exigir explicitamente que `tenant_id = public.current_tenant_id()`.

## Policy nova criada

Migration:

- `supabase/migrations/20260628010000_harden_caminho_hospedagem_notificacoes_insert.sql`

Nova regra:

```sql
public.is_super_admin()
or (
  tenant_id = public.current_tenant_id()
  and exists (
    select 1
    from public.tenant_users tu
    where tu.user_id = auth.uid()
      and tu.tenant_id = caminho_hospedagem_notificacoes.tenant_id
      and tu.role in ('owner', 'admin', 'admin_empresa', 'gestor')
      and coalesce(tu.ativo, true) = true
  )
)
or (
  user_id = auth.uid()
  and tenant_id = public.current_tenant_id()
)
```

Efeito:

- cliente cria apenas notificacao propria no tenant atual;
- owner/admin/admin_empresa/gestor cria notificacao dentro do tenant atual;
- super admin continua autorizado;
- anon nao possui policy de INSERT.

## Observacao sobre current_tenant_id

`public.current_tenant_id()` busca primeiro o tenant ativo marcado como `is_default = true`. Se nao houver default, usa o primeiro tenant ativo por `created_at`.

Risco documentado: usuarios multi-tenant podem depender do tenant default para inserir notificacoes proprias. A nova policy evita spoofing de tenant, mas pode negar inserts legitimos se o tenant atual/default nao estiver corretamente definido no contexto do usuario.

## Testes atualizados

Arquivo atualizado:

- `supabase/tests/rls/03_hospedagens_extended_access_matrix.sql`

Checks adicionados:

- `cliente_hospedagens` consegue criar notificacao propria no tenant correto.
- `cliente_hospedagens` nao consegue criar notificacao propria em tenant diferente.
- `cliente_hospedagens` nao consegue criar notificacao para outro usuario.
- `anon` nao consegue inserir notificacao.
- `hospedagens_owner` consegue criar notificacao no tenant correto.

## Resultado das matrizes

Comandos executados localmente:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/seed/rls_personas_seed.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls/02_persona_access_matrix.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -v ON_ERROR_STOP=1 -f supabase/tests/rls/03_hospedagens_extended_access_matrix.sql
```

Resultados:

- Matriz `02`: **36 checks passaram, 0 falhas**.
- Matriz `03`: **52 checks passaram, 0 falhas P0/P1**.

Resumo dos novos checks:

| Check | Esperado | Atual | Resultado |
| --- | --- | --- | --- |
| Cliente insere notificacao propria no tenant correto | `true` | `true` | Passou |
| Cliente nao insere notificacao propria em outro tenant | `false` | `false` | Passou |
| Cliente nao insere notificacao para outro usuario | `false` | `false` | Passou |
| Anon nao insere notificacao | `false` | `false` | Passou |
| Owner insere notificacao no tenant correto | `true` | `true` | Passou |

## Auditoria de grants

No ambiente local, as tabelas `caminho_hospedagem_%` auditadas apresentam grants amplos para `anon` e `authenticated`, incluindo `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES` e `TRIGGER`.

Esta sprint nao revogou grants porque o escopo era corrigir a policy INSERT de notificacoes e auditar o contrato publico. A contencao efetiva permanece nas policies RLS.

Risco remanescente: grants amplos aumentam dependencia de RLS correta em todas as tabelas e comandos. Recomendacao: sprint propria para reduzir grants ao minimo operacional.

## Contrato publico recomendado

Recomendacao atual: manter temporariamente **catalogo publico via RLS filtrada**, como definido na Sprint 020, porque as telas publicas ja consultam dados de catalogo diretamente.

Filtros esperados:

- pousadas: `status = 'aprovada'` e `visivel = true`;
- quartos: `ativo = true`, `disponivel = true` e pousada publica;
- servicos: `ativo = true` e pousada publica;
- disponibilidade: `status = 'livre'` e pousada publica.

Recomendacao para Release Candidate: migrar para RPC/Edge Function se houver necessidade de projetar apenas colunas publicas, ocultar detalhes operacionais ou estabilizar um contrato de API independente do schema das tabelas.

## Riscos remanescentes

- Grants amplos de `anon`/`authenticated` seguem existentes e devem ser reduzidos em sprint propria.
- `current_tenant_id()` depende de tenant default/ativo; usuarios multi-tenant precisam de contexto consistente.
- Catalogo publico via tabela expoe todas as colunas das linhas permitidas pela policy. RPC/Edge Function e mais adequado se o contrato publico exigir projecao de colunas.

## Status de seguranca

**Seguro no recorte corrigido:** INSERT de `caminho_hospedagem_notificacoes` agora exige tenant explicito para cliente e equipe operacional nos testes locais.

**Pronto para Release Candidate com ressalva:** antes de RC final, revisar grants amplos e decidir se catalogo publico direto por tabela e aceitavel.

## Proxima sprint recomendada

Sprint Enterprise 022 - Grants Minimos e Contrato Publico RC:

1. Reduzir grants amplos `anon`/`authenticated` nas tabelas `caminho_hospedagem_%`.
2. Criar ou validar RPC/Edge Function para catalogo publico com projecao segura.
3. Reexecutar matrizes `02` e `03`.
4. Preparar checklist Release Candidate de RLS Hospedagens.
