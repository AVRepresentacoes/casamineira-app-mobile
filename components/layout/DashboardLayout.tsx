import { SaasProductShell } from "@/components/saas/SaasProductShell";
import { ReactNode } from "react";

export function DashboardLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <SaasProductShell title={title} subtitle={subtitle}>
      {children}
    </SaasProductShell>
  );
}
