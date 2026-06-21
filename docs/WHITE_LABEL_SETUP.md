# White-Label Setup (Casa Mineira)

## 1) Aplicar migration
```bash
npx supabase db push
```

## 2) Cadastrar marcas (tenants)
Execute no SQL Editor do Supabase:

```sql
insert into public.app_branding (
  tenant_slug,
  app_name,
  slogan,
  primary_color,
  secondary_color,
  accent_color,
  active
)
values
  (
    'default',
    'Casa Mineira Serviços',
    'Conectando profissionais e clientes',
    '#facc15',
    '#020617',
    '#1e293b',
    true
  ),
  (
    'parceiro-premium',
    'Parceiro Premium Serviços',
    'Sua plataforma de serviços com alta conversão',
    '#22c55e',
    '#0b1220',
    '#1f2937',
    true
  )
on conflict (tenant_slug) do update
set
  app_name = excluded.app_name,
  slogan = excluded.slogan,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  accent_color = excluded.accent_color,
  active = excluded.active;
```

## 3) Configurar ambiente por tenant
Use um dos arquivos de exemplo:
- `.env.white-label.default.example`
- `.env.white-label.parceiro-premium.example`

Copie para `.env` antes de iniciar o app.

## 4) Rodar com tenant desejado
```bash
npm run start
```

## 5) Build dedicado por marca
Para publicar app separado por cliente/tenant, ajuste estes envs:
- `EXPO_PUBLIC_APP_NAME`
- `EXPO_PUBLIC_APP_SLUG`
- `EXPO_PUBLIC_APP_SCHEME`
- `EXPO_PUBLIC_ANDROID_PACKAGE`
- `EXPO_PUBLIC_IOS_BUNDLE_ID`
- `EXPO_PUBLIC_TENANT_SLUG`

## 6) Observações
- Se `EXPO_PUBLIC_TENANT_SLUG` não existir no banco, o app usa fallback `default`.
- O fluxo atual continua funcionando sem alterações de regra de negócio.
