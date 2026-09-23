/**
 * The visual reconfirmation package: what a reviewer needs to accept redrawn pictures (ADR-048).
 *
 *   npm run review:visual                       # both levels, since develop
 *   npm run review:visual -- --level=maternelle-1 --since=develop
 *
 * Writes docs/review/<year>-<level>-reconfirmation-visuelle.md per level, and renders the
 * before/after sheet it embeds (docs/review/media/septembre-avant-apres.png) through
 * scripts/media-contact-sheet.ts.
 *
 * It says only what the repository supports, and it checks the one claim that matters before
 * writing it: that **no reviewable text moved**. Every approval-relevant field of every lesson of
 * the level is compared with the revision in `--since`; if anything but a picture changed, the
 * package is not written and the difference is printed instead. A document that says "only the
 * pictures changed" is worth something only when a machine made the claim.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import { REVIEW_PACKAGES } from "@/lib/content/review-packages";
import { getReferenceData } from "@/lib/content/reference-data";
import { dayOfLessonMap } from "@/lib/content/visual-audit";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, value] = arg.replace(/^--/, "").split("=");
      return [key ?? "", value ?? "true"];
    }),
);
const since = args.get("since") ?? "develop";
const levels = args.has("level") ? [args.get("level")!] : ["maternelle-1", "maternelle-3"];
const SHEET = "docs/review/media/septembre-avant-apres.png";
const DOMAINS = ["lang", "math", "phys", "art", "time-space", "world"];

const git = (a: string[]) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" });
const readJson = (file: string) => JSON.parse(readFileSync(path.join(ROOT, file), "utf8"));
const showJson = (file: string) => JSON.parse(git(["show", `${since}:${file}`]));

type Asset = { id: string; kind: string; alt: string; contentHash: string };
type RawLesson = Record<string, unknown> & {
  id: string;
  title: string;
  status: string;
  review: unknown;
  activities: (Record<string, unknown> & {
    id: string;
    mediaIds: string[];
    payload: Record<string, unknown>;
  })[];
};

/** Everything a reviewer judged, minus the status and the review record themselves. */
const reviewable = (l: RawLesson): string => {
  const copy = { ...l } as Record<string, unknown>;
  delete copy["status"];
  delete copy["review"];
  return JSON.stringify(copy);
};

// A package is written once, against a frozen set: a picture redrawn after submission would
// make the reviewer's answer describe something else.
const finalQa = readJson("docs/september-illustration-state.json").finalQa as
  { frozen: boolean; frozenHashes: Record<string, string> } | undefined;
if (finalQa?.frozen !== true) {
  console.error("the pictures are not frozen (finalQa.frozen); refusing to write the packages");
  process.exit(1);
}
const data = getReferenceData();
const registryNow = readJson("content/media/registry.json").assets as Asset[];
const registryThen = showJson("content/media/registry.json").assets as Asset[];
const changedAssets = registryNow.filter((a) => {
  const before = registryThen.find((b) => b.id === a.id);
  return before === undefined || before.contentHash !== a.contentHash || before.alt !== a.alt;
});
if (changedAssets.length === 0) {
  console.log(`no picture changed since ${since}; nothing to reconfirm`);
  process.exit(0);
}

// The sheet the packages embed, rendered once for both levels.
execFileSync(
  "npx",
  ["tsx", "scripts/media-contact-sheet.ts", `--since=${since}`, `--out=${SHEET}`],
  {
    cwd: ROOT,
    stdio: "inherit",
  },
);

