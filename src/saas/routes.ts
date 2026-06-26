export const publicRoutes = ["/", "/login", "/register", "/forgot-password"] as const;

export const authenticatedRoutes = [
  "/dashboard",
  "/apps/new",
  "/business-dna",
  "/marketplace",
  "/projects",
  "/ai-business-consultant",
  "/ai-workforce",
  "/ai-solution-architect",
  "/project-review",
] as const;

export type PublicRoute = (typeof publicRoutes)[number];
export type AuthenticatedRoute = (typeof authenticatedRoutes)[number];
export type SaasRouteArea = "public" | "authenticated" | "operational";

export function normalizeRoute(pathname: string) {
  const cleanPath = pathname.split("?")[0]?.replace(/\/+$/, "") || "/";
  return cleanPath === "" ? "/" : cleanPath;
}

export function isPublicRoute(pathname: string) {
  const route = normalizeRoute(pathname);
  return publicRoutes.some((publicRoute) => route === publicRoute);
}

export function isAuthenticatedSaasRoute(pathname: string) {
  const route = normalizeRoute(pathname);
  return authenticatedRoutes.some((authRoute) => route === authRoute || route.startsWith(`${authRoute}/`));
}

export function getSaasRouteArea(pathname: string): SaasRouteArea {
  if (isPublicRoute(pathname)) return "public";
  if (isAuthenticatedSaasRoute(pathname)) return "authenticated";
  return "operational";
}
