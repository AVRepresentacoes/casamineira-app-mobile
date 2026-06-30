# Clientes e Produtos SaaS White-Label

## Separacao oficial

`clients/<slug>/product.json` descreve o limite estrategico de cada produto:

- `cms-platform`: Casa Mineira SaaS / CMS Platform, o Control Plane.
- `casa-mineira-servicos`: produto independente Casa Mineira Servicos.
- `hospedagens-caminhos-da-fe`: produto independente Hospedagens Caminhos da Fe.

`clients/<slug>/client.json` continua sendo a configuracao operacional usada pelos scripts de build/app white-label. A pasta historica `clients/casa-mineira` permanece por compatibilidade e representa o app operacional Casa Mineira Servicos ate uma migracao controlada de slug.

Cada cliente com app próprio tem uma pasta `clients/<slug>/client.json`.

## Criar Cliente

```bash
npm run client:create super-servicos-belem -- --name "Super Serviços Belém"
```

Isso cria:

- `clients/super-servicos-belem/client.json`
- `clients/super-servicos-belem/provision.sql`

Execute o `provision.sql` no SQL Editor do Supabase com um usuário `super_admin`.

## Validar

```bash
npm run client:validate super-servicos-belem
```

## Rodar No Celular

```bash
npm run client:android super-servicos-belem
```

## Subir Metro Do Cliente

```bash
npm run client:start super-servicos-belem
```

## Abrir No Celular Com Metro Já Aberto

```bash
npm run client:open super-servicos-belem -- --port 8083
```

## Build Android Produção

```bash
npm run client:build:android super-servicos-belem
```

## Publicar Android

```bash
npm run client:submit:android super-servicos-belem
```

## Campos Importantes

- `tenantSlug`: deve existir em `public.tenants.slug`.
- `lockTenant`: quando `true`, o app força o tenant do build.
- `androidPackage`: precisa ser único para cada app na Play Store.
- `iosBundleId`: precisa ser único para cada app na App Store.
- `backend.requireDedicatedSupabase`: quando `true`, bloqueia o cliente até informar um Supabase próprio.
- `backend.supabaseUrl` e `backend.supabaseAnonKey`: apontam o app para o banco/Auth isolado do cliente.
- `assets.icon`: ícone local usado pelo Expo.
- `assets.logoUrl`: URL pública usada no branding remoto.
