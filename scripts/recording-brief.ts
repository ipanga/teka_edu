/**
 * Writes the September recording package (docs/audio/septembre-script-enregistrement.md).
 *
 *   npm run audio:brief
 *
 * Deterministic; a unit test fails if the committed copy is out of date.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import { getReferenceData } from "@/lib/content/reference-data";
import { RECORDING_BRIEF_PATH, buildRecordingBrief } from "@/lib/content/recording-brief";

const file = path.resolve(import.meta.dirname, "..", RECORDING_BRIEF_PATH);
mkdirSync(path.dirname(file), { recursive: true });
const text = buildRecordingBrief(getReferenceData());
writeFileSync(file, await format(text, { ...(await resolveConfig(file)), filepath: file }), "utf8");
console.log(`${RECORDING_BRIEF_PATH} written`);
