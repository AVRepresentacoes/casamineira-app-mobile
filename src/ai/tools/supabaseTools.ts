export type SupabaseOperationPlan = {
  operation: "migration" | "edge-function" | "rls-policy" | "storage-bucket";
  description: string;
  dryRun: boolean;
};

export function planSupabaseOperation(operation: SupabaseOperationPlan["operation"], description: string): SupabaseOperationPlan {
  return {
    operation,
    description,
    dryRun: true,
  };
}
