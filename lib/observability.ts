type ObservabilityStatus = "ok" | "warn" | "error";

type ObservabilityPayload = {
  area: "supabase" | "database" | "storage" | "realtime" | "auth" | "edge" | "ai" | "health" | "audit";
  operation: string;
  status: ObservabilityStatus;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  error?: unknown;
};

function normalizeError(error: unknown) {
  if (!error) return undefined;
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

export function recordObservation(payload: ObservabilityPayload) {
  const entry = {
    timestamp: new Date().toISOString(),
    ...payload,
    error: normalizeError(payload.error),
  };

  if (payload.status === "error") {
    console.error("[observability]", entry);
    return;
  }

  if (payload.status === "warn") {
    console.warn("[observability]", entry);
    return;
  }

  console.log("[observability]", entry);
}

export async function observeAsync<T>(
  area: ObservabilityPayload["area"],
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    recordObservation({ area, operation, status: "ok", durationMs: Date.now() - start, metadata });
    return result;
  } catch (error) {
    recordObservation({ area, operation, status: "error", durationMs: Date.now() - start, metadata, error });
    throw error;
  }
}

