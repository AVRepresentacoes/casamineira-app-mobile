# Operação SaaS e White-Label

## Fluxos

### Fábrica de IA Com Aprovação Humana

1. Entre em `/(saas)/fabrica-ia`.
2. Execute a fábrica em `dryRun` para validar briefing, estratégia, marketing, automações e preço.
3. Revise a run e aprove somente quando o escopo estiver correto.
4. Gere os artefatos white-label.
5. Revise `clients/<slug>/client.json`, `clients/<slug>/provision.sql` e `clients/<slug>/ai-factory-manifest.json` no painel.
6. Só depois da revisão operacional, materialize os arquivos no repositório e use os comandos `client:*`.

Os artefatos da IA são gerados no backend e salvos em `ai_factory_artifacts`. A plataforma não escreve automaticamente em `clients/` e não executa build sem aprovação humana.

Para materializar localmente uma run aprovada:

```bash
npm run ai-factory:list -- <run_id>
npm run ai-factory:export -- <run_id>
npm run ai-factory:export -- <run_id> --write --validate
```

O primeiro `export` é apenas simulação. A escrita real exige `--write` e só aceita caminhos dentro de `clients/`. O build continua manual:

```bash
npm run client:build:android <slug>
```

Antes de produção, revise também `docs/AI_FACTORY_SECURITY_CHECKLIST.md`.

### Cliente SaaS Sem App Próprio

1. Entre em `/admin/empresas`.
2. Crie a empresa com nome e slug.
3. Configure plano, assinatura, status, branding e admin da empresa.
4. O cliente acessa o app principal e enxerga apenas o tenant dele.

### Cliente Com App Próprio

1. Crie o manifesto local:

```bash
npm run client:create super-servicos-belem -- --name "Super Serviços Belém"
```

2. Ajuste `clients/super-servicos-belem/client.json`.
3. Gere/atualize o SQL:

```bash
npm run client:sql super-servicos-belem
```

4. Execute `clients/super-servicos-belem/provision.sql` no Supabase.
5. Valide:

```bash
npm run client:validate super-servicos-belem
```

6. Teste no Android:

```bash
npm run client:android super-servicos-belem
```

7. Gere produção:

```bash
npm run client:build:android super-servicos-belem
```

8. Publique:

```bash
npm run client:submit:android super-servicos-belem
```

## Tenant Lock

Apps white-label usam:

```text
EXPO_PUBLIC_TENANT_SLUG
EXPO_PUBLIC_LOCK_TENANT=true
```

Quando o usuário abre o app, o código chama `ensure_app_tenant_context`. Essa função:

- valida se o tenant existe e está ativo;
- define o tenant como padrão do usuário;
- impede fallback silencioso para outro tenant quando `lockTenant` está ativo;
- permite cadastro público quando `tenants.public_signup_enabled = true`.

## Checklist Por Cliente

- Slug único em `tenants.slug`.
- `androidPackage` único.
- `iosBundleId` único.
- Ícone em 1024x1024.
- Splash e adaptive icon revisados.
- Política de privacidade pública.
- Textos da Play Store.
- Screenshots do app do cliente.
- Plano e assinatura configurados.
- Admin da empresa atribuído.
- `public_signup_enabled` revisado.
- Webhooks/pagamentos revisados se o cliente usar conta própria.

## Comandos Úteis

```bash
npm run client:list
npm run client:env super-servicos-belem
npm run client:sql super-servicos-belem
npm run client:start super-servicos-belem
npm run client:build:android super-servicos-belem
```
