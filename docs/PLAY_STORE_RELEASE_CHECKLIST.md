# Play Store Release Checklist

## Bloqueadores de publicacao
- Aplicar todas as migrations em producao, incluindo `20260324110000_account_deletion_requests.sql`.
- Fazer deploy da edge function `delete-account`.
- Configurar os secrets da function:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Gerar um build Android `production` e validar em aparelho real.
- Confirmar o fluxo de exclusao de conta no app publicado.

## Configuracao Android
- Revisar o `applicationId` final publicado: `br.app.casamineiraservicos`.
- Confirmar que a chave de upload da Play esta guardada fora do repositório e vinculada ao app correto.
- Validar as permissoes declaradas:
  - Localizacao para busca de profissionais/lojas proximas.
  - Notificacoes push.
- Garantir que o app nao pede permissoes que nao usa.

## Backend e operacao
- Aplicar `supabase db push` em producao.
- Fazer deploy das edge functions de pagamento e webhook.
- Testar webhooks Mercado Pago/Asaas em ambiente de producao.
- Confirmar que todas as variaveis `EXPO_PUBLIC_*` de producao estao preenchidas no build.

## Play Console
- Publicar a Politica de Privacidade em URL publica.
- Preencher a secao de exclusao de conta com o caminho dentro do app.
- Preencher Data safety com base em localizacao, cadastro, pagamentos e notificacoes.
- Subir screenshots, icone de alta resolucao e descricao curta/completa.
- Publicar primeiro em faixa interna ou fechada.

## Validacao final
- Cadastro e login.
- Criacao de pedido.
- Envio e aceite de proposta.
- Pagamento completo com retorno de webhook.
- Push notification em Android release.
- Exclusao de conta concluida com sucesso.
