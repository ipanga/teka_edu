/**
 * Browser-safe configuration. Safe to import from client and server code.
 *
 * Next.js inlines NEXT_PUBLIC_* values at build time, and only when they are referenced
 * literally as `process.env.NEXT_PUBLIC_X`, so every variable is listed explicitly here.
 * Validation runs at import time: a misconfigured build fails fast.
 */
import { parsePublicEnv } from "./schema";

export const publicEnv = parsePublicEnv({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  NEXT_PUBLIC_DEFAULT_COUNTRY: process.env.NEXT_PUBLIC_DEFAULT_COUNTRY,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_ENABLE_ENGLISH_SCAFFOLDING: process.env.NEXT_PUBLIC_ENABLE_ENGLISH_SCAFFOLDING,
  NEXT_PUBLIC_ENABLE_CLOUD_SYNC: process.env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  NEXT_PUBLIC_GIT_SHA: process.env.NEXT_PUBLIC_GIT_SHA,
});
