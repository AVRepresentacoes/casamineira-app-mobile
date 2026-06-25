export type GeneratedFilePlan = {
  path: string;
  purpose: string;
  requiresApproval: boolean;
};

export type ArtifactMaterializationPlan = {
  runId: string;
  files: GeneratedFilePlan[];
  dryRunCommand: string;
  writeCommand: string;
  validateCommand: string;
  buildBlocked: boolean;
};

export function planGeneratedFiles(paths: string[]): GeneratedFilePlan[] {
  return paths.map((path) => ({
    path,
    purpose: "Arquivo planejado pela fabrica de IA.",
    requiresApproval: true,
  }));
}

export function planArtifactMaterialization(runId: string, paths: string[]): ArtifactMaterializationPlan {
  return {
    runId,
    files: planGeneratedFiles(paths),
    dryRunCommand: `npm run ai-factory:export -- ${runId}`,
    writeCommand: `npm run ai-factory:export -- ${runId} --write`,
    validateCommand: `npm run ai-factory:export -- ${runId} --write --validate`,
    buildBlocked: true,
  };
}
