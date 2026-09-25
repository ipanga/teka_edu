/** Extract only the public project identifier used by deployment smoke checks. */
export function supabaseProjectRef(url: string | undefined): string | null {
  if (!url) return null;
  const { hostname } = new URL(url);
  return hostname.endsWith(".supabase.co") ? (hostname.split(".")[0] ?? null) : null;
}
