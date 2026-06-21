# Release Go-Live Checklist

## 1) Pré-requisitos de ambiente
- Definir `.env` de produção:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_FIREBASE_API_KEY`
  - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
  - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `EXPO_PUBLIC_FIREBASE_APP_ID`
  - `EXPO_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`
  - `EXPO_PUBLIC_PAYMENT_PROVIDER` (`mercadopago` ou `asaas`)

## 2) Qualidade de código
- Executar:
  - `npm run check`
  - `npx expo export --platform android`

## 3) Supabase
- Aplicar migrations em produção.
- Deploy de edge functions:
  - `create-mercadopago-preference`
  - `create-mercadopago-card-payment`
  - `create-mercadopago-pix-payment`
  - `mercadopago-webhook`
  - `create-asaas-pix-payment` (se PIX via Asaas)
  - `asaas-webhook` (se PIX via Asaas)
- Confirmar secrets nas functions:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `MERCADO_PAGO_ACCESS_TOKEN`
  - `MERCADOPAGO_WEBHOOK_SECRET` (recomendado)
  - `ASAAS_API_KEY` (se PIX via Asaas)
  - `ASAAS_WEBHOOK_TOKEN` (recomendado)
  - `APP_SCHEME`

### Comandos (terminal)
```bash
# 1) login e link do projeto
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF

# 2) aplicar migrations em producao
npx supabase db push

# 3) configurar secrets usados nas functions
npx supabase secrets set \
  SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co \
  SUPABASE_ANON_KEY=SUA_ANON_KEY \
  SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY \
  MERCADO_PAGO_ACCESS_TOKEN=SEU_MP_ACCESS_TOKEN \
  MERCADOPAGO_WEBHOOK_SECRET=SEU_WEBHOOK_SECRET_MP \
  ASAAS_API_KEY=SUA_API_KEY_ASAAS \
  ASAAS_WEBHOOK_TOKEN=SEU_TOKEN_WEBHOOK_ASAAS \
  APP_SCHEME=casamineira://

# 4) deploy das functions
npx supabase functions deploy create-mercadopago-preference
npx supabase functions deploy create-mercadopago-card-payment
npx supabase functions deploy create-mercadopago-pix-payment
npx supabase functions deploy mercadopago-webhook --no-verify-jwt
npx supabase functions deploy create-asaas-pix-payment
npx supabase functions deploy asaas-webhook --no-verify-jwt
```

## 4) Fluxo crítico (teste manual)
- Cadastro cliente e profissional.
- Criação de pedido.
- Criação de pedido em modo `Atendimento rápido` e aceite único por profissional.
- Envio de proposta pelo profissional.
- Aceite da proposta pelo cliente.
- Início de pagamento Mercado Pago.
- Webhook atualizando `pagamentos`, `comissoes` e status do pedido.
- Chat liberado após proposta aceita.

## 5) Publicação
- Gerar build assinado.
- Teste final em dispositivo real.
- Publicar em faixa interna/fechada primeiro.
- Monitorar erros e webhook nas primeiras 24h.
