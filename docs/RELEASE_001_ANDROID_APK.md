# RELEASE 001 — Android APK Hospedagens Caminhos da Fé

Data: 2026-06-30

## Objetivo

Gerar um APK instalável para testes internos Android do produto Hospedagens Caminhos da Fé.

## Escopo

- Código de negócio: não alterado.
- Banco de dados: não alterado.
- RLS: não alterado.
- Edge Functions: não alteradas.
- Mercado Pago: não alterado.

## Aptidão para build Android

- Projeto Expo/React Native com diretório nativo Android presente.
- Cliente `hospedagens-caminhos-da-fe` validado com `npm run client:validate hospedagens-caminhos-da-fe`.
- Pacote Android confirmado no APK: `br.app.hospedagenscaminhosdafe`.
- Nome do aplicativo confirmado no APK: `Hospedagens Caminhos da Fé`.
- SDK mínimo: 24.
- Target SDK: 36.
- Arquiteturas nativas no APK: `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`.

## APK gerado

- Comando: `./gradlew assembleRelease` com ambiente do cliente Hospedagens.
- Origem: `android/app/build/outputs/apk/release/app-release.apk`
- Cópia local para testes: `builds/hospedagens-caminhos-da-fe-release-001.apk`
- Tamanho: 150 MB
- SHA-256: `3525e31cc0188be40ce4a45c54d6158087cabb51193ac4517b5f3c629908efc0`
- Assinatura: verificada com APK Signature Scheme v2.
- Certificado: `CN=Casa Mineira, OU=Mobile, O=Casa Mineira, L=Itajuba, ST=MG, C=BR`

## Validações executadas

| Item | Resultado |
| --- | --- |
| `npm run lint` | Aprovado, com 6 warnings de estilo já existentes |
| `npm run typecheck` | Aprovado |
| `npm run build` | Aprovado, export web gerado em `dist` |
| `npm run client:validate hospedagens-caminhos-da-fe` | Aprovado |
| `./gradlew assembleRelease` | Aprovado |
| `aapt dump badging` | Aprovado, pacote/nome/SDK confirmados |
| `apksigner verify` | Aprovado |

## Validação de inicialização

O ambiente identificou temporariamente um dispositivo Android via `adb`:

- Device: `RQCWC01368D`

Ao tentar instalar o APK, o dispositivo deixou de aparecer para o `adb`, e não havia AVD local configurado. Por isso, a instalação e a abertura interativa do app em aparelho ficaram bloqueadas nesta execução.

Estado:

- APK instalável: validado por build, manifesto e assinatura.
- Inicialização real em dispositivo: pendente por indisponibilidade do device no momento da instalação.

## Checklist funcional

As rotas/telas do produto Hospedagens estão presentes no build, mas a confirmação funcional interativa em dispositivo ficou pendente pelo bloqueio descrito acima.

| Fluxo | Status |
| --- | --- |
| Login | Pendente de QA em dispositivo |
| Catálogo | Pendente de QA em dispositivo |
| Detalhes da pousada | Pendente de QA em dispositivo |
| Reserva | Pendente de QA em dispositivo |
| Painel | Pendente de QA em dispositivo |
| Favoritos | Pendente de QA em dispositivo |
| Notificações | Pendente de QA em dispositivo |

## Observações

- Não foram feitas correções de código para liberar o build.
- O APK não deve ser versionado no Git porque `builds/` está no `.gitignore` e o arquivo excede 100 MB, limite comum de push do GitHub.
- Para QA manual, instalar `builds/hospedagens-caminhos-da-fe-release-001.apk` em um dispositivo Android com depuração ou sideload habilitado.
