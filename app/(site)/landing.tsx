import { MarketingLandingContent } from "@/components/site/MarketingLandingContent";
import { SiteShell } from "@/components/site/SiteShell";
import { getPublicSaasPlans } from "@/lib/saas-growth";
import type { SaasPlanoComercial } from "@/lib/saas-commercial";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [plans, setPlans] = useState<SaasPlanoComercial[]>([]);

  useEffect(() => {
    getPublicSaasPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  return (
    <SiteShell>
      <MarketingLandingContent plans={plans} />
    </SiteShell>
  );
}
