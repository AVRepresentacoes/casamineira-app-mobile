# Platform Separation Strategy

Casa Mineira SaaS - Program Platform Separation 001

## 1. Resumo executivo

A Casa Mineira passa a ser tratada oficialmente como um ecossistema com tres superficies distintas:

1. **Casa Mineira SaaS / CMS Platform**: Control Plane da plataforma.
2. **Casa Mineira Servicos**: produto independente para marketplace de servicos.
3. **Hospedagens Caminhos da Fe**: produto independente para pousadas, quartos, reservas e pagamentos.

Esta sprint nao alterou banco, RLS, pagamentos, Supabase, DNS, Vercel, dados ou rotas existentes. O trabalho foi de auditoria, configuracao estrategica e documentacao.

## 2. Por que separar plataforma e produtos

A marca historica Casa Mineira misturava tres contextos no mesmo repositorio:

- administracao da plataforma SaaS;
- operacao do marketplace Casa Mineira Servicos;
- operacao vertical de Hospedagens Caminhos da Fe.

Separar esses limites reduz risco de:

- uma mudanca de Control Plane afetar produto final;
- billing SaaS ser confundido com pagamento operacional;
- login/admin de plataforma ser usado como entrada de produto;
- branding, dominio e deploy ficarem ambiguuos;
- futuras migrations misturarem governanca com operacao.

Regra permanente: **o Control Plane orquestra; os Product Apps operam.**

## 3. Control Plane vs Product Apps

### Control Plane

Responsavel por:

- tenants;
- empresas;
- usuarios administrativos;
- Business DNA;
- marketplace de templates;
- planos e billing SaaS;
- AI Factory;
- apps gerados;
- auditoria;
- governanca de produtos.

O Control Plane deve saber que produtos existem e qual o estado deles, mas nao deve depender diretamente das tabelas operacionais de cada produto para renderizar a sua experiencia principal.

### Product Apps

Responsaveis por:

- jornadas finais de usuario;
- operacao diaria;
- pagamentos operacionais;
- paineis especificos do produto;
- dados transacionais do dominio.

Casa Mineira Servicos e Hospedagens Caminhos da Fe devem evoluir como Product Apps independentes, com branding, dominio e deploy proprios.

## 4. Mapa de rotas atual

### A. Plataforma SaaS

Rotas identificadas como Control Plane ou experiencia SaaS:

| Prefixo/rota | Classificacao | Observacao |
| --- | --- | --- |
| `/admin/*` | Plataforma SaaS | Admin de empresas, usuarios, metricas, planos e assinaturas. |
| `/(saas)/*` | Plataforma SaaS | Area SaaS multi-tenant. |
| `/(site)/*` | Plataforma SaaS | Site comercial da plataforma. |
| `/dashboard` | Plataforma SaaS | Dashboard principal SaaS. |
| `/business-dna/*` | Plataforma SaaS | Business DNA. |
| `/business-studio` | Plataforma SaaS | Studio estrategico. |
| `/apps`, `/apps/*` | Plataforma SaaS | Apps/projetos gerados. |
| `/ai-app-generator` | Plataforma SaaS | Gerador de apps. |
| `/ai-business-consultant` | Plataforma SaaS | Consultoria IA. |
| `/ai-solution-architect` | Plataforma SaaS | Arquitetura IA. |
| `/ai-workforce` | Plataforma SaaS | Workforce IA. |
| `/billing` | Plataforma SaaS | Billing SaaS. |
| `/assinatura` | Plataforma SaaS | Assinatura SaaS. |
| `/projects/*` | Plataforma SaaS | Projetos/modulos da plataforma. |
| `/settings` | Plataforma SaaS | Configuracoes de conta SaaS. |
| `/register` | Plataforma SaaS | Cadastro SaaS. |
| `/forgot-password` | Compartilhado com branding SaaS | Recuperacao de conta. |

### B. Produto Casa Mineira Servicos

Rotas identificadas como produto operacional de servicos:

