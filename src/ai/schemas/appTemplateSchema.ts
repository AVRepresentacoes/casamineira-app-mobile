export type AppTemplateKey =
  | "servicesApp"
  | "schedulingApp"
  | "deliveryApp"
  | "marketplaceApp"
  | "ecommerceApp"
  | "courseApp"
  | "hotelBookingApp";

export type AppTemplateSchema = {
  key: AppTemplateKey;
  label: string;
  requiredFeatures: string[];
};

export function selectAppTemplate(segment: string, features: string[]): AppTemplateSchema {
  const normalized = `${segment} ${features.join(" ")}`.toLowerCase();

  if (normalized.includes("hospedagem") || normalized.includes("hotel") || normalized.includes("pousada")) {
    return { key: "hotelBookingApp", label: "Hospedagem e reservas", requiredFeatures: ["reservas", "pagamentos", "painel pousada"] };
  }
  if (normalized.includes("delivery")) {
    return { key: "deliveryApp", label: "Delivery local", requiredFeatures: ["catalogo", "checkout", "rastreamento"] };
  }
  if (normalized.includes("ecommerce") || normalized.includes("loja")) {
    return { key: "ecommerceApp", label: "E-commerce", requiredFeatures: ["catalogo", "carrinho", "pagamentos"] };
  }
  if (normalized.includes("curso") || normalized.includes("educacao")) {
    return { key: "courseApp", label: "Cursos e conteudo", requiredFeatures: ["aulas", "assinaturas", "area do aluno"] };
  }
  if (normalized.includes("agendamento") || normalized.includes("barbearia")) {
    return { key: "schedulingApp", label: "Agendamento de servicos", requiredFeatures: ["agenda", "profissionais", "pagamentos"] };
  }

  return { key: "servicesApp", label: "Servicos locais", requiredFeatures: ["pedidos", "propostas", "chat"] };
}
