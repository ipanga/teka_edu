import { publicEnv } from "@/lib/env/public";

// Liveness endpoint for container health checks and deployment smoke tests.
// Returns only non-sensitive build metadata: never credentials or connection details.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      status: "ok",
      environment: publicEnv.NEXT_PUBLIC_APP_ENV,
      version: publicEnv.NEXT_PUBLIC_APP_VERSION ?? null,
      commit: publicEnv.NEXT_PUBLIC_GIT_SHA ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
