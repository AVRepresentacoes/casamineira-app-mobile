// @ts-nocheck
import { corsPreflightResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return corsPreflightResponse(req);
  }

  const targetUrl = new URL(req.url);
  targetUrl.pathname = targetUrl.pathname.replace(
    /\/mercadopago-webhook-servicos$/,
    "/mercadopago-webhook",
  );

  const headers = new Headers(req.headers);
  headers.set("x-cm-product-webhook", "servicos");

  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();
  const response = await fetch(targetUrl.toString(), {
    method: req.method,
    headers,
    body,
    redirect: "manual",
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
});
