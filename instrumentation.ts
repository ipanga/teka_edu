// Runs once when a server instance starts: refuse to serve with an invalid configuration.
// Configuration is read at runtime from the container environment (ADR-025).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { parsePublicEnv, parseServerEnv } = await import("./lib/env/schema");
    const publicEnv = parsePublicEnv(process.env);
    parseServerEnv(process.env, publicEnv.NEXT_PUBLIC_APP_ENV);
  }
}
