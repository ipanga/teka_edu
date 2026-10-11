import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import { transferSessions } from "@/lib/programme/session-catalogue";
import {
  localProgressBookmarkletPage,
  localProgressExportBookmarklet,
  localProgressExportConsole,
} from "@/lib/programme/session-transfer-console";

// Generate reviewed, static owner-copyable code. Never opens a browser or reads browser storage.
await writeFile(
  fileURLToPath(new URL("../docs/progress-export-console.js", import.meta.url)),
  await format(localProgressExportConsole(transferSessions()), {
    parser: "babel",
    printWidth: 100,
  }),
);
await writeFile(
  fileURLToPath(new URL("../docs/progress-export-bookmarklet.txt", import.meta.url)),
  `${localProgressExportBookmarklet(transferSessions())}\n`,
);
await writeFile(
  fileURLToPath(new URL("../docs/progress-export-bookmarklet.html", import.meta.url)),
  await format(localProgressBookmarkletPage(transferSessions()), {
    parser: "html",
    printWidth: 100,
  }),
);
