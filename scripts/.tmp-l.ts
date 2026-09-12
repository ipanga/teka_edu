import { getReferenceData, getSyllabus } from "../lib/content/reference-data";
const s = getSyllabus("maternelle-cycle1-cd-2026", getReferenceData());
const want = process.argv[2]!;
for (const c of s.competencies.filter((c) => c.code.startsWith(want))) {
  console.log("\n## " + c.code + " — " + c.title.slice(0, 90));
  for (const o of s.objectives.filter((o) => o.competencyCode === c.code)) {
    console.log("  " + o.code, "[" + o.ageBandCodes.join("+") + "]", o.statement.slice(0, 92));
  }
}
