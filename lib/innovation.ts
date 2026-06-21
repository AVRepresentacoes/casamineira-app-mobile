export type Urgencia = "baixa" | "media" | "alta";
export type NivelDemanda = "normal" | "alta" | "pico";

export type PricingInput = {
  base: number;
  urgencia: Urgencia;
  distanciaKm: number;
  demanda: NivelDemanda;
  reputacaoProfissional: number;
};

export type PricingResult = {
  sugerido: number;
  minimo: number;
  maximo: number;
  fatores: string[];
};

export type ProfessionalForMatch = {
  id: string;
  nome: string;
  notaMedia: number;
  slaMinutos: number;
  distanciaKm: number;
  taxaAceite: number;
};

export type MatchResult = ProfessionalForMatch & {
  score: number;
};

export type TrustScoreInput = {
  notaMedia: number;
  totalAvaliacoes: number;
  taxaCancelamento: number;
  taxaNoShow: number;
  taxaConflito: number;
};

export function suggestDynamicPrice(input: PricingInput): PricingResult {
  const fatores: string[] = [];
  let fator = 1;

  if (input.urgencia === "media") {
    fator += 0.1;
    fatores.push("Urgencia media (+10%)");
  }
  if (input.urgencia === "alta") {
    fator += 0.2;
    fatores.push("Urgencia alta (+20%)");
  }

  if (input.demanda === "alta") {
    fator += 0.08;
    fatores.push("Demanda alta (+8%)");
  }
  if (input.demanda === "pico") {
    fator += 0.15;
    fatores.push("Demanda em pico (+15%)");
  }

  if (input.distanciaKm > 10) {
    fator += 0.05;
    fatores.push("Deslocamento acima de 10km (+5%)");
  }
  if (input.distanciaKm > 20) {
    fator += 0.08;
    fatores.push("Deslocamento acima de 20km (+8%)");
  }

  if (input.reputacaoProfissional >= 4.8) {
    fator += 0.05;
    fatores.push("Reputacao premium (+5%)");
  }

  const sugerido = Number((input.base * fator).toFixed(2));
  return {
    sugerido,
    minimo: Number((sugerido * 0.9).toFixed(2)),
    maximo: Number((sugerido * 1.1).toFixed(2)),
    fatores,
  };
}

export function rankProfessionalsForRequest(
  profissionais: ProfessionalForMatch[],
): MatchResult[] {
  return profissionais
    .map((p) => {
      const scoreNota = Math.min(100, p.notaMedia * 20);
      const scoreSla = Math.max(0, 100 - p.slaMinutos * 1.4);
      const scoreDistancia = Math.max(0, 100 - p.distanciaKm * 3.2);
      const scoreAceite = Math.max(0, Math.min(100, p.taxaAceite * 100));

      const score =
        scoreNota * 0.35 +
        scoreSla * 0.25 +
        scoreDistancia * 0.2 +
        scoreAceite * 0.2;

      return { ...p, score: Number(score.toFixed(1)) };
    })
    .sort((a, b) => b.score - a.score);
}

export function calculateTrustScore(input: TrustScoreInput): number {
  const base = Math.min(100, input.notaMedia * 20);
  const volumeBonus = Math.min(10, input.totalAvaliacoes / 10);
  const penalty =
    input.taxaCancelamento * 20 +
    input.taxaNoShow * 35 +
    input.taxaConflito * 45;
  return Number(Math.max(0, Math.min(100, base + volumeBonus - penalty)).toFixed(1));
}

export function generateReferralCode(userId: string): string {
  const seed = userId.replace(/-/g, "").slice(0, 6).toUpperCase();
  const nonce = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CM-${seed}-${nonce}`;
}
