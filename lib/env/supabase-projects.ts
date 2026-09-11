/**
 * Supabase project references of the hosted environments.
 *
 * Project refs are public identifiers (they appear in every Supabase URL), not secrets.
 * Once the projects exist, fill these in so the environment guard can refuse
 * cross-environment configurations such as a staging deployment pointing at the PROD
 * database. `null` disables the check for that environment.
 * See docs/ENVIRONMENT_SETUP.md, section "Environment guard".
 */
export const SUPABASE_PROJECT_REFS: Readonly<Record<"staging" | "production", string | null>> = {
  staging: "quyhkkizsmosybavoewd", // teka-edu-dev (eu-west-3)
  production: "eganrivpkjhozkkahyxy", // teka-edu-prod (eu-west-3)
};
