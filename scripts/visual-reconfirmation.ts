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
import { shownPictureIds } from "@/domain/lessons/pictures";
import { STORY_LINES_PER_PAGE } from "@/domain/lessons/texts";
import type { ActivityType } from "@/domain/lessons/types";
import { assetFingerprint } from "@/domain/media/types";
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
const SHEET = args.get("sheet") ?? "docs/review/media/september-rich-media-rollout-comparison.png";
const DOMAINS = ["lang", "math", "phys", "art", "time-space", "world"];

const git = (a: string[]) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" });
const readJson = (file: string) => JSON.parse(readFileSync(path.join(ROOT, file), "utf8"));
const showJson = (file: string) => JSON.parse(git(["show", `${since}:${file}`]));

type Asset = {
  id: string;
  kind: string;
  file: string;
  alt: string;
  contentHash: string;
  sequence?: {
    frames: { file: string; alt: string; contentHash: string }[];
    pageFrames: number[];
  };
};
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
  // `mediaIds` is compared separately: a corrected picture association is a media change the
  // package must *show*, not a text change it must refuse (ADR-048, m3-art-04-a1).
  copy["activities"] = l.activities.map((a) => ({ ...a, mediaIds: undefined }));
  return JSON.stringify(copy);
};

/** Every picture association an activity changed, so the package names it. */
type AssociationChange = {
  lesson: RawLesson;
  activityId: string;
  title: string;
  before: string[];
  after: string[];
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
  // The whole fingerprint: a redrawn frame of a story sequence is a picture change to reconfirm.
  return before === undefined || assetFingerprint(before) !== assetFingerprint(a);
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
  const associations: AssociationChange[] = [];
  for (const [id, now] of lessonsNow) {
    const then = lessonsThen.get(id);
    if (then === undefined) moved.push(`${id}: new since ${since}`);
    else if (reviewable(then) !== reviewable(now)) moved.push(`${id}: a reviewable field changed`);
    else {
      for (const a of now.activities) {
        const b = then.activities.find((x) => x.id === a.id);
        if (b !== undefined && JSON.stringify(b.mediaIds) !== JSON.stringify(a.mediaIds)) {
          associations.push({
            lesson: now,
            activityId: a.id,
            title: String(a["title"] ?? ""),
            before: b.mediaIds,
            after: a.mediaIds,
          });
        }
      }
    }
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
    "`SEPTEMBER_RICH_MEDIA_BATCH_FROZEN_FOR_REVIEW` — les images de ce lot sont figées ;",
    "leurs fichiers, dimensions et empreintes exactes sont consignés dans",
    "`docs/september-rich-media-audit.json` jusqu’à la décision du propriétaire.",
    "",
    "> **Ce document est généré** (`npm run review:visual`). Il ne demande pas une relecture",
    "> complète : les mots lus à l’enfant et à l’adulte, les objectifs, les durées et le matériel",
    "> sont **identiques, octet pour octet**, à la version que vous aviez acceptée — le script qui",
    "> écrit ce document le vérifie avant d’écrire, et refuse d’écrire si ce n’est pas vrai. Seules",
    "> **les images** ont changé.",
    "",
    "## Ce qui s’est passé",
    "",
    `${changedAssets.length} image(s) de septembre ont été remplacées localement par des illustrations`,
    "WebP plus chaleureuses, expressives et proches d’un album préscolaire. Une histoire peut utiliser",
    "une courte séquence alignée sur ses pages existantes. Aucun texte n’a été réécrit ; les personnages,",
    "objets, quantités, actions et décors doivent être jugés contre le texte approuvé.",
    `Les ${registryNow.length - changedAssets.length} autres images, dont toutes les formes géométriques, n’ont pas bougé.`,
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
  const sequencedHere = shownHere.filter((asset) => asset.sequence !== undefined);
  if (sequencedHere.length > 0) {
    lines.push(
      "",
      "## Séquences des histoires",
      "",
      "| Histoire | Page(s) | Fichier | SHA-256 | Description exacte de la scène |",
      "| --- | --- | --- | --- | --- |",
      ...sequencedHere.flatMap((asset) =>
        asset.sequence!.frames.map((frame, index) => {
          const pages = asset
            .sequence!.pageFrames.flatMap((frameIndex, page) =>
              frameIndex === index ? [page + 1] : [],
            )
            .join(", ");
          return `| \`${asset.id}\` | ${pages} | \`public/media/${frame.file}\` | \`${frame.contentHash}\` | ${frame.alt} |`;
        }),
      ),
      "",
      "L’empreinte d’approbation ne se limite pas au hash principal affiché dans le tableau des",
      "activités : `assetFingerprint` inclut la description et le SHA-256 de **chaque cadre**, puis",
      "la table `pageFrames`. `lessonDigest` reçoit cette empreinte complète pour toute leçon qui",
      "utilise l’image ; modifier n’importe quel cadre annule donc l’approbation.",
    );
  }
  const reviewedTexts = data.texts.filter(
    (text) =>
      text.illustrationId !== null && shownHere.some((asset) => asset.id === text.illustrationId),
  );
  if (reviewedTexts.length > 0) {
    lines.push(
      "",
      "## Texte approuvé et image montrée, page par page",
      "",
      "Ces extraits sont les mots canoniques réellement affichés dans l’application. Ils permettent",
      "de juger chaque scène sans devoir consulter un autre fichier. Une histoire avance par groupes",
      `de ${STORY_LINES_PER_PAGE} lignes ; une comptine tient sur une seule page.`,
      "",
    );
    for (const text of reviewedTexts) {
      const asset = shownHere.find((candidate) => candidate.id === text.illustrationId)!;
      lines.push(`### \`${asset.id}\` — ${text.title}`, "");
      const pages =
        text.kind === "rhyme"
          ? [text.lines]
          : Array.from({ length: Math.ceil(text.lines.length / STORY_LINES_PER_PAGE) }, (_, page) =>
              text.lines.slice(
                page * STORY_LINES_PER_PAGE,
                page * STORY_LINES_PER_PAGE + STORY_LINES_PER_PAGE,
              ),
            );
      for (const [page, pageLines] of pages.entries()) {
        // The real renderer pages a sequence only for a story. A rhyme or another text shows the
        // asset's primary file, even when that asset also carries a story sequence.
        const frameIndex = text.kind === "story" ? asset.sequence?.pageFrames[page] : undefined;
        const frame = frameIndex === undefined ? undefined : asset.sequence?.frames[frameIndex];
        const shownFile = frame?.file ?? asset.file;
        const shownAlt = frame?.alt ?? asset.alt;
        lines.push(
          `- **Page ${page + 1} — image :** \`public/media/${shownFile}\``,
          `  - Description accessible : ${shownAlt}`,
          "  - Texte affiché :",
          ...pageLines.map((line) => `    > ${line}`),
          "",
        );
      }
    }
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
    `| Associations image / activité corrigées | ${associations.length} |`,
    `| Seuls les images, leur description${associations.length > 0 ? " et ces associations" : ""} ont changé | **oui** |`,
    "",
    ...(associations.length === 0
      ? []
      : [
          "## Association image / activité corrigée",
          "",
          "La relecture a relevé qu’une activité montrait une image sans rapport avec ce qu’elle demande.",
          "Seule l’image **associée** a changé : aucun mot, aucun objectif, aucune durée, aucune",
          "progression. Un test vérifie désormais que chaque image montrée partage un mot avec ce que",
          "l’activité demande (`lib/content/media-consistency.ts`).",
          "",
          "| Leçon | Activité | Images associées avant | Images associées après | Image montrée à l’enfant |",
          "| --- | --- | --- | --- | --- |",
          ...associations.map(
            (c) =>
              `| \`${c.lesson.id}\` ${c.lesson.title} | \`${c.activityId}\` ${c.title} | ${c.before.map((id) => `\`${id}\``).join(", ") || "aucune (l’image de la comptine lue par-dessus)"} | ${c.after.map((id) => `\`${id}\``).join(", ")} | \`${c.after[0]}\` |`,
          ),
          "",
        ]),
    "## Chaque activité concernée, semaine par semaine",
    "",
    "Pour chaque ligne : aucun texte lu à l’enfant, aucun texte lu à l’adulte, aucun objectif et",
    "aucune progression n’a changé (vérifié avant l’écriture de ce document). **La seule raison**",
    "du changement d’empreinte est la présentation visuelle : les octets des images, leurs descriptions",
    "accessibles et, pour une séquence, sa table page-cadre participent à l’empreinte couverte par",
    "l’approbation (ISSUE-026, ADR-048).",
    "Pour une séquence, les colonnes « empreinte » ci-dessous abrègent le hash du cadre principal ;",
    "la section « Séquences des histoires » donne tous les SHA-256 et explique l’empreinte complète.",
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
      "| Jour | Leçon | Activité | Image | Rôle | Empreinte avant | Empreinte après | Description avant | Description après | Texte enfant | Texte adulte | Objectif / progression |",
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    );
    for (const l of ls) {
      for (const a of l.activities) {
        const ids = [...a.mediaIds];
        const t = a.payload["textId"];
        const ill = typeof t === "string" ? illustrationOf.get(t) : null;
        if (ill) ids.push(ill);
        // Which of these the child actually sees (domain/lessons/pictures.ts): a reviewer must
        // never mistake a picture carried by a rhyme or story, but not shown, for the activity's.
        const text = typeof t === "string" ? data.texts.find((x) => x.id === t) : undefined;
        const shown = new Set(
          shownPictureIds(
            { type: a["type"] as ActivityType, mediaIds: a.mediaIds },
            text === undefined ? null : { kind: text.kind, illustrationId: text.illustrationId },
          ),
        );
        for (const id of ids) {
          const role = shown.has(id)
            ? "principale — montrée à l’enfant"
            : "secondaire — liée au texte ou à l’activité, non montrée";
          const now = changedAssets.find((c) => c.id === id);
          if (now === undefined) continue;
          const then = registryThen.find((b) => b.id === id);
          lines.push(
            `| ${days.get(l.id)} | \`${l.id}\` ${l.title} | \`${a.id}\` ${String(a["title"] ?? "")} | \`${id}\` | ${role} | \`${short(then?.contentHash)}\` | \`${short(now.contentHash)}\` | ${then?.alt ?? "—"} | ${now.alt} | inchangé | inchangé | inchangés |`,
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
    "1. l’image montre-t-elle bien **la chose, le geste ou la scène que la leçon nomme**, sans détail",
    "   contradictoire ou distrayant ?",
    "2. est-elle **lisible à 72 px** quand elle est répétée dans une rangée à compter ?",
    "3. la description (`alt`, lue par une synthèse vocale à une famille francophone) dit-elle ce",
    "   que l’image montre ?",
    "4. voyez-vous une image qui **contredit** ce qu’une leçon dit — geste, quantité, personnage,",
    "   objet, émotion, lieu ou ordre temporel ?",
    "5. dans chaque histoire, l’identité, l’âge, la peau et les vêtements des personnages restent-ils",
    "   cohérents, et chaque scène correspond-elle vraiment aux lignes de sa page ?",
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
