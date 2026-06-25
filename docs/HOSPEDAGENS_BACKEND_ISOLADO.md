# Backend isolado - Hospedagens Caminhos da Fé

O app Hospedagens Caminhos da Fé deve usar um projeto Supabase próprio para produção.

## Projeto criado

- Projeto Supabase: `uxtqwsckvrsxjvvtdwhg`
- URL: `https://uxtqwsckvrsxjvvtdwhg.supabase.co`
- Organizacao: `Casa Mineira Serviços`
- Regiao: Sao Paulo (`sa-east-1`)
- Status inicial: banco bootstrap aplicado e Edge Function publicada

## Regra

Não compartilhar com Casa Mineira Serviços:

- Auth/users
- Banco de dados
- Storage
- Edge Functions
- Chaves de pagamento
- Webhooks
- Logs e auditoria

## Configuração do cliente

Preencha em `clients/hospedagens-caminhos-da-fe/client.json`:

```json
"backend": {
  "requireDedicatedSupabase": true,
  "supabaseUrl": "https://PROJECT_REF.supabase.co",
  "supabaseAnonKey": "SUA_ANON_KEY",
  "forbiddenSupabaseRefs": [
    "uinrmrclgzztilrtxboq",
    "cgmnchgujdmbfludqunq"
  ]
}
```

Enquanto esses campos estiverem vazios, os comandos do cliente devem falhar de propósito.
Se algum campo apontar para um projeto conhecido da Casa Mineira, a validação também deve falhar.

## Passos para ativar

1. Criar um novo projeto no Supabase só para Hospedagens Caminhos da Fé. Concluido em `uxtqwsckvrsxjvvtdwhg`.
2. Rodar as migrations nesse novo projeto. Concluido com `clients/hospedagens-caminhos-da-fe/supabase`.
3. Fazer deploy das Edge Functions nesse novo projeto. Concluido para `create-caminho-hospedagem-pix-payment`.
4. Configurar secrets de pagamento apenas nesse projeto.
5. Preencher `supabaseUrl` e `supabaseAnonKey` no `client.json`.
6. Rodar `npm run client:validate hospedagens-caminhos-da-fe`.

## Manutencao do banco isolado

O arquivo local `.hospedagens-backend.local` guarda a senha do banco gerada para operacao pela CLI. Ele e ignorado pelo Git e nao deve usar prefixo `.env` para nao entrar no carregamento do Expo/Metro.

Dry-run:

```bash
. ./.hospedagens-backend.local
ENC_PASS="$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$HOSPEDAGENS_SUPABASE_DB_PASSWORD")"
DB_URL="postgresql://postgres:${ENC_PASS}@db.uxtqwsckvrsxjvvtdwhg.supabase.co:5432/postgres"
supabase db push --db-url "$DB_URL" --workdir clients/hospedagens-caminhos-da-fe --dry-run
```

Aplicar migrations:

```bash
. ./.hospedagens-backend.local
ENC_PASS="$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$HOSPEDAGENS_SUPABASE_DB_PASSWORD")"
DB_URL="postgresql://postgres:${ENC_PASS}@db.uxtqwsckvrsxjvvtdwhg.supabase.co:5432/postgres"
supabase db push --db-url "$DB_URL" --workdir clients/hospedagens-caminhos-da-fe --yes
```

Deploy da function:

```bash
supabase functions deploy create-caminho-hospedagem-pix-payment \
  --project-ref uxtqwsckvrsxjvvtdwhg \
  --use-api
```

## Projetos bloqueados

Os refs abaixo pertencem ao ecossistema Casa Mineira e não devem ser usados pelo Hospedagens:

- `uinrmrclgzztilrtxboq`
- `cgmnchgujdmbfludqunq`
