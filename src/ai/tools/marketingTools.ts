export type MarketingAssetPlan = {
  landingPage: boolean;
  socialPosts: number;
  paidCampaigns: number;
};

export function planMarketingAssets(): MarketingAssetPlan {
  return {
    landingPage: true,
    socialPosts: 12,
    paidCampaigns: 3,
  };
}