| Prefixo/rota | Classificacao | Observacao |
| --- | --- | --- |
| `/(cliente)/pedidos/*` | Casa Mineira Servicos | Jornada do cliente, pedidos, propostas, pagamento e avaliacao. |
| `/(profissional)/*` | Casa Mineira Servicos | Jornada profissional/prestador. |
| `/(fornecedor)/*` | Casa Mineira Servicos | Jornada fornecedor. |
| `/(tabs)/*` | Casa Mineira Servicos | App principal mobile legado: marketplace, pedidos, perfil, carrinho. |
| `/categorias/*` | Casa Mineira Servicos | Fluxo de solicitacao por categoria. |
| `/profissionais/*` | Casa Mineira Servicos | Busca/painel/chat de profissionais. |
| `/portal-fornecedor/*` | Casa Mineira Servicos | Portal operacional do fornecedor. |
| `/marketplace/*` | Casa Mineira Servicos | Marketplace operacional. |
| `/lojas/*` via `/(tabs)/lojas` | Casa Mineira Servicos | Lojas e produtos de fornecedores. |
| `/pagamento/*` | Compartilhado/Servicos | Retorno generico de pagamento, atualmente usado por fluxos operacionais. |
| `/app-servicos` | Casa Mineira Servicos | Entrada explicita do app operacional. |
| `/convite-profissional` | Casa Mineira Servicos | Convite/onboarding profissional. |
| `/convites-profissionais` | Casa Mineira Servicos | Operacao profissional. |

### C. Produto Hospedagens Caminhos da Fe

Rotas identificadas como produto independente de Hospedagens:

| Prefixo/rota | Classificacao | Observacao |
| --- | --- | --- |
| `/hospedagens` | Hospedagens Caminhos da Fe | Catalogo publico. |
| `/hospedagens/[id]` | Hospedagens Caminhos da Fe | Detalhe de pousada. |
| `/hospedagens/reservar` | Hospedagens Caminhos da Fe | Criacao de reserva. |
| `/hospedagens/pagar` | Hospedagens Caminhos da Fe | Pagamento de reserva. |
| `/hospedagens/minhas` | Hospedagens Caminhos da Fe | Reservas do peregrino. |
| `/hospedagens/pousada` | Hospedagens Caminhos da Fe | Painel da pousada. |
| `/hospedagens/admin` | Hospedagens Caminhos da Fe | Admin operacional do produto. |
| `/hospedagens/avaliar` | Hospedagens Caminhos da Fe | Avaliacoes. |
| `/hospedagens/suporte` | Hospedagens Caminhos da Fe | Chamados do peregrino. |
| `/hospedagens/suporte-pousada` | Hospedagens Caminhos da Fe | Suporte da pousada. |
| `/hospedagens/notificacoes` | Hospedagens Caminhos da Fe | Notificacoes in-app. |
| `/hospedagens/perfil` | Hospedagens Caminhos da Fe | Perfil do peregrino. |
| `/hospedagens/rota` | Hospedagens Caminhos da Fe | Rota/favoritos. |
| `/hospedagens/gastos` | Hospedagens Caminhos da Fe | Gastos do peregrino. |
| `/hospedagens/km` | Hospedagens Caminhos da Fe | Km percorridos. |
| `/hospedagens/politicas-cliente` | Hospedagens Caminhos da Fe | Politicas do peregrino. |
| `/hospedagens/politicas-pousada` | Hospedagens Caminhos da Fe | Politicas da pousada. |
| `/hospedagens/sobre` | Hospedagens Caminhos da Fe | Sobre o produto. |

### D. Compartilhado

Rotas e recursos compartilhados:

