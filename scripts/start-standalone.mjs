// Runs the production build exactly as the containers do (`node server.js` from the
// standalone output). `next build` leaves public/ and .next/static outside the standalone
// folder, so they are copied first (the Dockerfiles do the same with COPY).
// PORT and HOSTNAME environment variables configure the listener (default 3000 / 0.0.0.0).
import { cpSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const standalone = path.join(root, ".next", "standalone");

if (!existsSync(path.join(standalone, "server.js"))) {
  console.error("No standalone build found. Run `npm run build` first.");
  process.exit(1);
}

cpSync(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), {
  recursive: true,
});

await import(path.join(standalone, "server.js"));
