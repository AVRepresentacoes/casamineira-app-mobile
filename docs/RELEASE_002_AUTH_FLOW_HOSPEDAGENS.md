# RELEASE 002 — Auth Flow Hospedagens Caminhos da Fé

Data: 2026-06-30

## Objetivo

Corrigir o fluxo inicial de autenticação do APK Hospedagens Caminhos da Fé para impedir aparência de usuário logado sem sessão Supabase válida.

## Escopo

- Código de negócio: alterado apenas no fluxo de autenticação e proteção de rotas.
- Visual: sem alteração intencional de layout.
- Banco de dados: não alterado.
- RLS: não alterado.
- Edge Functions: não alteradas.
- Mercado Pago: não alterado.

## Diagnóstico

Origem do comportamento:

- O APK Hospedagens sem sessão era roteado para `/hospedagens`, a home pública.
- A tela de perfil podia abrir sem sessão válida e usava cache local de perfil.
- O nome visual `Cliente peregrino` era fallback local da tela de perfil, dando aparência de usuário autenticado.
- Algumas telas protegidas chamavam dados do usuário antes de validar sessão no cliente.

## Correções

- Adicionado `lib/hospedagensAuth.ts` com:
  - validação de sessão via `supabase.auth.getSession()` e `supabase.auth.getUser()`;
  - limpeza de cache local inválido de perfil Hospedagens;
  - guard `useRequireHospedagensAuth`;
  - `redirectTo` seguro para retorno após login.
- Ajustado o roteamento inicial do APK Hospedagens:
  - sem sessão: abre `/(auth)/login`;
  - com sessão válida: segue para fluxo normal.
- Ajustado login Hospedagens para voltar ao destino protegido quando houver `redirectTo`.
- Removido fallback visual `Cliente peregrino` da tela de perfil.
- Cache antigo com nome `Cliente peregrino` é limpo ao carregar perfil autenticado.
- Favorito na tela pública de detalhe exige sessão antes de salvar.

## Rotas protegidas

As seguintes rotas agora exigem sessão autenticada válida:

- `/hospedagens/perfil`
- `/hospedagens/minhas`
- `/hospedagens/reservar`
- `/hospedagens/pagar`
- `/hospedagens/rota`
- `/hospedagens/notificacoes`
- `/hospedagens/suporte`
- `/hospedagens/suporte-pousada`
- `/hospedagens/pousada`
- `/hospedagens/admin`
- `/hospedagens/avaliar`
- Fluxo de favoritos no detalhe da pousada

## Rotas públicas mantidas

- `/hospedagens`
- `/hospedagens/[id]`
- `/hospedagens/politicas-cliente`
- `/hospedagens/politicas-pousada`
- `/hospedagens/sobre`

## APK gerado

- Arquivo: `builds/hospedagens-caminhos-da-fe-release-002.apk`
- Tamanho: 150 MB
- SHA-256: `e0a692063ae3e3d218f24b82094a192459c57924bab88c1ee4577a906eb2e580`
- Pacote Android: `br.app.hospedagenscaminhosdafe`
- App label: `Hospedagens Caminhos da Fé`
- Assinatura: verificada com APK Signature Scheme v2.

## Validações

| Comando | Resultado |
| --- | --- |
| `npm run lint` | Aprovado, com 6 warnings de estilo já existentes |
| `npm run typecheck` | Aprovado |
| `npm run build` | Aprovado |
| `npm run client:validate hospedagens-caminhos-da-fe` | Aprovado |
| `./gradlew assembleRelease` | Aprovado |
| `aapt dump badging builds/hospedagens-caminhos-da-fe-release-002.apk` | Aprovado |
| `apksigner verify builds/hospedagens-caminhos-da-fe-release-002.apk` | Aprovado |

## QA esperado no aparelho

- Abrir app sem sessão válida deve exibir login.
- Perfil sem sessão deve redirecionar para login.
- Reserva/pagamento sem sessão devem redirecionar para login e retornar ao fluxo após autenticação.
- Perfil autenticado deve mostrar email/nome real ou estado autenticado neutro, sem `Cliente peregrino`.
- Catálogo e detalhe da pousada seguem acessíveis como conteúdo público.
