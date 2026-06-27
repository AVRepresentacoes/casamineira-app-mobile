# ADR-002 - Enterprise Intelligence Fabric

## Status

Aceita.

## Conceito

O **Enterprise Intelligence Fabric™ (EIF™)** é a camada arquitetural central da Casa Mineira SaaS.

Ele não é um motor de IA e não executa modelos. O EIF™ é o tecido de inteligência operacional que compõe o estado estratégico da empresa digital a partir de entidades existentes.

## Responsabilidades

O EIF™ deve conhecer e organizar:

- Tenant atual.
- Empresa atual.
- Usuário/perfil atual.
- Business Project™ atual.
- Business DNA™ atual.
- Template atual.
- Plano e assinatura.
- Marketplace.
- Deploys.
- Analytics.
- Agentes IA disponíveis.

Essa composição cria uma visão única do negócio digital sem criar uma nova tabela e sem duplicar dados operacionais.

## Limites

O EIF™ não deve:

- Chamar IA real.
- Chamar OpenAI, Claude, Gemini ou qualquer provider.
- Usar service role no frontend.
- Criar tabelas.
- Criar migrations.
- Escrever no banco.
- Alterar autenticação.
- Alterar pagamentos.
- Alterar Edge Functions.
- Materializar builds ou publicações.

Execuções reais de IA devem permanecer backend-only, via serviços server-side ou Edge Functions com aprovação humana.

## Integração Futura

O EIF™ prepara integração com:

- AI Copilot™: para receber contexto estratégico da empresa digital.
- AI Workforce™: para priorizar agentes e tarefas com base em estado real.
- Business Operating Center™: para exibir o estado estratégico consolidado.
- Business Project™: para ser o núcleo operacional da empresa digital.

Nesta decisão, a integração é apenas arquitetural. Providers globais e consumo visual devem ser conectados em sprint própria.

## Benefícios

- Reduz duplicação de leitura entre módulos.
- Cria uma fronteira clara entre domínio, UI e backend.
- Mantém multi-tenant como premissa do estado estratégico.
- Ajuda a IA futura a receber contexto consistente e seguro.
- Permite evoluir Business Operating Center™, Copilot e Workforce sem reanalisar toda a aplicação.
- Evita criar schema prematuro enquanto Business DNA™, Templates e Business Project™ ainda estão amadurecendo.

## Próximos Passos

1. Registrar `EnterpriseIntelligenceProvider` no layout autenticado quando aprovado.
2. Migrar Business Operating Center™ para consumir `useEnterpriseIntelligence()`.
3. Migrar AI Copilot™ e AI Workforce™ para consumir o Fabric em vez de carregar projeto isoladamente.
4. Conectar analytics reais quando houver tabelas/serviços oficiais.
5. Manter execução real de IA apenas no backend.
