// These are the only application targets. Caller-supplied hosts, roots and site IDs are forbidden.
export const SITE_COMMAND = "/usr/alwaysdata/nodejs/22/bin/node current/runtime.mjs";
export const TARGETS = Object.freeze({
  staging: Object.freeze({
    environment: "staging",
    siteId: 1083502,
    root: "/home/congofoot/www/tekaedu-staging",
    url: "https://staging-tekaedu.tootiye.com",
    address: "staging-tekaedu.tootiye.com",
  }),
  production: Object.freeze({
    environment: "production",
    siteId: 1083500,
    root: "/home/congofoot/www/tekaedu-prod",
    url: "https://tekaedu.tootiye.com",
    address: "tekaedu.tootiye.com",
  }),
});
export function deploymentTarget(name = "staging") {
  if (!Object.hasOwn(TARGETS, name))
    throw new Error("Application target must be staging or production");
  return TARGETS[name];
}
export function releaseMetadata(sha, targetName = "staging") {
  if (!/^[a-f0-9]{40}$/.test(sha ?? "")) throw new Error("Full Git SHA required");
  const target = deploymentTarget(targetName);
  return { sha, environment: target.environment, url: target.url, node_major: 22 };
}
