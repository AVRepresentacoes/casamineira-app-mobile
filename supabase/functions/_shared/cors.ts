const DEFAULT_ALLOWED_HEADERS =
  "authorization, x-client-info, apikey, content-type, asaas-access-token, x-idempotency-key, x-signature, x-request-id";
const DEFAULT_ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};

function parseAllowedOrigins() {
  const rawValue = String(Deno.env.get("EDGE_ALLOWED_ORIGINS") || Deno.env.get("ALLOWED_ORIGINS") || "");
  if (!rawValue) {
    console.warn("[cors] EDGE_ALLOWED_ORIGINS ausente. Function em modo compativel com origem ampla.");
  }

  return rawValue
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createCorsHeaders(req: Request, options: { methods?: string; headers?: string } = {}) {
  const requestOrigin = req.headers.get("origin") || "";
  const allowedOrigins = parseAllowedOrigins();
  const allowAnyOrigin = allowedOrigins.length === 0 || allowedOrigins.includes("*");
  const allowedOrigin =
    allowAnyOrigin || !requestOrigin
      ? requestOrigin || "*"
      : allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : "null";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": options.headers || DEFAULT_ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": options.methods || DEFAULT_ALLOWED_METHODS,
    Vary: "Origin",
  };
}

export function isCorsOriginAllowed(req: Request) {
  const requestOrigin = req.headers.get("origin");
  const allowedOrigins = parseAllowedOrigins();
  return !requestOrigin || allowedOrigins.length === 0 || allowedOrigins.includes("*") || allowedOrigins.includes(requestOrigin);
}

export function corsPreflightResponse(req: Request) {
  if (!isCorsOriginAllowed(req)) {
    return new Response("Origin not allowed", {
      status: 403,
      headers: createCorsHeaders(req),
    });
  }

  return new Response("ok", {
    headers: createCorsHeaders(req),
  });
}
