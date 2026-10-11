export const STAGING_URL = "https://staging-tekaedu.tootiye.com";
export const PRODUCTION_URL = "https://tekaedu.tootiye.com";
export type Target = "local" | "staging" | "production";
export type Identity = {
  database: string;
  login: string;
  version: number;
  tls: boolean;
  superuser: boolean;
  create_role?: boolean;
  replication?: boolean;
  bypass_rls?: boolean;
  create_database: boolean;
  create_public: boolean;
};
export type Connection = {
  target: Target;
  env: NodeJS.ProcessEnv;
  host: string;
  database: string;
  login: string;
};

export function connectionFor(target: string, raw: Record<string, string | undefined>): Connection {
  if (target !== "local" && target !== "staging" && target !== "production")
    throw new Error("Explicit target local, staging or production is required");
  if (target === "production" && raw.TEKA_PRODUCTION_MIGRATIONS_APPROVED !== "true")
    throw new Error("Production commands require explicit owner approval; no automatic execution");
  const { PGHOST: host, PGPORT: port, PGDATABASE: database, PGUSER: login } = raw;
  if (target === "staging" || target === "production") {
    const databaseSuffix = target === "production" ? "prod" : "dev";
    if (
      host !== "postgresql-congofoot.alwaysdata.net" ||
      port !== "5432" ||
      database !== `congofoot_teka_edu_${databaseSuffix}` ||
      login !== `congofoot_user_teka_edu_${databaseSuffix}`
    ) {
      throw new Error(`${target} connection identity does not match its exact allowlist`);
    }
    if (raw.PGSSLMODE !== "verify-full" || !raw.PGSSLROOTCERT) {
      throw new Error(
        `${target} requires PGSSLMODE=verify-full and an explicit trusted PGSSLROOTCERT`,
      );
    }
  } else if (
    !host ||
    !["127.0.0.1", "localhost"].includes(host) ||
    !port ||
    !/^\d{1,5}$/.test(port) ||
    Number(port) < 1 ||
    Number(port) > 65535 ||
    database !== "teka_portability" ||
    login !== "teka_migrator"
  ) {
    throw new Error("Local clean replay requires loopback, teka_portability and teka_migrator");
  }
  const env: NodeJS.ProcessEnv = {
    PATH: raw.PATH,
    NODE_ENV: "production",
    LANG: "C.UTF-8",
    PGCONNECT_TIMEOUT: "15",
    PGGSSENCMODE: "disable",
  };
  for (const name of [
    "PGHOST",
    "PGPORT",
    "PGDATABASE",
    "PGUSER",
    "PGPASSWORD",
    "PGPASSFILE",
    "PGSSLMODE",
    "PGSSLROOTCERT",
  ])
    env[name] = raw[name];
  if (target === "production") {
    env.TEKA_PRODUCTION_MIGRATIONS_APPROVED = "true";
    if (raw.TEKA_POSTGRES_PASSWORD_PROMPT === "true") {
      if (raw.PGPASSWORD || raw.PGPASSFILE)
        throw new Error("Private password prompt cannot be mixed with credential overrides");
      env.TEKA_POSTGRES_PASSWORD_PROMPT = "true";
    }
  }
  return { target, env, host: host!, database: database!, login: login! };
}

export function assertIdentity(connection: Connection, identity: Identity) {
  connectionFor(connection.target, connection.env);
  if (identity.database !== connection.database || identity.login !== connection.login)
    throw new Error("Connected database/login identity mismatch");
  if (identity.version < 160000 || identity.version >= 170000)
    throw new Error("This runner is validated only for PostgreSQL 16");
  if (
    connection.target === "production" &&
    (identity.create_role !== false ||
      identity.replication !== false ||
      identity.bypass_rls !== false)
  )
    throw new Error(
      "Production deployment role attributes require a verified least-privilege baseline",
    );
  if (identity.superuser) throw new Error("Use a non-superuser migration login");
  if (connection.target !== "local" && !identity.tls)
    throw new Error("Managed PostgreSQL connection has no actual TLS");
}
