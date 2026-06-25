import { briefingAgent } from "./01-briefingAgent";
import { marketResearchAgent } from "./02-marketResearchAgent";
import { businessStrategyAgent } from "./03-businessStrategyAgent";
import { productManagerAgent } from "./04-productManagerAgent";
import { uxResearchAgent } from "./05-uxResearchAgent";
import { uiDesignerAgent } from "./06-uiDesignerAgent";
import { brandingAgent } from "./07-brandingAgent";
import { copywriterAgent } from "./08-copywriterAgent";
import { reactNativeAgent } from "./09-reactNativeAgent";
import { nextjsAgent } from "./10-nextjsAgent";
import { backendAgent } from "./11-backendAgent";
import { databaseAgent } from "./12-databaseAgent";
import { supabaseAgent } from "./13-supabaseAgent";
import { apiIntegrationAgent } from "./14-apiIntegrationAgent";
import { paymentAgent } from "./15-paymentAgent";
import { whatsappAutomationAgent } from "./16-whatsappAutomationAgent";
import { n8nAutomationAgent } from "./17-n8nAutomationAgent";
import { qaTesterAgent } from "./18-qaTesterAgent";
import { securityAgent } from "./19-securityAgent";
import { devopsAgent } from "./20-devopsAgent";
import { googlePlayAgent } from "./21-googlePlayAgent";
import { appStoreAgent } from "./22-appStoreAgent";
import { legalAgent } from "./23-legalAgent";
import { seoAgent } from "./24-seoAgent";
import { socialMediaAgent } from "./25-socialMediaAgent";
import { paidTrafficAgent } from "./26-paidTrafficAgent";
import { videoContentAgent } from "./27-videoContentAgent";
import { customerSupportAgent } from "./28-customerSupportAgent";
import { financialPricingAgent } from "./29-financialPricingAgent";
import { growthAnalyticsAgent } from "./30-growthAnalyticsAgent";

export const allAgents = [
  briefingAgent,
  marketResearchAgent,
  businessStrategyAgent,
  productManagerAgent,
  uxResearchAgent,
  brandingAgent,
  uiDesignerAgent,
  copywriterAgent,
  reactNativeAgent,
  nextjsAgent,
  backendAgent,
  databaseAgent,
  supabaseAgent,
  apiIntegrationAgent,
  paymentAgent,
  whatsappAutomationAgent,
  n8nAutomationAgent,
  qaTesterAgent,
  securityAgent,
  devopsAgent,
  legalAgent,
  googlePlayAgent,
  appStoreAgent,
  seoAgent,
  socialMediaAgent,
  paidTrafficAgent,
  videoContentAgent,
  customerSupportAgent,
  financialPricingAgent,
  growthAnalyticsAgent,
].sort((a, b) => a.order - b.order);

export type { AgentDefinition, AgentOutput, AgentStage } from "./agentTypes";
