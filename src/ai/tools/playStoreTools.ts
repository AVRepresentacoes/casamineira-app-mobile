export type PlayStoreChecklistPlan = {
  requiredItems: string[];
};

export function planPlayStoreChecklist(): PlayStoreChecklistPlan {
  return {
    requiredItems: [
      "Nome do app",
      "Descricao curta",
      "Descricao completa",
      "Politica de privacidade",
      "Data Safety",
      "Screenshots",
      "Classificacao de conteudo",
    ],
  };
}
