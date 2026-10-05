import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  realpathSync,
  lstatSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function inventory(root) {
  const files = [];
  function walk(directory) {
    for (const name of readdirSync(directory).sort()) {
      const file = path.join(directory, name);
      const stat = lstatSync(file);
      const relative = path.relative(root, file).split(path.sep).join("/");
      if (stat.isSymbolicLink()) throw new Error("Payload symlinks forbidden");
      if (/^(?:scripts\/postgres(?:\/|-)|lib\/postgres\/|docs\/|tests\/|supabase\/)/.test(relative))
        throw new Error("Administrative payload entry forbidden");
      if (/^\.env(?:\.|$)/.test(name) || /\.(key|p12|pfx|dump)$/.test(name) || name === ".git")
        throw new Error("Forbidden payload entry: " + name);
      if (stat.isDirectory()) walk(file);
      else if (stat.isFile())
        files.push({
          path: path.relative(root, file).split(path.sep).join("/"),
          sha256: hash(readFileSync(file)),
        });
      else throw new Error("Special payload file forbidden");
    }
  }
  walk(root);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}
export function packageRelease(root, output, sha) {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Full Git SHA required");
  for (const file of [".next/standalone/server.js", ".next/static", "public"])
    if (!existsSync(path.join(root, file))) throw new Error("Missing standalone build: " + file);
  const payload = path.join(output, "payload");
  if (existsSync(payload)) throw new Error("Refuse to reuse payload directory");
  mkdirSync(payload, { recursive: true });
  function validateCopy(directory, base = realpathSync(directory)) {
    for (const name of readdirSync(directory)) {
      const file = path.join(directory, name),
        real = realpathSync(file);
      if (!real.startsWith(base + path.sep) && lstatSync(file).isSymbolicLink())
        throw new Error("Escaping source symlink");
      if (lstatSync(file).isDirectory()) validateCopy(file, base);
    }
  }
  for (const directory of [".next/standalone", ".next/static", "public"])
    validateCopy(path.join(root, directory));
  cpSync(path.join(root, ".next/standalone"), payload, { recursive: true, dereference: true });
  cpSync(path.join(root, ".next/static"), path.join(payload, ".next/static"), {
    recursive: true,
    dereference: true,
  });
  cpSync(path.join(root, "public"), path.join(payload, "public"), {
    recursive: true,
    dereference: true,
  });
  cpSync(path.join(root, "scripts/alwaysdata/runtime.mjs"), path.join(payload, "runtime.mjs"));
  writeFileSync(
    path.join(payload, "release.json"),
    JSON.stringify(
      { sha, environment: "staging", url: "https://staging-tekaedu.tootiye.com", node_major: 22 },
      null,
      2,
    ) + "\n",
  );
  const files = inventory(payload);
  const forbidden = [
    process.env.SUPABASE_SECRET_KEY,
    process.env.DATABASE_URL,
    process.env.DIRECT_DATABASE_URL,
  ].filter(Boolean);
  for (const file of files) {
    const bytes = readFileSync(path.join(payload, file.path));
    if (forbidden.some((value) => bytes.includes(value)))
      throw new Error("Server credential sentinel found in artifact");
  }
  writeFileSync(
    path.join(payload, "manifest.json"),
    JSON.stringify(
      { sha, files, media: files.filter((f) => f.path.startsWith("public/")) },
      null,
      2,
    ) + "\n",
  );
  const archive = path.join(output, "release.tar.gz");
  execFileSync("tar", ["-czf", archive, "-C", payload, "."]);
  writeFileSync(
    path.join(output, "artifact.json"),
    JSON.stringify({ sha, sha256: hash(readFileSync(archive)), files: files.length }, null, 2) +
      "\n",
  );
  rmSync(payload, { recursive: true });
  return { archive, files: files.length };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(packageRelease(process.cwd(), path.resolve(process.argv[2]), process.argv[3]));
