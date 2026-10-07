// CI boots the same immutable payload deployed over SSH, with no provider credentials.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import { assertHealth } from "./site.mjs";
const directory = path.resolve(process.argv[2]);
const artifact = JSON.parse(fs.readFileSync(path.join(directory, "artifact.json")));
const root = fs.mkdtempSync(path.join(os.tmpdir(), "teka-artifact-"));
let server;
try {
  execFileSync(
    "python3",
    [
      "-B",
      "-c",
      `import importlib.util,pathlib,sys
s=importlib.util.spec_from_file_location('release',sys.argv[1]);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
m.install(pathlib.Path(sys.argv[2]),pathlib.Path(sys.argv[3]),sys.argv[4],sys.argv[5])`,
      path.resolve("scripts/alwaysdata/remote.py"),
      root,
      path.join(directory, "release.tar.gz"),
      artifact.sha,
      artifact.sha256,
    ],
    { stdio: "inherit" },
  );
  const release = path.join(root, "releases", artifact.sha);
  const env = { ...process.env, IP: "127.0.0.1", PORT: "3097" };
  for (const name of Object.keys(env))
    if (/^(PG|SUPABASE_|DATABASE_URL$|DIRECT_DATABASE_URL$|NEXT_PUBLIC_SUPABASE_)/.test(name))
      delete env[name];
  server = spawn(process.execPath, [path.join(release, "runtime.mjs")], { env, stdio: "inherit" });
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error("Artifact runtime exited");
    try {
      const response = await fetch("http://127.0.0.1:3097/api/health", {
        signal: AbortSignal.timeout(2000),
      });
      if (!response.ok) throw new Error("HTTP health failure");
      assertHealth(await response.json(), artifact.sha);
      ready = true;
      break;
    } catch {
      await setTimeout(500);
    }
  }
  if (!ready) throw new Error("Standalone artifact health failed");
  const manifest = JSON.parse(fs.readFileSync(path.join(release, "manifest.json")));
  const media = manifest.media.find((file) => file.path.endsWith(".webp")) ?? manifest.media[0];
  if (!media) throw new Error("Artifact has no public media");
  const response = await fetch("http://127.0.0.1:3097/" + media.path.slice("public/".length));
  const { hash } = await import("./package.mjs");
  if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== media.sha256)
    throw new Error("Artifact public media serving differs from manifest");
  console.log(
    "PASS: immutable standalone artifact, Node22 startup, strict staging health and public media",
  );
} finally {
  if (server && server.exitCode === null) {
    const exited = new Promise((resolve) => server.once("exit", resolve));
    server.kill("SIGTERM");
    await Promise.race([exited, setTimeout(5000)]);
    if (server.exitCode === null) {
      server.kill("SIGKILL");
      await exited;
    }
  }
  fs.rmSync(root, { recursive: true, force: true });
}
