import { SiteFaq } from "@/components/site/SiteFaq";
import { SiteSection } from "@/components/site/SiteSection";
import { SiteShell } from "@/components/site/SiteShell";
import { SAAS_SITE_TEXT } from "@/lib/saas-site-content";

export default function FaqPage() {
  return (
    <SiteShell>
      <SiteSection
        eyebrow="Perguntas frequentes"
        title="Esclareça dúvidas antes de avançar para o onboarding comercial."
        description="Encontre respostas rápidas para decidir com mais segurança e entender como a plataforma se encaixa na sua empresa."
      >
        <SiteFaq items={SAAS_SITE_TEXT.faq} />
      </SiteSection>
    </SiteShell>
  );
}
