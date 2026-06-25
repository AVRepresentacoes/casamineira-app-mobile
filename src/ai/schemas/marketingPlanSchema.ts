export type MarketingPlanSchema = {
  positioning: string;
  channels: string[];
  contentIdeas: string[];
  campaignIdeas: string[];
};

export function createMarketingPlan(segment: string): MarketingPlanSchema {
  return {
    positioning: `Aplicativo white-label para ${segment} com foco em conveniencia, confiança e recorrencia.`,
    channels: ["Instagram", "Google Business Profile", "WhatsApp", "Meta Ads"],
    contentIdeas: ["antes e depois", "depoimentos", "oferta de lancamento", "bastidores da operacao"],
    campaignIdeas: ["campanha de captacao local", "remarketing para interessados", "promocao de primeira compra"],
  };
}