| Prefixo/rota | Classificacao | Observacao |
| --- | --- | --- |
| `/(auth)/login` | Compartilhado | Login com tenant lock quando o app e Hospedagens. |
| `/(auth)/trocar-perfil` | Compartilhado | Troca de perfil/contexto. |
| `/(auth)/onboarding-empresa` | Plataforma SaaS/Compartilhado | Onboarding de empresa SaaS. |
| `/meus-dados` via tabs | Compartilhado/Servicos | Dados de conta no app operacional. |
| `/ajuda`, `/central-ajuda` | Compartilhado | Suporte geral. |
| `/politica-privacidade` | Compartilhado | Legal/privacidade. |
| `/exclusao-de-conta` | Compartilhado | LGPD/conta. |
| `/api/system/health` | Compartilhado | Diagnostico tecnico. |
| `app/_layout.tsx` | Compartilhado | Inicializacao global. |

### E. Legado

Rotas/contextos a manter sem quebra ate migracao:

| Item | Classificacao | Observacao |
| --- | --- | --- |
| `clients/casa-mineira` | Legado/Servicos | Client config historico do app Casa Mineira Servicos. |
| `tenantSlug = default` | Legado/Compartilhado | Ainda usado como default do app principal. |
| `/(tabs)` | Legado/Servicos | App mobile historico de servicos. |
| `/gas`, `/gas-checkout` | Legado/Servicos | Fluxos operacionais antigos dentro do app. |
| `/lojas`, `/compras`, `/carrinho` | Legado/Servicos | Marketplace/loja operacional herdado. |

## 5. Mapa de rotas alvo

### CMS Platform

Dominios de plataforma devem servir:

- `/login`;
- `/dashboard`;
- `/admin/*`;
- `/business-dna/*`;
- `/apps/*`;
- `/billing`;
- `/assinatura`;
- `/ai-*`;
- `/projects/*`;
- site institucional SaaS.

Rotas de produto final nao devem ser entrada primaria da plataforma.

### Casa Mineira Servicos

Dominio/app de Servicos deve servir:

- login do produto;
- marketplace de servicos;
- categorias;
- pedidos;
- propostas;
- profissionais;
- fornecedores;
- pagamentos operacionais;
- suporte e notificacoes do produto.

Rotas de Control Plane nao devem aparecer como experiencia principal do cliente/profissional.

### Hospedagens Caminhos da Fe

Dominio/app de Hospedagens deve servir:

- catalogo de pousadas;
- detalhe da pousada;
- reserva;
- pagamento de reserva;
- painel da pousada;
- painel do peregrino;
- suporte;
- notificacoes;
- politicas do produto.

Rotas de Casa Mineira Servicos e Control Plane nao devem aparecer como experiencia principal do peregrino/pousada.

## 6. Dominios recomendados

### CMS Platform

Recomendado:

- `plataforma.cmsgroup.com.br`

Alternativa:

- `saas.casamineiratech.com.br`

### Casa Mineira Servicos

Recomendado:

- `casamineiraservicos.com.br`

Alternativa:

- `servicos.casamineiratech.com.br`

### Hospedagens Caminhos da Fe

Recomendado:

- `hospedagenscaminhosdafe.com.br`

Alternativa:

- `hospedagens.casamineiratech.com.br`

Nenhum DNS foi configurado nesta sprint.

## 7. Como Casa Mineira Servicos sera produto oficial

Casa Mineira Servicos deve deixar de ser confundido com a propria plataforma.

Configuracao oficial criada:

- `clients/casa-mineira-servicos/product.json`

Papel:

- produto independente;
- marketplace de servicos;
- clientes e profissionais;
- pedidos e propostas;
- pagamentos operacionais;
- fornecedor/portal operacional.

Compatibilidade:

- `clients/casa-mineira/client.json` permanece como configuracao operacional legada.
- Nao houve renome de pasta, rota ou tenant.

## 8. Como Hospedagens Caminhos da Fe sera produto oficial

Hospedagens Caminhos da Fe ja possui app e backend dedicado documentado.

Configuracoes:

- `clients/hospedagens-caminhos-da-fe/client.json`
- `clients/hospedagens-caminhos-da-fe/product.json`

Papel:

