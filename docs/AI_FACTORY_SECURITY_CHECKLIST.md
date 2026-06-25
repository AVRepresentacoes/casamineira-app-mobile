# Checklist de Produção da Fábrica IA

## Secrets

- `OPENAI_API_KEY` configurada apenas em Supabase secrets.
- `SUPABASE_SERVICE_ROLE_KEY` configurada apenas em Edge Functions e ambiente local controlado.
- Nenhuma chave privada com prefixo `EXPO_PUBLIC`.

## Limites e Custos

- `AI_FACTORY_DRY_RUN=true` em ambientes que não devem gastar tokens.
- `AI_FACTORY_DAILY_RUN_LIMIT` revisado por plano/tenant.
- `AI_FACTORY_MAX_PROMPT_CHARS` definido para evitar payloads excessivos.
- `AI_FACTORY_INPUT_COST_BRL_PER_1K` e `AI_FACTORY_OUTPUT_COST_BRL_PER_1K` revisados mensalmente.
- Monitorar `ai_factory_runs.estimated_cost_brl`.

## Auditoria

- Revisar `ai_factory_audit_logs` para runs reais, negações e geração de artefatos.
- Conferir `ip_address`, `user_agent`, `user_id`, `tenant_id` e `run_id`.
- Manter eventos de aprovação antes de materializar artefatos.

## LGPD e Segurança

- Orientar operadores a não inserir dados sensíveis desnecessários no prompt.
- Validar políticas RLS de `ai_factory_runs`, `ai_factory_agent_logs`, `ai_factory_artifacts` e `ai_factory_audit_logs`.
- Revisar política de retenção de prompts e resultados antes de produção regulada.
- Não executar SQL gerado sem revisão humana.

## Publicação

```bash
supabase functions deploy ai-orchestrator
supabase functions deploy ai-factory-artifacts
npm run typecheck
npm run lint
```

Aplicar a migration `20260624120000_ai_factory_foundation.sql` antes de usar o painel.
