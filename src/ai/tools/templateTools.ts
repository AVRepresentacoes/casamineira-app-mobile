import type { AppTemplateKey } from "../schemas/appTemplateSchema";

export type TemplateAssetPlan = {
  template: AppTemplateKey;
  directories: string[];
  assetChecklist: string[];
};

export function describeTemplateAssets(template: AppTemplateKey): TemplateAssetPlan {
  return {
    template,
    directories: [`src/ai/templates/${template}`],
    assetChecklist: [
      "icone 1024x1024",
      "splash revisado",
      "adaptive icon Android",
      "notification icon segura",
      "screenshots reais antes de publicar",
    ],
  };
}
