// Runs once when a server instance starts: refuse to serve with an invalid configuration.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { publicEnv } = await import("./lib/env/public");
    const { parseServerEnv } = await import("./lib/env/schema");
    parseServerEnv(process.env, publicEnv.NEXT_PUBLIC_APP_ENV);
  }
}
