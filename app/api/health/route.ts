import { APP_VERSION } from "@/lib/app-version";
import { getPublicEnv } from "@/lib/env/public";

// Liveness endpoint for container health checks and deployment smoke tests.
// Returns only non-sensitive build metadata: never credentials or connection details.
// `supabaseProjectRef` is the public project identifier already visible in the browser
// (it is part of NEXT_PUBLIC_SUPABASE_URL); deploy smoke tests use it to prove which
// Supabase project a deployment is wired to.
export const dynamic = "force-dynamic";

export function supabaseProjectRef(url: string | undefined): string | null {
  if (!url) return null;
  const { hostname } = new URL(url);
  return hostname.endsWith(".supabase.co") ? (hostname.split(".")[0] ?? null) : null;
}

export function GET() {
  const publicEnv = getPublicEnv();
  return Response.json(
    {
      status: "ok",
      environment: publicEnv.NEXT_PUBLIC_APP_ENV,
      version: APP_VERSION,
      commit: publicEnv.NEXT_PUBLIC_GIT_SHA ?? null,
      supabaseProjectRef: supabaseProjectRef(publicEnv.NEXT_PUBLIC_SUPABASE_URL),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