for (const levelId of levels) {
  const levelName = data.levels.find((l) => l.id === levelId)?.name ?? levelId;
  const year = data.annualPlans.find((p) => p.levelId === levelId)?.schoolYearId ?? "2026-2027";
  const days = dayOfLessonMap(levelId, data);
  const weekOf = (day: number) =>
    REVIEW_PACKAGES.find((p) => p.levelId === levelId && day >= p.fromDay && day <= p.toDay)
      ?.week ?? 0;

  const lessonsNow = new Map<string, RawLesson>();
  const lessonsThen = new Map<string, RawLesson>();
  for (const domain of DOMAINS) {
    const file = `content/lessons/maternelle-cycle1-cd-2026/${levelId}/${domain}.json`;
    for (const l of readJson(file).lessons as RawLesson[]) lessonsNow.set(l.id, l);
    for (const l of showJson(file).lessons as RawLesson[]) lessonsThen.set(l.id, l);
  }
  const textsNow = JSON.stringify(readJson(`content/texts/${levelId}.json`));
  const textsThen = JSON.stringify(showJson(`content/texts/${levelId}.json`));

  // The claim, checked before it is written.
  const moved: string[] = [];
  for (const [id, now] of lessonsNow) {
    const then = lessonsThen.get(id);
    if (then === undefined) moved.push(`${id}: new since ${since}`);
    else if (reviewable(then) !== reviewable(now)) moved.push(`${id}: a reviewable field changed`);
  }
  if (textsThen !== textsNow) moved.push(`content/texts/${levelId}.json changed`);
  // Progression, programme, curriculum and calendar: none of them may move under a visual change.
  for (const dir of ["content/programmes", "content/curriculum", "content/calendars"]) {
    try {
      execFileSync("git", ["diff", "--quiet", since, "--", dir], { cwd: ROOT });
    } catch {
      moved.push(`${dir} changed since ${since}`);
    }
  }
  if (moved.length > 0) {
    console.error(`${levelId}: the package cannot claim that only pictures changed:`);
    for (const m of moved) console.error(`  - ${m}`);
    process.exit(1);
  }

  const lapsed = [...lessonsNow.values()]
    .filter((l) => l.status === "review" && lessonsThen.get(l.id)?.status === "approved")
    .sort((a, b) => (days.get(a.id) ?? 0) - (days.get(b.id) ?? 0) || a.id.localeCompare(b.id));
  const illustrationOf = new Map(data.texts.map((t) => [t.id, t.illustrationId]));
  const picturesOf = (l: RawLesson) =>
    new Set(
      l.activities.flatMap((a) => {
        const ids = [...a.mediaIds];
        const t = a.payload["textId"];
        const ill = typeof t === "string" ? illustrationOf.get(t) : null;
        if (ill) ids.push(ill);
        return ids;
      }),
    );
  const shownHere = changedAssets.filter((a) =>
    [...lessonsNow.values()].some((l) => picturesOf(l).has(a.id)),
  );

  const lines: string[] = [];
  lines.push(
    `# Reconfirmation visuelle — ${levelName}, septembre ${year.slice(0, 4)}`,
    "",
    "`SEPTEMBER_VISUAL_ASSETS_FROZEN_FOR_RECONFIRMATION` — les images sont figées ; leurs empreintes",
    "sont vérifiées par un test tant que la relecture n’a pas eu lieu (`docs/work/SEPTEMBER_VISUAL_QA.md`).",
    "",
    "> **Ce document est généré** (`npm run review:visual`). Il ne demande pas une relecture",
    "> complète : les mots lus à l’enfant et à l’adulte, les objectifs, les durées et le matériel",
    "> sont **identiques, octet pour octet**, à la version que vous aviez acceptée — le script qui",
    "> écrit ce document le vérifie avant d’écrire, et refuse d’écrire si ce n’est pas vrai. Seules",
    "> **les images** ont changé.",
    "",
    "## Ce qui s’est passé",
    "",
    "Les images de septembre ont été redessinées pour être plus chaleureuses, plus lisibles et",
    "cohérentes entre elles (`docs/september-illustration-upgrade-plan.md`) : une seule encre, des",
    "aplats avec une ombre, une peau brune pour les enfants et les parties du corps, un sol sous",
    "chaque chose, un visage sur les personnes et les animaux seulement. Les huit formes",
    "géométriques n’ont pas bougé.",
    "",
    "L’empreinte d’une approbation couvre les octets de chaque image montrée à l’enfant (ISSUE-026).",
    `Les approbations de **${lapsed.length} leçon(s)** de cette classe ont donc été annulées — pas`,
    "re-tamponnées — et ce document vous demande de confirmer que les nouvelles images servent",
    "toujours ce que chaque leçon enseigne (ADR-048).",
    "",
    "## La planche avant / après",
    "",
    `![Avant / après : chaque image redessinée, aux trois tailles de l’application](media/${path.basename(SHEET)})`,
    "",
    `La planche montre chaque image aux trois tailles de l’application : 72 px (une rangée à`,
    "compter), 128 px (une carte de mot), 256 px (l’image d’une histoire).",
    "",
    `## Les images que cette classe montre — ${shownHere.length}`,
    "",
    "| Image | Type | Description avant | Description après | Leçons de cette classe |",
    "| --- | --- | --- | --- | --- |",
  );
  for (const a of shownHere) {
    const before = registryThen.find((b) => b.id === a.id);
    const users = [...lessonsNow.values()].filter((l) => picturesOf(l).has(a.id)).map((l) => l.id);
    lines.push(
      `| \`${a.id}\` | ${a.kind} | ${before?.alt ?? "_nouvelle_"} | ${a.alt} | ${users.length} — ${users.join(", ")} |`,
    );
  }
  const short = (h: string | undefined) => (h ? h.slice(7, 19) : "—");
  const levelLessons = [...lessonsNow.values()];
  const unaffected = levelLessons.length - lapsed.length;
  lines.push(
    "",
    "## Résumé",
    "",
    "| Mesure | Valeur |",
    "| --- | --- |",
    `| Leçons de la classe | ${levelLessons.length} |`,
    `| Leçons concernées (approbation annulée) | ${lapsed.length} |`,
    `| Leçons non concernées | ${unaffected} |`,
    `| Images modifiées (toutes classes) | ${changedAssets.length} |`,
    `| Images inchangées (toutes classes) | ${registryNow.length - changedAssets.length} |`,
    "| Texte pédagogique modifié (enfant ou adulte) | **0** — vérifié champ par champ |",
    "| Objectifs modifiés | **0** — vérifié |",
    "| Progression, programme, calendrier modifiés | **0** — vérifié |",
    "| Seuls les images et leur description ont changé | **oui** |",
    "",
    "## Chaque activité concernée, semaine par semaine",
    "",
    "Pour chaque ligne : aucun texte lu à l’enfant, aucun texte lu à l’adulte, aucun objectif et",
    "aucune progression n’a changé (vérifié avant l’écriture de ce document). **La seule raison**",
    "du changement d’empreinte est la ligne « image » : ses octets ont changé, et l’empreinte d’une",
    "approbation couvre les octets de chaque image montrée (ISSUE-026, ADR-048).",
    "",
  );
  const byWeek = new Map<number, RawLesson[]>();
  for (const l of lapsed) {
    const w = weekOf(days.get(l.id) ?? 0);
    byWeek.set(w, [...(byWeek.get(w) ?? []), l]);
  }
  for (const [w, ls] of [...byWeek].sort((a, b) => a[0] - b[0])) {
    lines.push(
      `### Semaine ${w} — ${ls.length} leçon(s)`,
      "",
      "| Jour | Leçon | Activité | Image | Empreinte avant | Empreinte après | Description avant | Description après | Texte enfant | Texte adulte | Objectif / progression |",
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    );
    for (const l of ls) {
      for (const a of l.activities) {
        const ids = [...a.mediaIds];
        const t = a.payload["textId"];
        const ill = typeof t === "string" ? illustrationOf.get(t) : null;
        if (ill) ids.push(ill);
        for (const id of ids) {
          const now = changedAssets.find((c) => c.id === id);
          if (now === undefined) continue;
          const then = registryThen.find((b) => b.id === id);
          lines.push(
            `| ${days.get(l.id)} | \`${l.id}\` ${l.title} | \`${a.id}\` ${String(a["title"] ?? "")} | \`${id}\` | \`${short(then?.contentHash)}\` | \`${short(now.contentHash)}\` | ${then?.alt ?? "—"} | ${now.alt} | inchangé | inchangé | inchangés |`,
          );
        }
      }
    }
    lines.push("");
  }
  lines.push(
    "## Ce que l’on vous demande",
    "",
    "Pour chaque image de la planche, et en pensant à l’enfant qui la regarde pendant l’activité :",
    "",
    "1. l’image montre-t-elle bien **la chose que la leçon nomme** — la main, le pied, Lisa, le seau,",
    "   trois cailloux différents — sans rien qui détourne l’attention ?",
    "2. est-elle **lisible à 72 px** quand elle est répétée dans une rangée à compter ?",
    "3. la description (`alt`, lue par une synthèse vocale à une famille francophone) dit-elle ce",
    "   que l’image montre ?",
    "4. voyez-vous une image qui **contredit** ce qu’une leçon dit — un geste, un nombre, une",
    "   orientation ?",
    "",
    "Répondez **`accepted`** (les images conviennent), ou **`accepted-with-modifications`** en",
    "nommant l’image et ce qui doit changer.",
    "",
    "## Comment le résultat est enregistré",
    "",
    "Une entrée `full-review` par semaine dans `content/reviews/history.json`, avec la date, la",
    "décision et votre résumé ; puis `npx tsx scripts/approve-week.ts --level=" +
      levelId +
      " --week=<n>` recalcule chaque empreinte sur les images d’aujourd’hui — aucune empreinte",
    "n’est reprise d’avant. Une image à corriger est redessinée dans `tools/media/build.ts`, la",
    "planche est régénérée, et ce document aussi.",
    "",
  );

  const file = path.join(ROOT, `docs/review/${year}-${levelId}-reconfirmation-visuelle.md`);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(
    file,
    await format(lines.join("\n"), { ...(await resolveConfig(file)), filepath: file }),
    "utf8",
  );
  console.log(
    `docs/review/${year}-${levelId}-reconfirmation-visuelle.md: ${lapsed.length} lapsed lesson(s), ${shownHere.length} picture(s)`,
  );
}
