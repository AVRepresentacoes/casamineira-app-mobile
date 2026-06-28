# Matriz de Implementacao Real Hospedagens Caminhos da Fe

Casa Mineira SaaS - GO LIVE 001

## Ambiente

Auditoria e ajustes executados localmente. Nenhum comando foi executado contra producao. Nenhuma policy RLS foi alterada. Nenhuma tabela foi movida ou apagada.

## Resumo

O fluxo principal de Hospedagens deixou de depender dos arrays locais de demonstracao para catalogo, detalhe, reserva, minhas reservas, painel da pousada, admin, chamados e notificacoes.

Origem oficial do fluxo GO LIVE:

```text
Supabase
-> caminho_hospedagem_pousadas
-> caminho_hospedagem_quartos
-> caminho_hospedagem_servicos
-> caminho_hospedagem_disponibilidade
-> caminho_hospedagem_reservas
-> painel da pousada
```

## Matriz por area

| Area | Arquivo(s) | Status | Evidencia |
| --- | --- | --- | --- |
| Home/catalogo | `app/hospedagens/index.tsx`, `lib/caminhosHospedagens.ts` | REAL | Usa `listarCatalogoHospedagens()` e consulta Supabase. |
| Detalhe da pousada | `app/hospedagens/[id].tsx` | REAL | Usa `obterHospedagemPublicaPorId()` e dados de quartos/servicos reais. |
| Reserva | `app/hospedagens/reservar.tsx`, `lib/caminhosHospedagens.ts` | REAL | Cria apenas em `caminho_hospedagem_reservas`; fallback local foi removido. |
| Disponibilidade | `lib/caminhosHospedagens.ts` | PARCIAL | Valida dias `livre` em `caminho_hospedagem_disponibilidade`; ainda nao ha disponibilidade por quarto. |
| Pagamento PIX/cartao | `app/hospedagens/pagar.tsx`, `supabase/functions/create-caminho-hospedagem-pix-payment` | PARCIAL | Cria pagamento Mercado Pago se secrets reais existirem; Asaas segue nao ativado. |
| Webhook Mercado Pago | `supabase/functions/mercadopago-webhook/index.ts` | REAL/PARCIAL | Agora reconhece `caminho_hospedagem:{reservaId}` e confirma reserva; precisa validacao com evento real. |
| Painel da pousada | `app/hospedagens/pousada.tsx`, `lib/caminhosHospedagens.ts` | REAL | Carrega pousada/quartos/servicos/disponibilidade/reservas do Supabase. |
| Cadastro de pousada | `app/hospedagens/pousada.tsx`, `lib/caminhosHospedagens.ts` | REAL | Ao entrar como pousada, cria registro real pendente se nao existir. |
| Cadastro de quartos | `app/hospedagens/pousada.tsx`, `lib/caminhosHospedagens.ts` | REAL | Insere em `caminho_hospedagem_quartos`. |
| Cadastro de disponibilidade | `app/hospedagens/pousada.tsx`, `lib/caminhosHospedagens.ts` | REAL | Upsert em `caminho_hospedagem_disponibilidade`. |
| Servicos adicionais | `app/hospedagens/pousada.tsx`, `lib/caminhosHospedagens.ts` | PARCIAL | Atualiza preco dos servicos existentes; criacao completa de servicos novos nao foi ampliada nesta sprint. |
| Minhas hospedagens | `app/hospedagens/minhas.tsx`, `lib/caminhosHospedagens.ts` | REAL | Lista reservas reais do usuario; sem fallback para reservas demo. |
| Favoritos | `app/hospedagens/[id].tsx`, `app/hospedagens/rota.tsx`, `lib/caminhosHospedagens.ts` | REAL | Usa `caminho_hospedagem_favoritos`. |
| Avaliacoes | `app/hospedagens/avaliar.tsx`, `lib/caminhosHospedagens.ts` | REAL | Usa `caminho_hospedagem_avaliacoes` e RLS de publicadas/proprias. |
| Chamados | `app/hospedagens/suporte.tsx`, `app/hospedagens/suporte-pousada.tsx`, `lib/caminhosHospedagens.ts` | REAL | Usa `caminho_hospedagem_chamados`; sem chamados demo. |
| Notificacoes | `app/hospedagens/notificacoes.tsx`, `lib/caminhosHospedagens.ts` | REAL | Usa `caminho_hospedagem_notificacoes`; sem notificacao demo para anon. |
| Admin Hospedagens | `app/hospedagens/admin.tsx`, `lib/caminhosHospedagens.ts` | REAL | Usa Supabase e retorna vazios reais quando nao ha dados. |
| Perfil peregrino | `app/hospedagens/perfil.tsx` | PARCIAL | Dados de usuario/reservas reais; cache local AsyncStorage permanece para preferencias de perfil. |
| Km percorridos | `app/hospedagens/km.tsx` | PARCIAL | Mostra etapas reais registradas; km por rota aguarda campo real no banco. |
| Storage fotos | `lib/uploadImage.ts`, migration de storage | PARCIAL | Upload real no bucket `imagens`; ownership por pousada ainda deve ser endurecido futuramente. |

## Origem de dados removida do fluxo

- Arrays locais de pousadas demonstrativas removidos do fluxo de Home/Detalhe/Reserva.
- Fallback de `MINHAS_RESERVAS_HOSPEDAGENS_DEMO` removido.
- Fallback de reserva local em AsyncStorage removido.
- Auto-seed de quartos/servicos/reservas ficticios no painel da pousada removido.
- Fallback demo do admin/chamados/notificacoes removido.

## Origem local mantida

- Assets visuais em `CAMINHOS_ASSETS`: imagens/branding, nao dados de negocio.
- AsyncStorage em perfil: cache local de preferencias do peregrino, nao origem de reserva/catalogo/pagamento.
- Trava contra `reservaId` com prefixo `local-`: apenas bloqueia pagamentos antigos locais.

## Lacunas ainda parciais

- Disponibilidade ainda e por pousada/dia, nao por quarto/dia.
- Criacao completa de novos servicos adicionais no painel nao foi ampliada nesta sprint.
- Pagamento real depende de secrets Mercado Pago e evento externo para validar webhook em ambiente real.
- Asaas permanece nao ativado para Hospedagens.
- Km por etapa precisa campo real de rota/distancia no banco.
