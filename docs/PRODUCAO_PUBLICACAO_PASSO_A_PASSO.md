# Publicacao Android Passo a Passo

## 1. Preencher dados de producao

Substitua os valores abaixo antes de executar:

```bash
export PROJECT_REF="SEU_PROJECT_REF"
export SUPABASE_URL="https://SEU_PROJECT_REF.supabase.co"
export SUPABASE_ANON_KEY="SUA_ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY"
```

## 2. Validar o app localmente

```bash
npm run release:check
```

## 3. Conectar no Supabase

```bash
npx supabase login
npx supabase link --project-ref "$PROJECT_REF"
```

## 4. Aplicar banco em producao

```bash
npm run release:supabase:push
```

Isso aplica tambem a migration de exclusao de conta:

- `20260324110000_account_deletion_requests.sql`

## 5. Configurar secrets da edge function

```bash
npx supabase secrets set \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
```

## 6. Fazer deploy da function de exclusao de conta

```bash
npm run release:supabase:deploy-delete-account
```

## 7. Gerar build Android de producao

```bash
npx eas login
npm run release:android
```

## 8. Enviar para a Play Console

```bash
npm run release:submit:android
```

## 9. Checklist antes de apertar Publish

- Politica de privacidade publicada em URL publica.
- Data safety preenchido.
- Exclusao de conta declarada na Play Console.
- Screenshots e descricao cadastradas.
- Teste em faixa interna ou fechada concluido.
- Fluxos criticos validados:
  - cadastro/login
  - criacao de pedido
  - pagamento
  - push notification
  - exclusao de conta

## 10. Comandos uteis

Ver build profiles:

```bash
cat eas.json
```

Ver config final do app:

```bash
npx expo config --type public
```

Ver functions do Supabase:

```bash
npx supabase functions list
```
