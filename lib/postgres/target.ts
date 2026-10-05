export const STAGING_URL = "https://staging-tekaedu.tootiye.com";
export type Target = "local" | "staging" | "production";
export type Identity = {
  database: string;
  login: string;
  version: number;
  tls: boolean;
  superuser: boolean;
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
  if (target === "production")
    throw new Error("Production commands are blocked in this staging-only phase");
  if (target !== "local" && target !== "staging")
    throw new Error("Explicit target local or staging is required");
  const { PGHOST: host, PGPORT: port, PGDATABASE: database, PGUSER: login } = raw;
  if (target === "staging") {
    if (
      host !== "postgresql-congofoot.alwaysdata.net" ||
      port !== "5432" ||
      database !== "congofoot_teka_edu_dev" ||
      login !== "congofoot_user_teka_edu_dev"
    ) {
      throw new Error("Staging connection identity does not match its exact allowlist");
    }
    if (raw.PGSSLMODE !== "verify-full" || !raw.PGSSLROOTCERT) {
      throw new Error(
        "Staging requires PGSSLMODE=verify-full and an explicit trusted PGSSLROOTCERT",
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
  return { target, env, host: host!, database: database!, login: login! };
}

export function assertIdentity(connection: Connection, identity: Identity) {
  connectionFor(connection.target, connection.env);
  if (identity.database !== connection.database || identity.login !== connection.login)
    throw new Error("Connected database/login identity mismatch");
  if (identity.version < 160000 || identity.version >= 170000)
    throw new Error("This runner is validated only for PostgreSQL 16");
  if (identity.superuser) throw new Error("Use a non-superuser migration login");
  if (connection.target === "staging" && !identity.tls)
    throw new Error("Staging PostgreSQL connection has no actual TLS");
}