- produto independente;
- catalogo de pousadas;
- quartos e disponibilidade;
- reservas;
- pagamentos Mercado Pago;
- painel da pousada;
- painel do peregrino.

## 9. Estrategia de autenticacao unificada

A autenticacao deve seguir estes principios:

- login compartilhado pode existir no codigo, mas cada app deve resolver o tenant correto;
- `tenantLock` deve ficar ativo para apps dedicados como Hospedagens;
- Casa Mineira Servicos deve ter tenant/produto explicito antes da separacao final;
- Control Plane deve manter acesso administrativo e super admin;
- Product Apps devem limitar a experiencia ao produto atual;
- usuarios multi-produto podem existir, mas o contexto ativo deve ser claro.

Hoje, `lib/tenant.ts` ja resolve `tenantSlug` por env/config e detecta o app Hospedagens pelo package id. Isso deve ser mantido ate uma abstracao multi-produto mais forte.

## 10. Estrategia de deploy

### Curto prazo

- manter rotas existentes;
- usar envs e client configs para builds dedicados;
- nao quebrar `/hospedagens`, `/dashboard` nem `/login`;
- documentar dominios antes de configurar DNS.

### Medio prazo

- criar pipelines separados por produto;
- publicar CMS Platform, Casa Mineira Servicos e Hospedagens como experiencias independentes;
- validar staging por produto antes de producao;
- garantir que Edge Functions de produto nao compartilhem secrets indevidos.

### Longo prazo

- Control Plane com deploy proprio;
- produtos finais com deploys proprios;
- data planes dedicados quando necessario;
- contratos claros entre Control Plane e Product Apps.

## 11. Estrategia de branding

Cada produto deve ter branding proprio:

| Produto | Branding |
| --- | --- |
| CMS Platform | Casa Mineira SaaS / CMS Technology Group, tom institucional e administrativo. |
| Casa Mineira Servicos | Marca operacional para marketplace de servicos. |
| Hospedagens Caminhos da Fe | Marca vertical para peregrinos e pousadas. |

Configuracao oficial criada:

- `clients/cms-platform/product.json`
- `clients/casa-mineira-servicos/product.json`
- `clients/hospedagens-caminhos-da-fe/product.json`

Esses manifests nao substituem `client.json`; eles definem fronteira estrategica de produto.

## 12. Riscos

### P1

- `clients/casa-mineira` ainda usa slug historico e `tenantSlug = default`, o que pode perpetuar ambiguidade entre plataforma e produto Servicos.
- Rotas de Servicos e SaaS ainda convivem no mesmo Expo Router.
- Algumas rotas compartilhadas exibem linguagem SaaS mesmo quando podem ser acessadas por contexto operacional.

### P2

- Dominios ainda nao configurados.
- Branding local de `lib/branding.ts` so possui override explicito para Hospedagens.
- `/(tabs)` permanece como agrupamento legado de Servicos.
- App principal ainda usa defaults de Casa Mineira Servicos no `app.config.ts`.

## 13. Proximas sprints

1. **Platform Separation 002 - Route Guards e Entradas Oficiais**
   - Definir entradas oficiais por produto sem remover rotas existentes.
   - Criar guards leves por tenant/produto quando seguro.
   - Evitar que usuarios de produto caiam no Control Plane por acidente.

2. **Platform Separation 003 - Branding e Env Matrix**
   - Consolidar env matrix por produto.
   - Expandir branding local/remoto por `product_slug`.
   - Validar builds dedicados de CMS Platform, Servicos e Hospedagens.

3. **Platform Separation 004 - Deploy Plan**
   - Definir dominios, staging e producao por produto.
   - Preparar checklist Vercel/EAS/Supabase sem aplicar DNS ainda.

4. **Platform Separation 005 - Legacy Slug Migration Plan**
   - Planejar migracao controlada de `clients/casa-mineira` para `clients/casa-mineira-servicos`, se necessario.
   - Sem renome destrutivo ate haver testes e janela dedicada.
