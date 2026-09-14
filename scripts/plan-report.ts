/**
 * Is a year's plan actually teachable in the days the calendar gives us?
 *
 *   npm run plan:report -- --level=maternelle-1
 *
 * This reads the annual plan alone, before any lesson exists, and answers the question that has
 * to be answered before a month is authored: does this corpus fit across the year without
 * overloading any stretch of it, and does every objective get seen often enough to stick?
 *
 * It deliberately reports load as *objectives introduced per instructional day*, not as a total.
 * A year plan fails by bunching, not by counting wrong.
 */
import { getReferenceData } from "@/lib/content/reference-data";

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, value] = arg.replace(/^--/, "").split("=");
      return [key ?? "", value ?? "true"];
    }),
);

const levelId = args.get("level") ?? "maternelle-1";
const data = getReferenceData();
const plan = data.annualPlans.find((p) => p.levelId === levelId);
if (plan === undefined) throw new Error(`no annual plan for ${levelId}`);
const level = data.levels.find((l) => l.id === levelId);

const pad = (n: number, w = 4) => String(n).padStart(w);
const bar = (n: number, max: number, width = 28) =>
  "█".repeat(Math.max(n > 0 ? 1 : 0, Math.round((n / Math.max(max, 1)) * width)));

console.log("─".repeat(88));
console.log(
  `${level?.name ?? levelId} · ${plan.schoolYearId} · ${plan.entries.length} objectifs · ${plan.instructionalDays} jours d’instruction`,
);
console.log("─".repeat(88));

// ---- Load: where in the year new teaching lands ---------------------------------------------
console.log("\nCharge d’introduction par période");
const maxPhase = Math.max(
  ...plan.phases.map((p) => plan.entries.filter((e) => e.phase === p.code).length),
);
for (const phase of plan.phases) {
  const inPhase = plan.entries.filter((e) => e.phase === phase.code);
  const days = phase.toDay - phase.fromDay + 1;
  const perDay = inPhase.length / days;
  console.log(
    `  ${phase.code}  jours ${pad(phase.fromDay, 3)}-${pad(phase.toDay, 3)}  ${pad(inPhase.length, 3)} objectifs  ` +
      `${perDay.toFixed(2)}/jour  ${bar(inPhase.length, maxPhase)}`,
  );
}
const lastPhase = plan.phases[plan.phases.length - 1];
const inLast = plan.entries.filter((e) => e.phase === lastPhase?.code).length;
console.log(
  inLast === 0
    ? "  → la dernière période n’introduit rien : elle reprend l’année. C’est voulu."
    : `  ⚠ la dernière période introduit encore ${inLast} objectif(s).`,
);

// ---- Domain balance --------------------------------------------------------------------------
console.log("\nÉquilibre des domaines");
const domains = [...new Set(plan.entries.map((e) => e.domainCode))].sort();
const maxDomain = Math.max(
  ...domains.map((d) => plan.entries.filter((e) => e.domainCode === d).length),
);
for (const domain of domains) {
  const rows = plan.entries.filter((e) => e.domainCode === domain);
  const revisits = rows.reduce((sum, e) => sum + e.plannedRevisits, 0);
  console.log(
    `  ${domain.padEnd(12)} ${pad(rows.length, 3)} objectifs  ${pad(revisits, 4)} reprises prévues  ${bar(rows.length, maxDomain, 20)}`,
  );
}

// ---- Repetition: the thing that matters most at this age -------------------------------------
console.log("\nReprises prévues (ce qui fait qu’un apprentissage tient)");
const revisits = plan.entries.map((e) => e.plannedRevisits).sort((a, b) => a - b);
const total = revisits.reduce((s, n) => s + n, 0);
const median = revisits[Math.floor(revisits.length / 2)] ?? 0;
console.log(
  `  min ${revisits[0]} · médiane ${median} · max ${revisits[revisits.length - 1]} · moyenne ${(total / revisits.length).toFixed(1)}`,
);
console.log(
  `  ${total} passages d’objectif à placer sur ${plan.instructionalDays} jours = ${(total / plan.instructionalDays).toFixed(1)} par jour`,
);
const cadences = ["daily", "frequent", "periodic"] as const;
for (const cadence of cadences) {
  const rows = plan.entries.filter((e) => e.cadence === cadence);
  if (rows.length === 0) continue;
  console.log(`  ${cadence.padEnd(9)} ${pad(rows.length, 3)} objectifs`);
}
const thin = plan.entries.filter((e) => e.plannedRevisits <= 2);
if (thin.length > 0) {
  console.log(`  ⚠ ${thin.length} objectif(s) prévus 2 fois ou moins :`);
  for (const e of thin.slice(0, 6)) {
    console.log(`      ${e.objectiveCode.padEnd(22)} introduit vers le jour ${e.introduceByDay}`);
  }
}

// ---- What a home session cannot carry ---------------------------------------------------------
console.log("\nCe qu’une séance à la maison ne porte pas entièrement");
for (const kind of ["school-only", "partial"] as const) {
  const rows = plan.entries.filter((e) => e.homeFeasibility === kind);
  console.log(`  ${kind.padEnd(12)} ${pad(rows.length, 3)}`);
  for (const e of rows) console.log(`      ${e.objectiveCode}`);
}

// ---- The first month ---------------------------------------------------------------------------
const september = plan.entries.filter((e) => e.introduceByDay <= 22);
console.log(`\nPremier mois (jusqu’au jour 22)`);
console.log(
  `  ${september.length} objectifs introduits, le dernier le jour ${Math.max(...september.map((e) => e.introduceByDay))}`,
);
const byDomainSept = new Map<string, number>();
for (const e of september)
  byDomainSept.set(e.domainCode, (byDomainSept.get(e.domainCode) ?? 0) + 1);
console.log(
  "  " +
    [...byDomainSept]
      .sort()
      .map(([d, n]) => `${d} ${n}`)
      .join(" · "),
);
console.log(
  `  reste ${plan.entries.length - september.length} objectifs pour les ${plan.instructionalDays - 22} jours suivants`,
);
console.log("");
