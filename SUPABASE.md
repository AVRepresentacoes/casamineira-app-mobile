# Supabase Production Guide

## Arquitetura

A Casa Mineira SaaS usa Supabase como camada principal de Auth, Postgres, Storage, Realtime, RPCs e Edge Functions.

- Frontend mobile/web: usa apenas anon key via `NEXT_PUBLIC_SUPABASE_*` ou `EXPO_PUBLIC_SUPABASE_*`.
- Backend/Edge Functions: usa `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
- Service Role: proibida no frontend. Use somente em Edge Functions, scripts locais controlados e rotinas administrativas.
- Multi-tenant: isolamento por `tenant_id`, `current_tenant_id()`, `current_empresa_id()`, `user_belongs_to_tenant()`, `is_empresa_admin()` e `is_super_admin()`.

## Control Plane e Data Planes

A arquitetura profissional da plataforma separa o SaaS dos produtos criados:

- **Control Plane**: projeto Supabase principal do SaaS. Guarda empresas, planos,
  assinaturas, fábrica de IA, catálogo de produtos, auditoria e status de
  provisionamento.
- **Data Plane por produto**: cada app/produto usa um projeto Supabase próprio,
  com Auth, Storage, tabelas operacionais, Edge Functions e secrets isolados.

Projetos atuais:

| Papel | Projeto | Ref |
| --- | --- | --- |
| Control Plane | Casa Mineira SaaS | `tdbpcfwggbguxsmjnrhk` |
| Produto | Casa Mineira Serviços | `uinrmrclgzztilrtxboq` |
| Produto | Hospedagens Caminhos da Fé | `uxtqwsckvrsxjvvtdwhg` |

O Control Plane registra produtos nas tabelas:

- `saas_products`
- `saas_product_databases`
- `saas_product_provisioning_runs`

Regras:

- Build de app de produto nunca deve apontar para o Control Plane.
- Cada `clients/<slug>/client.json` deve declarar `backend.requireDedicatedSupabase`.
- Use variáveis específicas por produto, por exemplo `CASA_MINEIRA_SERVICOS_SUPABASE_URL` e `HOSPEDAGENS_CAMINHOS_SUPABASE_URL`.

## Variáveis

Frontend público:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `APP_URL`
- `PUBLIC_APP_URL`
- `EXPO_PUBLIC_APP_URL`

Backend/Edge:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EDGE_ALLOWED_ORIGINS`

Nunca configure `SUPABASE_SERVICE_ROLE_KEY` como `EXPO_PUBLIC_*` ou `NEXT_PUBLIC_*`.

## Auth

- Email/password é usado pelo app.
- Em produção, revisar no painel Supabase:
  - confirmação de e-mail;
  - SMTP real;
  - redirect URLs;
  - expiração de JWT;
  - rate limits;
  - MFA para administradores, se disponível no plano.

## Database

O schema usa migrations SQL versionadas em `supabase/migrations`.

Checklist:

- Toda tabela sensível deve ter RLS.
- Toda tabela multi-tenant deve filtrar por `tenant_id` ou helper equivalente.
- RPCs `SECURITY DEFINER` devem usar `set search_path = public`.
- Service role deve passar por validação explícita de usuário/tenant antes de gravar dados administrativos.

## Storage

Bucket principal:

- `imagens`
- leitura pública preservada para compatibilidade;
- uploads novos devem usar prefixo por usuário: `<user_id>/uploads/<arquivo>`;
- policies de insert/update/delete ficam restritas ao prefixo do usuário ou super admin.

## Realtime

Realtime está habilitado no config local. Em produção, confirme:

- tabelas publicadas em `supabase_realtime`;
- RLS das tabelas publicadas;
- ausência de colunas sensíveis no payload realtime;
- filtros no cliente, como `user_id=eq.<uid>`.

## Edge Functions

Todas as Edge Functions devem importar `supabase/functions/_shared/cors.ts`.

Configure `EDGE_ALLOWED_ORIGINS` nos Secrets do Supabase:

```text
https://casamineiraservicos.app.br,https://app.casamineiraservicos.app.br
```

Se `EDGE_ALLOWED_ORIGINS` estiver ausente, as funções entram em modo compatível e registram aviso. Esse modo é aceitável para desenvolvimento, não para produção.

## Health Check

Endpoint:

```text
/api/system/health
```

Retorna status de:

- Banco
- Supabase
- Storage
- Realtime
- Auth
- Edge Functions
- IA
- Tokens
- Workers
- Queues
- Security Center

## Security Center

Painel:

```text
Admin SaaS -> Infraestrutura -> Segurança Supabase
```

Mostra status verde/amarelo/vermelho para conexão, banco, Auth, Storage, Realtime, CORS, Edge Functions, buckets, policies, variáveis, keys, migrations, triggers e backups.

## Auditoria Automática

Script local:

```bash
npm run supabase:audit
```

Workflow diário:

```text
.github/workflows/supabase-daily-audit.yml
```

O relatório é gerado como artefato do GitHub Actions e localmente em `reports/supabase-audit-latest.json`.

## Secrets Necessários no Supabase

Configure no painel:

1. Acesse Supabase Dashboard.
2. Abra o projeto.
3. Vá em Project Settings -> Edge Functions -> Secrets.
4. Crie/atualize:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EDGE_ALLOWED_ORIGINS`
- `OPENAI_API_KEY`
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`

Opcionais se o produto usar Asaas:

- `ASAAS_API_KEY`
- `ASAAS_WEBHOOK_TOKEN`

Valor esperado para CORS:

```text
EDGE_ALLOWED_ORIGINS=https://casamineiraservicos.app.br
```

Inclua domínios white-label separados por vírgula.

## Rotação de Chaves

Não rotacione automaticamente.

Rotacione manualmente se:

- anon key apareceu em commit, print, log ou arquivo compartilhado;
- service role foi usada fora do backend;
- `.env` real foi enviado a terceiros;
- algum token de pagamento vazou;
- algum log contém bearer tokens.

Procedimento:

1. Gere nova chave no painel Supabase ou no provedor.
2. Atualize secrets no Supabase.
3. Atualize variáveis no EAS/GitHub/ambiente.
4. Faça deploy das Edge Functions.
5. Rode `/api/system/health`.
6. Rode `npm run supabase:audit`.
7. Revogue a chave antiga.

## Checklist de Produção

- `npm run check` passa.
- `npm run supabase:audit` passa.
- Migration de hardening aplicada.
- `EDGE_ALLOWED_ORIGINS` configurado.
- Service role ausente do frontend.
- RLS ativo nas tabelas sensíveis.
- Bucket `imagens` com escrita restrita por prefixo.
- Auth com SMTP e redirects de produção.
- Backups/PITR conferidos no painel.
- Health check verde ou amarelos documentados.
- Security Center acessível apenas por super admin.
