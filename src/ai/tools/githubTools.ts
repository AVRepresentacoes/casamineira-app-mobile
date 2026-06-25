export type GitHubArtifactPlan = {
  branchName: string;
  commitTitle: string;
  requiresHumanApproval: boolean;
};

export function planGitHubArtifact(slug: string): GitHubArtifactPlan {
  return {
    branchName: `ai-factory/${slug}`,
    commitTitle: `Adicionar fabrica de app para ${slug}`,
    requiresHumanApproval: true,
  };
}
