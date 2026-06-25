# Production hardening P0/P1

Este checklist guarda os bloqueios minimos para publicar uma versao seria do SaaS Casa Mineira.

## P0 - obrigatorio antes de publicar

- Rodar `npm run check` localmente e exigir a mesma checagem no GitHub Actions.
- Configurar Supabase secrets por ambiente:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `EDGE_ALLOWED_ORIGINS`
  - tokens de pagamento usados no ambiente
  - `OPENAI_API_KEY`, se a fabrica de IA estiver fora de dry-run
- Usar `EDGE_ALLOWED_ORIGINS` com dominios reais em producao. Use `*` apenas em desenvolvimento.
- Manter anon keys fora de `client.json`, codigo-fonte e scripts versionados. Para white-labels, use `supabaseUrlEnv` e `supabaseAnonKeyEnv`.
- Rotacionar qualquer chave que ja tenha sido enviada a terceiros, logs, prints ou commits.
- Conferir que `.env` real nunca entra no git.
- Testar exclusao de conta ponta a ponta antes do envio para Google Play e Apple.

## P1 - primeira semana de producao

- Adicionar monitoramento de erros em app e Edge Functions.
- Criar alertas para falha de webhook, erro de pagamento e falha de IA.
- Executar teste manual de isolamento multi-tenant: usuario de um tenant nao pode ler, editar ou apagar dados de outro.
- Fazer restore drill de backup Supabase.
- Documentar rollback de app, banco e Edge Functions.
- Preencher Google Play Data Safety e App Store Privacy com base no inventario real de SDKs e dados.
- Revisar todos os webhooks com assinatura, idempotencia e replay protection.

## Release gate

Uma release so deve seguir quando:

- `npm run check` passa.
- O workflow `CI` passa no GitHub.
- O workflow `Security Smoke` passa no GitHub.
- `EDGE_ALLOWED_ORIGINS` esta configurado no projeto Supabase de producao.
- A versao de loja tem politica de privacidade, URL de suporte e fluxo de exclusao de conta funcionando.
