/**
 * Draws the September visual set and writes content/media/registry.json (ADR-042).
 *
 *   npx tsx tools/media/build.ts
 *
 * The SVGs are committed; this exists so the set stays consistent and can be regenerated and
 * reviewed as a whole, like tools/annual-plan/build.ts. It is not run at build time.
 *
 * Style (docs/september-illustration-upgrade-plan.md): one ink, flat fills with a single shade,
 * a warm brown skin for people and body parts, a soft ground, faces on people and animals only,
 * recognisable at arm's length on a phone. Colour never carries meaning — the child is asked for
 * *the square*, never for *the blue one*. The shapes keep the original constants on purpose.
 */
import { createHash } from "node:crypto";
import { format, resolveConfig } from "prettier";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(ROOT, "public/media");
const SIZE = 200;

// The original palette, kept only for the eight shapes, which are byte-identical (ADR-048).
const INK = "#1f2937";
const BLUE = "#6aa9d8";
const GREEN = "#79b98a";
const AMBER = "#e9b96e";
const CLAY = "#c9785f";

// ---- the September illustration system (docs/september-illustration-upgrade-plan.md) ----------
//
// One ink, flat fills with a single shade, a warm brown skin for people and body parts, a soft
// ground under things, faces on people and animals only. The legacy constants above stay for the
// shapes, which are deliberately unchanged (ADR-048); everything else moves to this palette.
const LINE = "#2b2a33";
const GROUND = "#efe9dc";
const P = {
  paper: ["#fffdf7", "#efe9dc"],
  sky: ["#7cbbe6", "#5395c4"],
  leaf: ["#86c692", "#5fa46e"],
  sun: ["#f3c86d", "#d9a63f"],
  clay: ["#e08d6a", "#bf6a4b"],
  stone: ["#c9c2b4", "#a49c8e"],
  skin: ["#9a6540", "#7a4c2e"],
  berry: ["#d8626b", "#b34650"],
  night: ["#3f4c7a", "#2d3759"],
} as const;
type Tone = keyof typeof P;
const base = (tone: Tone): string => P[tone][0];
const shade = (tone: Tone): string => P[tone][1];

/** The outline every drawing shares. */
const OUTLINE = `stroke="${LINE}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;

/** The soft ellipse a thing stands on. No outline: it is a shadow, not an object. */
const ground = (cx = 100, cy = 176, rx = 66, ry = 9): string =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${GROUND}"/>`;

/** Two dot eyes and a small smile. People and animals only; never on an object or a shape. */
const face = (cx: number, cy: number, spread = 16, r = 4.5, mouth: "smile" | "o" = "smile") => {
  // The mouth scales with the eyes. A 6 px smile under 4 px eyes on a small head read as a beard
  // at television size (final visual QA, 2026-09-23); now it is a thin line in proportion.
  const w = Math.max(2.5, r * 0.75);
  const half = spread * 0.36;
  const dy = r * 2.4;
  return (
    `<circle cx="${cx - spread / 2}" cy="${cy}" r="${r}" fill="${LINE}"/>` +
    `<circle cx="${cx + spread / 2}" cy="${cy}" r="${r}" fill="${LINE}"/>` +
    (mouth === "o"
      ? `<circle cx="${cx}" cy="${cy + dy + 1}" r="${r * 0.7}" fill="${LINE}"/>`
      : `<path d="M${cx - half} ${cy + dy} q${half} ${half * 0.8} ${half * 2} 0" fill="none" stroke="${LINE}" stroke-width="${w}" stroke-linecap="round"/>`)
  );
};

/** A capsule — a finger, an arm, a leg: an ink line with a fill line on top, 6 px of outline. */
const capsule = (x1: number, y1: number, x2: number, y2: number, width: number, fill: string) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${LINE}" stroke-width="${width + 12}" stroke-linecap="round"/>` +
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${fill}" stroke-width="${width}" stroke-linecap="round"/>`;

/**
 * An open hand, palm out. `thumb` says which side the thumb is on (+1: to the right), so a pair of
 * hands has its thumbs facing each other, as real raised hands do. Finger heights run from the
 * little finger to the index; a folded finger is a short bump, and a folded thumb lies across the
 * palm — which is how « trois doigts » is shown.
 */
function hand(o: {
  cx: number;
  top: number;
  thumb: 1 | -1;
  scale?: number;
  heights?: readonly number[];
  folded?: readonly boolean[];
  thumbFolded?: boolean;
}): string {
  // Redrawn in the final visual QA: one skin fill with no inner cuff (it read as a glove), a
  // rounder palm, fingers fanning slightly outward, a narrow wrist. No palm crease: it read as a frown.
  const s = o.scale ?? 1;
  const { cx, top, thumb } = o;
  const w = 54 * s;
  const h = 58 * s;
  const spacing = 13 * s;
  const finger = 11.5 * s;
  const heights = (o.heights ?? [34, 46, 52, 47]).map((v) => v * s);
  const folded = o.folded ?? [false, false, false, false];
  const skin = base("skin");
  const parts: string[] = [
    `<rect x="${cx - 14 * s}" y="${top + h - 16 * s}" width="${28 * s}" height="${34 * s}" rx="${10 * s}" fill="${skin}" ${OUTLINE}/>`,
  ];
  [-1.5, -0.5, 0.5, 1.5].forEach((k, i) => {
    const fx = cx + thumb * k * spacing;
    const rise = folded[i] ? 8 * s : heights[i]!;
    const lean = thumb * k * 0.1 * rise;
    parts.push(capsule(fx, top + 14 * s, fx + lean, top + 14 * s - rise, finger, skin));
  });
  if (!o.thumbFolded) {
    const tx = cx + thumb * (w / 2 - 8 * s);
    const ty = top + h * 0.62;
    parts.push(capsule(tx, ty, tx + thumb * 22 * s, ty - 22 * s, finger, skin));
  }
  parts.push(
    `<rect x="${cx - w / 2}" y="${top}" width="${w}" height="${h}" rx="${24 * s}" fill="${skin}" ${OUTLINE}/>`,
  );
  if (o.thumbFolded) {
    const tx = cx + thumb * (w / 2 - 6 * s);
    parts.push(capsule(tx, top + h * 0.56, cx + thumb * 8 * s, top + h * 0.4, finger * 0.9, skin));
  }
  return parts.join("\n      ");
}

/** Kumu: a round chick, facing left, drawn once and reused in the story picture. */
function chick(cx: number, cy: number, s = 1): string {
  const body = base("sun");
  return [
    capsule(cx - 10 * s, cy + 28 * s, cx - 12 * s, cy + 44 * s, 5 * s, base("clay")),
    capsule(cx + 12 * s, cy + 28 * s, cx + 14 * s, cy + 44 * s, 5 * s, base("clay")),
    `<circle cx="${cx}" cy="${cy}" r="${34 * s}" fill="${shade("sun")}" ${OUTLINE}/>`,
    `<circle cx="${cx}" cy="${cy - 4 * s}" r="${30 * s}" fill="${body}"/>`,
    `<ellipse cx="${cx + 10 * s}" cy="${cy + 4 * s}" rx="${16 * s}" ry="${10 * s}" transform="rotate(-25 ${cx + 10 * s} ${cy + 4 * s})" fill="${shade("sun")}" ${OUTLINE}/>`,
    `<circle cx="${cx - 24 * s}" cy="${cy - 30 * s}" r="${22 * s}" fill="${body}" ${OUTLINE}/>`,
    `<path d="M${cx - 34 * s} ${cy - 44 * s} q2 -10 8 -12 M${cx - 26 * s} ${cy - 48 * s} q0 -8 6 -10" fill="none" ${OUTLINE}/>`,
    `<polygon points="${cx - 46 * s},${cy - 30 * s} ${cx - 60 * s},${cy - 24 * s} ${cx - 46 * s},${cy - 18 * s}" fill="${base("clay")}" ${OUTLINE}/>`,
    `<circle cx="${cx - 30 * s}" cy="${cy - 34 * s}" r="${4 * s}" fill="${LINE}"/>`,
  ].join("\n      ");
}

/** A hen, facing left: round body, comb, wattle, tail feathers, legs on a ground. */
function hen(cx: number, cy: number, s = 1): string {
  const body = base("paper");
  return [
    capsule(cx - 8 * s, cy + 30 * s, cx - 10 * s, cy + 50 * s, 6 * s, base("sun")),
    capsule(cx + 16 * s, cy + 30 * s, cx + 18 * s, cy + 50 * s, 6 * s, base("sun")),
    `<path d="M${cx + 30 * s} ${cy - 10 * s} q24 -30 34 -8 M${cx + 34 * s} ${cy} q28 -20 36 4 M${cx + 34 * s} ${cy + 10 * s} q26 -6 32 12" fill="none" ${OUTLINE}/>`,
    `<ellipse cx="${cx}" cy="${cy + 4 * s}" rx="${48 * s}" ry="${36 * s}" fill="${shade("paper")}" ${OUTLINE}/>`,
    `<ellipse cx="${cx}" cy="${cy}" rx="${44 * s}" ry="${30 * s}" fill="${body}"/>`,
    `<ellipse cx="${cx + 8 * s}" cy="${cy + 6 * s}" rx="${22 * s}" ry="${13 * s}" transform="rotate(-20 ${cx + 8 * s} ${cy + 6 * s})" fill="${shade("paper")}" ${OUTLINE}/>`,
    `<circle cx="${cx - 40 * s}" cy="${cy - 30 * s}" r="${20 * s}" fill="${body}" ${OUTLINE}/>`,
    `<circle cx="${cx - 50 * s}" cy="${cy - 50 * s}" r="${6 * s}" fill="${base("berry")}" ${OUTLINE}/>`,
    `<circle cx="${cx - 40 * s}" cy="${cy - 54 * s}" r="${6 * s}" fill="${base("berry")}" ${OUTLINE}/>`,
    `<circle cx="${cx - 30 * s}" cy="${cy - 50 * s}" r="${6 * s}" fill="${base("berry")}" ${OUTLINE}/>`,
    `<polygon points="${cx - 60 * s},${cy - 32 * s} ${cx - 76 * s},${cy - 26 * s} ${cx - 60 * s},${cy - 20 * s}" fill="${base("sun")}" ${OUTLINE}/>`,
    `<circle cx="${cx - 56 * s}" cy="${cy - 14 * s}" r="${5 * s}" fill="${base("berry")}" ${OUTLINE}/>`,
    `<circle cx="${cx - 44 * s}" cy="${cy - 34 * s}" r="${4 * s}" fill="${LINE}"/>`,
  ].join("\n      ");
}

/**
 * Bibi, and the little cabri of the rhyme: a goat with curved horns, a beard and a tail.
 * `facing` is the direction of the head (+1 right); `jumping` lifts the legs off the ground.
 */
function goat(cx: number, cy: number, s = 1, facing: 1 | -1 = -1, jumping = false): string {
  const body = base("paper");
  const f = facing;
  const legs = jumping
    ? [
        capsule(cx - f * 22 * s, cy + 16 * s, cx - f * 46 * s, cy + 34 * s, 7 * s, body),
        capsule(cx - f * 32 * s, cy + 12 * s, cx - f * 58 * s, cy + 22 * s, 7 * s, body),
        capsule(cx + f * 22 * s, cy + 16 * s, cx + f * 42 * s, cy + 38 * s, 7 * s, body),
        capsule(cx + f * 32 * s, cy + 12 * s, cx + f * 54 * s, cy + 28 * s, 7 * s, body),
      ]
    : [
        capsule(cx - 30 * s, cy + 18 * s, cx - 30 * s, cy + 48 * s, 7 * s, body),
        capsule(cx - 14 * s, cy + 18 * s, cx - 14 * s, cy + 48 * s, 7 * s, body),
        capsule(cx + 14 * s, cy + 18 * s, cx + 14 * s, cy + 48 * s, 7 * s, body),
        capsule(cx + 30 * s, cy + 18 * s, cx + 30 * s, cy + 48 * s, 7 * s, body),
      ];
  const hx = cx + f * 44 * s;
  const hy = cy - 22 * s;
  return [
    ...legs,
    capsule(cx - f * 42 * s, cy - 8 * s, cx - f * 52 * s, cy - 24 * s, 6 * s, body),
    `<rect x="${cx - 44 * s}" y="${cy - 22 * s}" width="${88 * s}" height="${46 * s}" rx="${22 * s}" fill="${shade("paper")}" ${OUTLINE}/>`,
    `<rect x="${cx - 41 * s}" y="${cy - 19 * s}" width="${82 * s}" height="${32 * s}" rx="${18 * s}" fill="${body}"/>`,
    `<path d="M${hx - f * 8 * s} ${hy - 16 * s} q${-f * 6 * s} -20 ${f * 8 * s} -22 M${hx + f * 6 * s} ${hy - 16 * s} q${-f * 2 * s} -22 ${f * 14 * s} -20" fill="none" ${OUTLINE}/>`,
    `<ellipse cx="${hx - f * 16 * s}" cy="${hy - 6 * s}" rx="${10 * s}" ry="${6 * s}" fill="${body}" ${OUTLINE}/>`,
    `<circle cx="${hx}" cy="${hy}" r="${20 * s}" fill="${body}" ${OUTLINE}/>`,
    `<polygon points="${hx + f * 4 * s},${hy + 16 * s} ${hx + f * 10 * s},${hy + 30 * s} ${hx + f * 16 * s},${hy + 14 * s}" fill="${base("stone")}" ${OUTLINE}/>`,
    `<circle cx="${hx + f * 8 * s}" cy="${hy - 4 * s}" r="${4 * s}" fill="${LINE}"/>`,
    `<circle cx="${hx + f * 18 * s}" cy="${hy + 6 * s}" r="${3 * s}" fill="${LINE}"/>`,
  ].join("\n      ");
}

/** A cloud, or a bush: overlapping circles outlined once, then filled again to hide the joins. */
function puffs(circles: readonly [number, number, number][], fill: string): string {
  const outlined = circles
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${OUTLINE}/>`)
    .join("");
  const filled = circles
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`)
    .join("");
  return outlined + filled;
}

type Asset = {
  id: string;
  kind: "shape" | "object" | "animal" | "illustration";
  file: string;
  alt: string;
  tags: string[];
  body: string;
};

/** A shape, drawn large and plain: the form is the whole point. */
const shape = (id: string, alt: string, body: string, tags: string[]): Asset => ({
  id,
  kind: "shape",
  file: `shapes/${id}.svg`,
  alt,
  tags,
  body,
});

const SHAPES: Asset[] = [
  shape(
    "forme-carre",
    "Un carré",
    `<rect x="40" y="40" width="120" height="120" rx="4" fill="${BLUE}" stroke="${INK}" stroke-width="6"/>`,
    ["carré", "forme", "quatre côtés"],
  ),
  shape(
    "forme-rectangle",
    "Un rectangle",
    `<rect x="20" y="60" width="160" height="80" rx="4" fill="${GREEN}" stroke="${INK}" stroke-width="6"/>`,
    ["rectangle", "forme", "quatre côtés"],
  ),
  shape(
    "forme-triangle",
    "Un triangle",
    `<polygon points="100,35 170,160 30,160" fill="${AMBER}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`,
    ["triangle", "forme", "trois côtés"],
  ),
  shape(
    "forme-disque",
    "Un disque, tout rond",
    `<circle cx="100" cy="100" r="65" fill="${CLAY}" stroke="${INK}" stroke-width="6"/>`,
    ["disque", "rond", "cercle", "forme"],
  ),
  // A second exemplar of each shape, because MATH-S03-C01-O07 asks the child to classify
  // « indépendamment d'autres critères comme la couleur, la taille, l'orientation » — and one
  // canonical drawing per category teaches the prototype instead. Each variant deliberately
  // wears the colour of a *different* shape above, so colour cannot become the cue.
  shape(
    "forme-carre-penche",
    "Un carré posé de biais, plus petit",
    `<rect x="62" y="62" width="76" height="76" rx="4" fill="${AMBER}" stroke="${INK}" stroke-width="6" transform="rotate(30 100 100)"/>`,
    ["carré", "forme", "quatre côtés", "de biais"],
  ),
  shape(
    "forme-rectangle-debout",
    "Un rectangle debout, plus haut que large",
    `<rect x="68" y="25" width="64" height="150" rx="4" fill="${CLAY}" stroke="${INK}" stroke-width="6"/>`,
    ["rectangle", "forme", "quatre côtés", "debout"],
  ),
  shape(
    "forme-triangle-quelconque",
    "Un triangle aux trois côtés différents, posé de travers",
    `<polygon points="45,40 175,95 80,170" fill="${BLUE}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`,
    ["triangle", "forme", "trois côtés", "de biais"],
  ),
  shape(
    "forme-disque-petit",
    "Un petit disque, tout rond",
    `<circle cx="100" cy="100" r="40" fill="${GREEN}" stroke="${INK}" stroke-width="6"/>`,
    ["disque", "rond", "cercle", "forme", "petit"],
  ),
];

/** Objects a September lesson names: the three vocabulary corpora and what gets counted. */
const OBJECTS: [id: string, alt: string, tags: string[], body: string][] = [
  [
    "objet-cuillere",
    "Une cuillère",
    ["cuillère", "maison", "compter"],
    `${ground(100, 184, 44, 6)}
      <path d="M92 100 h16 l-3 70 q-5 8 -10 0 z" fill="${base("stone")}" ${OUTLINE}/>
      <ellipse cx="100" cy="66" rx="30" ry="38" fill="${base("stone")}" ${OUTLINE}/>
      <ellipse cx="100" cy="68" rx="19" ry="26" fill="${shade("stone")}"/>
      <ellipse cx="92" cy="54" rx="5" ry="9" fill="${base("paper")}"/>`,
  ],
  [
    "objet-crayon",
    "Un crayon",
    ["crayon", "école", "écrire"],
    `${ground(100, 184, 40, 6)}
      <rect x="82" y="14" width="36" height="16" rx="4" fill="${base("berry")}" ${OUTLINE}/>
      <rect x="78" y="28" width="44" height="14" fill="${base("stone")}" ${OUTLINE}/>
      <rect x="78" y="42" width="44" height="98" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="108" y="45" width="11" height="92" fill="${shade("sun")}"/>
      <polygon points="78,140 122,140 100,178" fill="${base("paper")}" ${OUTLINE}/>
      <polygon points="93,166 107,166 100,178" fill="${LINE}"/>`,
  ],
  [
    "objet-cahier",
    "Un cahier",
    ["cahier", "école"],
    `${ground(100, 184, 60, 6)}
      <rect x="44" y="26" width="112" height="150" rx="6" fill="${base("sky")}" ${OUTLINE}/>
      <rect x="44" y="26" width="22" height="150" rx="6" fill="${shade("sky")}" ${OUTLINE}/>
      <rect x="86" y="50" width="52" height="30" rx="3" fill="${base("paper")}" stroke="${LINE}" stroke-width="4"/>
      <line x1="94" y1="62" x2="130" y2="62" stroke="${base("stone")}" stroke-width="3" stroke-linecap="round"/>
      <line x1="94" y1="70" x2="120" y2="70" stroke="${base("stone")}" stroke-width="3" stroke-linecap="round"/>`,
  ],
  [
    "objet-sac",
    "Un sac d’école",
    ["sac", "cartable", "école"],
    `${ground(100, 184, 64, 6)}
      <path d="M70 72 a30 30 0 0 1 60 0" fill="none" ${OUTLINE}/>
      <rect x="42" y="66" width="116" height="110" rx="16" fill="${base("leaf")}" ${OUTLINE}/>
      <rect x="42" y="66" width="116" height="34" rx="14" fill="${shade("leaf")}" ${OUTLINE}/>
      <rect x="74" y="114" width="52" height="44" rx="8" fill="${base("sun")}" ${OUTLINE}/>
      <circle cx="100" cy="100" r="6" fill="${base("sun")}" stroke="${LINE}" stroke-width="4"/>`,
  ],
  [
    "objet-table",
    "Une table",
    ["table", "maison", "école"],
    `${ground(100, 184, 84, 7)}
      <rect x="52" y="90" width="10" height="64" fill="${shade("sun")}" stroke="${LINE}" stroke-width="5"/>
      <rect x="138" y="90" width="10" height="64" fill="${shade("sun")}" stroke="${LINE}" stroke-width="5"/>
      <rect x="32" y="92" width="12" height="78" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="156" y="92" width="12" height="78" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="20" y="66" width="160" height="24" rx="6" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="24" y="80" width="152" height="7" fill="${shade("sun")}"/>`,
  ],
  [
    "objet-chaise",
    "Une chaise",
    ["chaise", "maison", "école"],
    `${ground(100, 184, 60, 7)}
      <rect x="72" y="126" width="9" height="40" fill="${shade("sun")}" stroke="${LINE}" stroke-width="5"/>
      <rect x="119" y="126" width="9" height="40" fill="${shade("sun")}" stroke="${LINE}" stroke-width="5"/>
      <rect x="58" y="128" width="11" height="48" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="131" y="128" width="11" height="48" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="58" y="24" width="11" height="104" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="131" y="24" width="11" height="104" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="69" y="40" width="62" height="10" fill="${shade("sun")}" stroke="${LINE}" stroke-width="5"/>
      <rect x="69" y="62" width="62" height="10" fill="${shade("sun")}" stroke="${LINE}" stroke-width="5"/>
      <rect x="52" y="112" width="96" height="18" rx="6" fill="${base("sun")}" ${OUTLINE}/>`,
  ],
  [
    "objet-porte",
    "Une porte",
    ["porte", "maison"],
    `${ground(100, 184, 72, 7)}
      <rect x="42" y="20" width="116" height="162" rx="6" fill="${shade("stone")}" ${OUTLINE}/>
      <rect x="54" y="32" width="92" height="150" fill="${base("clay")}" ${OUTLINE}/>
      <rect x="64" y="44" width="72" height="52" rx="4" fill="${shade("clay")}" stroke="${LINE}" stroke-width="4"/>
      <rect x="64" y="108" width="72" height="60" rx="4" fill="${shade("clay")}" stroke="${LINE}" stroke-width="4"/>
      <circle cx="128" cy="104" r="6" fill="${base("sun")}" stroke="${LINE}" stroke-width="4"/>`,
  ],
  [
    "objet-fenetre",
    "Une fenêtre",
    ["fenêtre", "maison"],
    `${ground(100, 184, 76, 6)}
      <rect x="34" y="28" width="132" height="140" rx="4" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="46" y="40" width="50" height="54" fill="${base("sky")}" ${OUTLINE}/>
      <rect x="104" y="40" width="50" height="54" fill="${base("sky")}" ${OUTLINE}/>
      <rect x="46" y="102" width="50" height="54" fill="${base("sky")}" ${OUTLINE}/>
      <rect x="104" y="102" width="50" height="54" fill="${base("sky")}" ${OUTLINE}/>
      <circle cx="129" cy="66" r="13" fill="${base("sun")}" stroke="${LINE}" stroke-width="4"/>
      <rect x="28" y="166" width="144" height="12" rx="3" fill="${shade("stone")}" ${OUTLINE}/>`,
  ],
  [
    "objet-lit",
    "Un lit",
    ["lit", "maison", "dormir"],
    `${ground(100, 184, 88, 6)}
      <rect x="28" y="150" width="10" height="26" fill="${shade("clay")}" ${OUTLINE}/>
      <rect x="162" y="150" width="10" height="26" fill="${shade("clay")}" ${OUTLINE}/>
      <rect x="20" y="56" width="24" height="98" rx="6" fill="${base("clay")}" ${OUTLINE}/>
      <rect x="156" y="88" width="24" height="66" rx="6" fill="${base("clay")}" ${OUTLINE}/>
      <rect x="34" y="112" width="136" height="40" rx="8" fill="${base("paper")}" ${OUTLINE}/>
      <rect x="46" y="98" width="44" height="22" rx="8" fill="${base("paper")}" ${OUTLINE}/>
      <rect x="92" y="112" width="78" height="40" rx="8" fill="${base("leaf")}" ${OUTLINE}/>
      <line x1="104" y1="128" x2="158" y2="128" stroke="${shade("leaf")}" stroke-width="4" stroke-linecap="round"/>`,
  ],
  [
    "objet-marmite",
    "Une marmite",
    ["marmite", "maison", "cuisine"],
    `${ground(100, 184, 76, 6)}
      <rect x="22" y="94" width="26" height="14" rx="6" fill="${shade("stone")}" ${OUTLINE}/>
      <rect x="152" y="94" width="26" height="14" rx="6" fill="${shade("stone")}" ${OUTLINE}/>
      <path d="M46 86 h108 l-10 88 h-88 z" fill="${base("stone")}" ${OUTLINE}/>
      <path d="M124 90 h22 l-8 80 h-20 z" fill="${shade("stone")}"/>
      <rect x="38" y="76" width="124" height="14" rx="6" fill="${shade("stone")}" ${OUTLINE}/>
      <ellipse cx="100" cy="74" rx="52" ry="11" fill="${base("stone")}" ${OUTLINE}/>
      <circle cx="100" cy="58" r="8" fill="${base("sun")}" ${OUTLINE}/>`,
  ],
  [
    "objet-seau",
    "Un seau",
    ["seau", "maison", "eau"],
    `${ground(100, 182, 60, 7)}
      <path d="M54 80 h92 l-12 92 h-68 z" fill="${base("sky")}" ${OUTLINE}/>
      <path d="M124 84 h16 l-10 82 h-14 z" fill="${shade("sky")}"/>
      <ellipse cx="100" cy="80" rx="46" ry="9" fill="${shade("sky")}" ${OUTLINE}/>
      <path d="M58 76 q42 -60 84 0" fill="none" ${OUTLINE}/>`,
  ],
  [
    "objet-panier",
    "Un panier",
    ["panier", "marché"],
    `${ground(100, 184, 72, 6)}
      <path d="M66 94 a34 30 0 0 1 68 0" fill="none" ${OUTLINE}/>
      <path d="M40 98 h120 l-14 76 h-92 z" fill="${base("sun")}" ${OUTLINE}/>
      <path d="M66 102 l-6 68 M100 102 l0 68 M134 102 l6 68 M46 128 h108 M50 152 h100" fill="none" stroke="${shade("sun")}" stroke-width="4" stroke-linecap="round"/>
      <rect x="34" y="90" width="132" height="12" rx="4" fill="${shade("sun")}" ${OUTLINE}/>`,
  ],
  [
    "objet-tomate",
    "Une tomate",
    ["tomate", "marché", "manger"],
    `${ground(100, 182, 60, 7)}
      <circle cx="100" cy="118" r="56" fill="${shade("berry")}" ${OUTLINE}/>
      <circle cx="100" cy="112" r="50" fill="${base("berry")}"/>
      <ellipse cx="78" cy="92" rx="8" ry="12" transform="rotate(30 78 92)" fill="${base("paper")}"/>
      <path d="M100 66 l-26 -12 M100 66 l26 -12 M100 66 v-24 M100 66 l-12 -22 M100 66 l12 -22" fill="none" stroke="${base("leaf")}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="100" cy="66" r="5" fill="${shade("leaf")}"/>`,
  ],
  [
    "objet-banane",
    "Une banane",
    ["banane", "marché", "manger"],
    `${ground(100, 182, 64, 7)}
      <path d="M45 70 q10 85 105 85 q-55 -20 -75 -95 z" fill="${base("sun")}" ${OUTLINE}/>
      <path d="M62 84 q18 56 78 66 q-42 -22 -62 -72 z" fill="${shade("sun")}"/>
      <rect x="38" y="58" width="14" height="18" rx="4" fill="${base("stone")}" ${OUTLINE}/>
      <circle cx="150" cy="154" r="5" fill="${LINE}"/>`,
  ],
  [
    "objet-oignon",
    "Un oignon",
    ["oignon", "marché", "manger"],
    `${ground(100, 182, 54, 7)}
      <path d="M100 60 q58 30 42 78 q-14 40 -42 40 q-28 0 -42 -40 q-16 -48 42 -78 z" fill="${base("stone")}" ${OUTLINE}/>
      <path d="M100 72 q30 34 22 82 M100 72 q-30 34 -22 82" fill="none" stroke="${shade("stone")}" stroke-width="4" stroke-linecap="round"/>
      <path d="M100 60 l-14 -26 M100 60 l14 -26 M100 60 v-30" fill="none" stroke="${base("leaf")}" stroke-width="7" stroke-linecap="round"/>
      <path d="M90 176 l-4 10 M100 178 v10 M110 176 l4 10" fill="none" stroke="${shade("stone")}" stroke-width="4" stroke-linecap="round"/>`,
  ],
  [
    "objet-monnaie",
    "Deux billets simples et une pièce, la monnaie du marché",
    ["monnaie", "argent", "marché"],
    `${ground(100, 180, 76, 7)}
      <rect x="34" y="64" width="116" height="66" rx="8" transform="rotate(-8 92 97)" fill="${base("leaf")}" ${OUTLINE}/>
      <circle cx="92" cy="97" r="18" fill="${shade("leaf")}" stroke="${LINE}" stroke-width="4"/>
      <path d="M48 82 h18 M118 112 h18" fill="none" stroke="${shade("leaf")}" stroke-width="4" stroke-linecap="round"/>
      <rect x="48" y="92" width="116" height="66" rx="8" transform="rotate(7 106 125)" fill="${base("sky")}" ${OUTLINE}/>
      <circle cx="106" cy="125" r="18" fill="${shade("sky")}" stroke="${LINE}" stroke-width="4"/>
      <path d="M62 109 h18 M132 141 h18" fill="none" stroke="${shade("sky")}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="154" cy="158" r="24" fill="${base("sun")}" ${OUTLINE}/>
      <circle cx="154" cy="158" r="12" fill="none" stroke="${shade("sun")}" stroke-width="4"/>`,
  ],
  [
    "objet-caillou",
    "Un caillou",
    ["caillou", "compter", "petit objet"],
    `${ground(100, 172, 60, 8)}
      <path d="M50 122 q-10 -46 38 -58 q56 -14 68 26 q14 48 -32 60 q-60 14 -74 -28 z" fill="${shade("stone")}" ${OUTLINE}/>
      <path d="M56 114 q-6 -38 34 -48 q48 -12 58 22 q10 36 -28 46 q-52 12 -64 -20 z" fill="${base("stone")}"/>
      <ellipse cx="78" cy="88" rx="12" ry="7" transform="rotate(-20 78 88)" fill="${base("paper")}"/>`,
  ],
];

/**
 * Body parts, for 1ère maternelle. Naming your own body is one of the first things the youngest
 * band asks for (WORLD-S01-C02-O01), and a child cannot be asked to point at « le ventre » on a
 * screen that shows nothing. Each one is the part alone, on a plain ground: a whole figure would
 * make the child pick out the part before naming it, which is a second task.
 */
const BODY: [id: string, alt: string, tags: string[], body: string][] = [
  [
    "corps-main",
    "Une main ouverte, les cinq doigts écartés",
    ["main", "corps"],
    `${ground(100, 180, 56, 8)}
      ${hand({ cx: 100, top: 92, thumb: 1, scale: 1.15 })}`,
  ],
  [
    "corps-pied",
    "Un pied nu, vu de dessus, avec ses cinq orteils",
    ["pied", "corps"],
    `${ground(100, 186, 60, 6)}
      <path d="M58 72 q-14 44 8 82 q12 22 36 22 q28 0 38 -24 q10 -32 6 -70 q-2 -12 -16 -12 h-58 q-12 0 -14 8 z" fill="${base("skin")}" ${OUTLINE}/>
      <circle cx="64" cy="60" r="15" fill="${base("skin")}" ${OUTLINE}/>
      <circle cx="92" cy="52" r="11" fill="${base("skin")}" ${OUTLINE}/>
      <circle cx="114" cy="54" r="10" fill="${base("skin")}" ${OUTLINE}/>
      <circle cx="133" cy="60" r="9" fill="${base("skin")}" ${OUTLINE}/>
      <circle cx="149" cy="70" r="8" fill="${base("skin")}" ${OUTLINE}/>`,
  ],
  [
    "corps-tete",
    "La tête d’un enfant, avec ses cheveux, ses oreilles et son sourire",
    ["tête", "corps", "visage"],
    `<path d="M22 200 q78 -66 156 0 z" fill="${base("sky")}" ${OUTLINE}/>
      <rect x="86" y="130" width="28" height="30" rx="6" fill="${shade("skin")}" ${OUTLINE}/>
      <circle cx="48" cy="96" r="10" fill="${base("skin")}" ${OUTLINE}/>
      <circle cx="152" cy="96" r="10" fill="${base("skin")}" ${OUTLINE}/>
      <circle cx="100" cy="88" r="52" fill="${base("skin")}" ${OUTLINE}/>
      <path d="M48 88 a52 52 0 0 1 104 0 q-52 -24 -104 0 z" fill="${LINE}"/>
      ${face(100, 96, 32, 5)}`,
  ],
  [
    "corps-ventre",
    "Le ventre d’un enfant, avec le nombril, le tee-shirt relevé au-dessus et le short en dessous",
    ["ventre", "corps"],
    `${capsule(46, 50, 36, 138, 15, base("skin"))}
      ${capsule(154, 50, 164, 138, 15, base("skin"))}
      <rect x="58" y="146" width="84" height="42" rx="8" fill="${base("leaf")}" ${OUTLINE}/>
      <line x1="64" y1="156" x2="136" y2="156" stroke="${shade("leaf")}" stroke-width="4" stroke-linecap="round"/>
      <path d="M60 70 q40 -10 80 0 q10 38 2 78 q-42 12 -84 0 q-8 -40 2 -78 z" fill="${base("skin")}" ${OUTLINE}/>
      <path d="M92 118 q8 -4 16 0" fill="none" stroke="${shade("skin")}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="100" cy="112" r="4.5" fill="${LINE}"/>
      <path d="M58 12 h84 l24 18 l-10 22 l-14 -6 v16 q-42 10 -84 0 v-16 l-14 6 l-10 -22 z" fill="${base("sky")}" ${OUTLINE}/>
      <rect x="54" y="58" width="92" height="14" rx="7" fill="${shade("sky")}" ${OUTLINE}/>`,
  ],
];

const ANIMALS: [id: string, alt: string, tags: string[], body: string][] = [
  [
    "animal-poule",
    "Une poule blanche, avec sa crête rouge",
    ["poule", "animal"],
    `${ground(100, 178, 76, 8)}
      ${hen(106, 110, 1)}`,
  ],
  [
    "animal-poussin",
    "Un petit poussin jaune, tout rond",
    ["poussin", "animal", "kumu"],
    `${ground(100, 178, 60, 8)}
      ${chick(104, 116, 1.1)}`,
  ],
  [
    "animal-chevre",
    "Une chèvre blanche, avec ses cornes et sa barbichette",
    ["chèvre", "animal", "bibi"],
    `${ground(100, 178, 76, 8)}
      ${goat(96, 108, 1, -1)}`,
  ],
];

/**
 * One picture per story and per rhyme. A five-year-old listening to a story needs somewhere to
 * rest their eyes, and the picture is the first thing the parent can point at when asking "de
 * quoi parle l'histoire ?". Deliberately a single clear subject, never a busy scene: it supports
 * the listening, it does not replace it.
 */
const ILLUSTRATIONS: [id: string, alt: string, tags: string[], body: string][] = [
  [
    "forme-maison-composee",
    "Une maison composée d’un carré pour le mur et d’un triangle pour le toit, avec un disque pour le soleil",
    ["maison", "carré", "triangle", "disque", "forme"],
    `${ground(100, 180, 76, 7)}
      <rect x="59" y="92" width="82" height="82" rx="3" fill="${base("clay")}" ${OUTLINE}/>
      <polygon points="42,94 100,36 158,94" fill="${base("sun")}" ${OUTLINE}/>
      <circle cx="158" cy="42" r="20" fill="${base("sky")}" ${OUTLINE}/>`,
  ],
  [
    "histoire-seau-lisa",
    "Lisa, une petite fille en robe rouge, debout à côté d’une chaise, avec son seau bleu posé dessus",
    ["histoire", "lisa", "seau", "chaise", "personnage"],
    `${ground(100, 178, 86, 8)}
      <rect x="116" y="132" width="10" height="42" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="162" y="132" width="10" height="42" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="160" y="70" width="12" height="100" rx="4" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="112" y="120" width="64" height="12" rx="4" fill="${base("sun")}" ${OUTLINE}/>
      <path d="M124 86 h36 l-5 34 h-26 z" fill="${base("sky")}" ${OUTLINE}/>
      <rect x="121" y="80" width="42" height="9" rx="3" fill="${shade("sky")}" ${OUTLINE}/>
      <path d="M127 82 q15 -26 30 0" fill="none" ${OUTLINE}/>
      ${capsule(58, 132, 52, 170, 12, base("skin"))}
      ${capsule(74, 132, 80, 170, 12, base("skin"))}
      <ellipse cx="50" cy="174" rx="10" ry="5" fill="${shade("stone")}" ${OUTLINE}/>
      <ellipse cx="82" cy="174" rx="10" ry="5" fill="${shade("stone")}" ${OUTLINE}/>
      <rect x="60" y="72" width="12" height="14" fill="${shade("skin")}" ${OUTLINE}/>
      ${capsule(48, 90, 30, 120, 10, base("skin"))}
      ${capsule(84, 90, 106, 114, 10, base("skin"))}
      <path d="M48 84 h36 l12 56 h-60 z" fill="${base("berry")}" ${OUTLINE}/>
      <rect x="42" y="128" width="50" height="8" fill="${shade("berry")}"/>
      <circle cx="66" cy="54" r="22" fill="${base("skin")}" ${OUTLINE}/>
      <path d="M44 54 a22 22 0 0 1 44 0 q-22 -10 -44 0 z" fill="${LINE}"/>
      <circle cx="50" cy="38" r="10" fill="${LINE}"/>
      <circle cx="82" cy="38" r="10" fill="${LINE}"/>
      ${face(66, 58, 16, 4)}`,
  ],
  [
    "histoire-tika",
    "Un enfant qui s’étire dans son lit, le soleil à la fenêtre",
    ["histoire", "matin", "lit"],
    `<rect x="138" y="18" width="48" height="48" rx="6" fill="${base("sky")}" ${OUTLINE}/>
      <circle cx="162" cy="42" r="13" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="134" y="64" width="56" height="8" rx="2" fill="${shade("stone")}" ${OUTLINE}/>
      ${ground(100, 182, 88, 7)}
      <rect x="40" y="154" width="10" height="22" fill="${shade("clay")}" ${OUTLINE}/>
      <rect x="166" y="154" width="10" height="22" fill="${shade("clay")}" ${OUTLINE}/>
      <rect x="22" y="78" width="22" height="80" rx="6" fill="${base("clay")}" ${OUTLINE}/>
      <rect x="34" y="124" width="146" height="34" rx="8" fill="${base("paper")}" ${OUTLINE}/>
      <rect x="44" y="110" width="40" height="22" rx="8" fill="${base("paper")}" ${OUTLINE}/>
      ${capsule(98, 94, 78, 58, 10, base("skin"))}
      ${capsule(134, 94, 154, 58, 10, base("skin"))}
      <rect x="110" y="80" width="12" height="12" fill="${shade("skin")}" ${OUTLINE}/>
      <rect x="96" y="88" width="40" height="44" rx="10" fill="${base("sky")}" ${OUTLINE}/>
      <circle cx="116" cy="64" r="20" fill="${base("skin")}" ${OUTLINE}/>
      <path d="M96 64 a20 20 0 0 1 40 0 q-20 -10 -40 0 z" fill="${LINE}"/>
      ${face(116, 68, 16, 4, "o")}
      <rect x="88" y="128" width="92" height="26" rx="8" fill="${base("leaf")}" ${OUTLINE}/>
      <line x1="100" y1="141" x2="170" y2="141" stroke="${shade("leaf")}" stroke-width="4" stroke-linecap="round"/>`,
  ],
  [
    "histoire-kumu",
    "Kumu, le petit poussin, qui sort tout seul du poulailler dont la porte est ouverte",
    ["kumu", "poussin", "histoire"],
    `${ground(100, 180, 92, 7)}
      <rect x="16" y="66" width="80" height="108" fill="${base("stone")}" ${OUTLINE}/>
      <rect x="34" y="100" width="44" height="74" fill="${shade("night")}" ${OUTLINE}/>
      <rect x="14" y="100" width="20" height="74" rx="2" fill="${base("sun")}" ${OUTLINE}/>
      <polygon points="6,68 56,28 106,68" fill="${base("clay")}" ${OUTLINE}/>
      <g transform="translate(284 0) scale(-1 1)">${chick(142, 128, 0.9)}</g>`,
  ],
  [
    "histoire-nsimba",
    "Nsimba, un petit garçon avec son sac d’école sur le dos, devant la porte de l’école",
    ["nsimba", "école", "rentrée", "histoire"],
    `${ground(100, 182, 90, 7)}
      <rect x="116" y="22" width="62" height="156" rx="4" fill="${shade("stone")}" ${OUTLINE}/>
      <rect x="126" y="32" width="46" height="146" fill="${base("clay")}" ${OUTLINE}/>
      <rect x="134" y="46" width="30" height="16" rx="3" fill="${base("paper")}" stroke="${LINE}" stroke-width="4"/>
      <circle cx="160" cy="112" r="5" fill="${base("sun")}" stroke="${LINE}" stroke-width="4"/>
      <rect x="86" y="82" width="26" height="46" rx="8" fill="${base("leaf")}" ${OUTLINE}/>
      ${capsule(60, 132, 56, 172, 12, base("skin"))}
      ${capsule(80, 132, 84, 172, 12, base("skin"))}
      <ellipse cx="54" cy="176" rx="10" ry="5" fill="${shade("stone")}" ${OUTLINE}/>
      <ellipse cx="86" cy="176" rx="10" ry="5" fill="${shade("stone")}" ${OUTLINE}/>
      <rect x="64" y="70" width="12" height="14" fill="${shade("skin")}" ${OUTLINE}/>
      ${capsule(52, 88, 36, 120, 10, base("skin"))}
      ${capsule(88, 88, 100, 120, 10, base("skin"))}
      <rect x="48" y="80" width="44" height="48" rx="10" fill="${base("sky")}" ${OUTLINE}/>
      <rect x="50" y="122" width="40" height="22" rx="4" fill="${base("clay")}" ${OUTLINE}/>
      <line x1="60" y1="84" x2="86" y2="112" stroke="${shade("leaf")}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="70" cy="50" r="22" fill="${base("skin")}" ${OUTLINE}/>
      <path d="M48 50 a22 22 0 0 1 44 0 q-22 -12 -44 0 z" fill="${LINE}"/>
      ${face(70, 54, 16, 4)}`,
  ],
  [
    "histoire-mangue",
    "Une mangue entière, et trois morceaux de mangue coupés sur une assiette",
    ["mangue", "partage", "histoire"],
    `${ground(100, 184, 80, 6)}
      <ellipse cx="100" cy="64" rx="36" ry="28" transform="rotate(-20 100 64)" fill="${base("sun")}" ${OUTLINE}/>
      <ellipse cx="112" cy="70" rx="18" ry="14" transform="rotate(-20 112 70)" fill="${base("clay")}"/>
      <line x1="70" y1="44" x2="62" y2="32" ${OUTLINE}/>
      <path d="M62 32 q-16 -4 -22 8 q14 6 22 -8 z" fill="${base("leaf")}" ${OUTLINE}/>
      <ellipse cx="100" cy="140" rx="78" ry="24" fill="${base("stone")}" ${OUTLINE}/>
      <ellipse cx="100" cy="138" rx="66" ry="16" fill="${shade("paper")}"/>
      <path d="M32 136 q2 -18 24 -18 q24 0 24 18 q-2 14 -24 14 q-22 0 -24 -14 z" fill="${base("leaf")}" ${OUTLINE}/>
      <path d="M39 135 q2 -12 17 -12 q17 0 17 12 q-2 9 -17 9 q-15 0 -17 -9 z" fill="${base("sun")}"/>
      <path d="M48 126 l-4 16 M60 125 l-4 18 M41 133 l30 0" fill="none" stroke="${shade("sun")}" stroke-width="3" stroke-linecap="round"/>
      <path d="M76 140 q2 -18 24 -18 q24 0 24 18 q-2 14 -24 14 q-22 0 -24 -14 z" fill="${base("leaf")}" ${OUTLINE}/>
      <path d="M83 139 q2 -12 17 -12 q17 0 17 12 q-2 9 -17 9 q-15 0 -17 -9 z" fill="${base("sun")}"/>
      <path d="M92 130 l-4 16 M104 129 l-4 18 M85 137 l30 0" fill="none" stroke="${shade("sun")}" stroke-width="3" stroke-linecap="round"/>
      <path d="M120 136 q2 -18 24 -18 q24 0 24 18 q-2 14 -24 14 q-22 0 -24 -14 z" fill="${base("leaf")}" ${OUTLINE}/>
      <path d="M127 135 q2 -12 17 -12 q17 0 17 12 q-2 9 -17 9 q-15 0 -17 -9 z" fill="${base("sun")}"/>
      <path d="M136 126 l-4 16 M148 125 l-4 18 M129 133 l30 0" fill="none" stroke="${shade("sun")}" stroke-width="3" stroke-linecap="round"/>`,
  ],
  [
    "histoire-bibi",
    "Bibi la chèvre, le nez dans un buisson, devant une barrière",
    ["bibi", "chèvre", "jardin", "histoire"],
    `${ground(100, 180, 92, 7)}
      <rect x="150" y="62" width="10" height="112" rx="3" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="182" y="62" width="10" height="112" rx="3" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="140" y="92" width="60" height="9" rx="3" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="140" y="134" width="60" height="9" rx="3" fill="${base("sun")}" ${OUTLINE}/>
      ${puffs(
        [
          [126, 84, 18],
          [150, 70, 22],
          [170, 88, 16],
          [148, 100, 18],
        ],
        base("leaf"),
      )}
      ${goat(74, 118, 0.95, 1)}`,
  ],
  [
    "histoire-marche",
    "Un panier de marché avec des tomates, un régime de bananes et un oignon",
    ["marché", "panier", "histoire"],
    `${ground(100, 182, 92, 7)}
      <circle cx="74" cy="92" r="18" fill="${base("berry")}" ${OUTLINE}/>
      <circle cx="104" cy="86" r="18" fill="${base("berry")}" ${OUTLINE}/>
      <path d="M96 70 l-6 -8 M104 68 l0 -10 M112 70 l6 -8" fill="none" stroke="${base("leaf")}" stroke-width="5" stroke-linecap="round"/>
      <path d="M126 96 q6 -44 46 -40 q-4 20 -18 30 q-14 10 -28 10 z" fill="${base("sun")}" ${OUTLINE}/>
      <path d="M132 92 q4 -30 30 -32" fill="none" stroke="${shade("sun")}" stroke-width="4" stroke-linecap="round"/>
      <path d="M38 100 h124 l-16 74 h-92 z" fill="${base("sun")}" ${OUTLINE}/>
      <path d="M64 104 l-6 66 M100 104 l0 66 M136 104 l6 66" fill="none" stroke="${shade("sun")}" stroke-width="4" stroke-linecap="round"/>
      <path d="M66 98 a34 30 0 0 1 68 0" fill="none" ${OUTLINE}/>
      <path d="M30 132 q26 -20 26 8 q0 30 -22 34 q-22 -4 -22 -34 q0 -18 18 -8 z" fill="${base("stone")}" ${OUTLINE}/>
      <path d="M30 132 l-8 -16 M32 130 l8 -16" fill="none" stroke="${base("leaf")}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="170" cy="164" r="11" fill="${base("sun")}" ${OUTLINE}/>
      <circle cx="170" cy="164" r="5" fill="none" stroke="${shade("sun")}" stroke-width="3"/>`,
  ],
  [
    "histoire-pluie",
    "La pluie qui tombe d’un nuage sur le toit d’une maison",
    ["pluie", "toit", "histoire"],
    `<circle cx="72" cy="40" r="16" fill="${base("stone")}" ${OUTLINE}/>
      <circle cx="100" cy="30" r="22" fill="${base("stone")}" ${OUTLINE}/>
      <circle cx="130" cy="40" r="16" fill="${base("stone")}" ${OUTLINE}/>
      <rect x="60" y="40" width="80" height="16" rx="8" fill="${base("stone")}" ${OUTLINE}/>
      <circle cx="72" cy="40" r="16" fill="${base("stone")}"/>
      <circle cx="100" cy="30" r="22" fill="${base("stone")}"/>
      <circle cx="130" cy="40" r="16" fill="${base("stone")}"/>
      <rect x="60" y="40" width="80" height="16" rx="8" fill="${base("stone")}"/>
      ${[24, 44, 64, 84, 104, 124, 144, 164, 184].map((x) => `<line x1="${x}" y1="70" x2="${x - 5}" y2="90" stroke="${shade("sky")}" stroke-width="5" stroke-linecap="round"/>`).join("")}
      <rect x="46" y="110" width="108" height="58" fill="${base("paper")}" ${OUTLINE}/>
      <rect x="88" y="132" width="24" height="36" rx="3" fill="${shade("clay")}" ${OUTLINE}/>
      <polygon points="28,110 100,58 172,110" fill="${base("clay")}" ${OUTLINE}/>
      <ellipse cx="100" cy="182" rx="66" ry="6" fill="${base("sky")}"/>
      <circle cx="36" cy="174" r="4" fill="${base("sky")}"/>
      <circle cx="164" cy="174" r="4" fill="${base("sky")}"/>`,
  ],
  [
    "histoire-cailloux",
    "Trois cailloux différents : un rond, un plat et un pointu",
    ["cailloux", "trois", "histoire"],
    `${ground(100, 178, 92, 8)}
      <circle cx="48" cy="126" r="30" fill="${base("stone")}" ${OUTLINE}/>
      <ellipse cx="40" cy="114" rx="8" ry="5" fill="${base("paper")}"/>
      <ellipse cx="108" cy="146" rx="36" ry="15" fill="${base("stone")}" ${OUTLINE}/>
      <ellipse cx="96" cy="140" rx="10" ry="3" fill="${base("paper")}"/>
      <polygon points="158,84 188,150 130,150" fill="${base("stone")}" ${OUTLINE}/>
      <polygon points="156,100 162,116 150,118" fill="${base("paper")}"/>`,
  ],
  [
    "histoire-malo",
    "Malo, un petit chien couché en rond sur son tapis, les yeux fermés, sous la lune et les étoiles",
    ["malo", "chien", "dormir", "histoire"],
    `<path d="M150 22 a30 30 0 1 0 26 44 a24 24 0 0 1 -26 -44 z" fill="${base("sun")}" ${OUTLINE}/>
      <polygon points="40,30 44,40 54,42 46,48 48,58 40,52 32,58 34,48 26,42 36,40" fill="${base("sun")}" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>
      <polygon points="82,50 84,56 90,57 85,61 86,67 82,63 78,67 79,61 74,57 80,56" fill="${base("sun")}" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="100" cy="166" rx="86" ry="15" fill="${base("clay")}" ${OUTLINE}/>
      <path d="M156 132 q26 -6 16 -34 q-4 18 -20 22" fill="${base("sun")}" ${OUTLINE}/>
      <ellipse cx="114" cy="136" rx="50" ry="28" fill="${shade("sun")}" ${OUTLINE}/>
      <ellipse cx="114" cy="132" rx="45" ry="21" fill="${base("sun")}"/>
      <ellipse cx="46" cy="158" rx="14" ry="7" fill="${base("sun")}" ${OUTLINE}/>
      <ellipse cx="70" cy="160" rx="14" ry="7" fill="${base("sun")}" ${OUTLINE}/>
      <circle cx="62" cy="134" r="24" fill="${base("sun")}" ${OUTLINE}/>
      <ellipse cx="40" cy="146" rx="15" ry="11" fill="${base("sun")}" ${OUTLINE}/>
      <circle cx="27" cy="143" r="5.5" fill="${LINE}"/>
      <ellipse cx="72" cy="130" rx="9" ry="17" transform="rotate(25 72 130)" fill="${shade("clay")}" ${OUTLINE}/>
      <path d="M50 128 q6 5 12 0" fill="none" stroke="${LINE}" stroke-width="3.5" stroke-linecap="round"/>`,
  ],
  [
    "comptine-compter",
    "Une main qui montre trois doigts",
    ["compter", "comptine", "doigts"],
    `${ground(100, 180, 56, 8)}
      ${hand({ cx: 100, top: 96, thumb: 1, scale: 1.1, folded: [true, false, false, false], thumbFolded: true })}`,
  ],
  [
    "comptine-bonjour",
    "Le soleil qui se lève derrière la colline, et deux mains qui font bonjour",
    ["bonjour", "soleil", "comptine"],
    `<circle cx="100" cy="100" r="40" fill="${base("sun")}" ${OUTLINE}/>
      <line x1="100" y1="32" x2="100" y2="46" ${OUTLINE}/>
      <line x1="58" y1="54" x2="68" y2="64" ${OUTLINE}/>
      <line x1="142" y1="54" x2="132" y2="64" ${OUTLINE}/>
      <line x1="143" y1="84" x2="155" y2="80" ${OUTLINE}/>
      <line x1="57" y1="84" x2="45" y2="80" ${OUTLINE}/>
      <path d="M-10 200 q110 -120 220 0 z" fill="${base("leaf")}" ${OUTLINE}/>
      ${hand({ cx: 34, top: 126, thumb: 1, scale: 0.7 })}
      ${hand({ cx: 166, top: 126, thumb: -1, scale: 0.7 })}`,
  ],
  [
    "comptine-mains",
    "Deux mains ouvertes, levées, paumes vers toi",
    ["mains", "corps", "comptine"],
    `${ground(100, 182, 82, 8)}
      ${hand({ cx: 46, top: 92, thumb: 1, scale: 0.86 })}
      ${hand({ cx: 154, top: 92, thumb: -1, scale: 0.86 })}`,
  ],
  [
    "comptine-semaine",
    "Sept perles sur un fil : cinq rondes, puis deux carrées",
    ["semaine", "jours", "comptine"],
    `${ground(100, 126, 88, 7)}
      <path d="M10 104 q95 -30 180 0" fill="none" ${OUTLINE}/>
      ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${30 + i * 24}" cy="${100 - Math.sin(((i + 0.5) / 7) * Math.PI) * 10}" r="13" fill="${base("sky")}" ${OUTLINE}/>`).join("")}
      <rect x="138" y="82" width="24" height="24" rx="5" fill="${base("sun")}" ${OUTLINE}/>
      <rect x="164" y="88" width="24" height="24" rx="5" fill="${base("sun")}" ${OUTLINE}/>`,
  ],
  [
    "comptine-cabri",
    "Un petit cabri qui saute, les quatre pattes en l’air, au-dessus de l’herbe",
    ["cabri", "sauter", "comptine"],
    `${ground(96, 182, 48, 6)}
      <path d="M24 176 q6 -14 12 0 M40 178 q6 -12 12 0 M150 178 q6 -12 12 0 M166 176 q6 -14 12 0" fill="none" stroke="${base("leaf")}" stroke-width="5" stroke-linecap="round"/>
      <path d="M58 150 q10 12 24 10 M104 156 q12 8 24 2" fill="none" stroke="${base("stone")}" stroke-width="4" stroke-linecap="round"/>
      <g transform="rotate(-12 100 90)">${goat(100, 88, 0.9, 1, true)}</g>`,
  ],
  [
    "comptine-formes",
    "Les quatre formes qui dansent : rond, carré, rectangle, triangle",
    ["formes", "comptine"],
    `<line x1="14" y1="170" x2="186" y2="170" ${OUTLINE}/>
      <circle cx="48" cy="80" r="26" fill="${base("clay")}" ${OUTLINE}/>
      <rect x="110" y="50" width="52" height="52" rx="4" fill="${base("sky")}" transform="rotate(12 136 76)" ${OUTLINE}/>
      <rect x="20" y="126" width="64" height="34" rx="4" fill="${base("leaf")}" transform="rotate(-8 52 143)" ${OUTLINE}/>
      <polygon points="146,110 178,164 114,164" fill="${base("sun")}" ${OUTLINE}/>
      <path d="M84 70 q8 -10 0 -20 M90 82 q10 -6 6 -18 M176 60 q10 4 8 14 M100 150 q8 -8 4 -16 M104 128 q10 -2 12 6" fill="none" stroke="${base("stone")}" stroke-width="4" stroke-linecap="round"/>`,
  ],
  [
    "plante-parties",
    "Une plante avec ses feuilles, sa tige et ses racines sous la terre",
    ["plante", "feuille", "tige", "racine"],
    `<rect x="0" y="136" width="200" height="64" fill="${shade("skin")}"/>
      <line x1="0" y1="136" x2="200" y2="136" ${OUTLINE}/>
      <path d="M100 136 v22 M100 150 l-26 22 M100 150 l26 24 M100 158 l-8 30 M100 158 l10 26" fill="none" stroke="${base("stone")}" stroke-width="5" stroke-linecap="round"/>
      <line x1="100" y1="136" x2="100" y2="36" stroke="${shade("leaf")}" stroke-width="9" stroke-linecap="round"/>
      <path d="M100 108 q-44 -14 -52 18 q40 16 52 -18 z" fill="${base("leaf")}" ${OUTLINE}/>
      <path d="M100 84 q44 -14 52 18 q-40 16 -52 -18 z" fill="${base("leaf")}" ${OUTLINE}/>
      <path d="M100 60 q-38 -14 -46 14 q36 14 46 -14 z" fill="${base("leaf")}" ${OUTLINE}/>
      <path d="M100 44 q10 -22 30 -12 q-8 20 -30 12 z" fill="${base("leaf")}" ${OUTLINE}/>`,
  ],
  [
    "bonhomme-articule",
    "Un bonhomme dessiné au crayon sur une feuille, avec les bras et les jambes pliés",
    ["bonhomme", "corps", "articulation", "dessin", "bouger", "marcher"],
    `<rect x="34" y="12" width="132" height="176" rx="4" fill="${base("paper")}" stroke="${shade("stone")}" stroke-width="4"/>
      <g fill="none" stroke="${LINE}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="100" cy="52" r="18"/>
        <line x1="100" y1="70" x2="100" y2="118"/>
        <polyline points="100,84 72,100 66,128"/>
        <polyline points="100,84 128,100 134,128"/>
        <polyline points="100,118 80,146 84,176"/>
        <polyline points="100,118 120,146 116,176"/>
      </g>
      ${[
        [100, 84],
        [72, 100],
        [128, 100],
        [100, 118],
        [80, 146],
        [120, 146],
      ]
        .map(
          ([x, y]) =>
            `<circle cx="${x}" cy="${y}" r="5" fill="${base("sun")}" stroke="${LINE}" stroke-width="4"/>`,
        )
        .join("")}`,
  ],
];

function svg(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img" fill="none">\n  ${body.trim()}\n</svg>\n`;
}

async function main() {
  const assets: Asset[] = [
    ...SHAPES,
    ...OBJECTS.map(([id, alt, tags, body]) => ({
      id,
      kind: "object" as const,
      file: `objects/${id}.svg`,
      alt,
      tags,
      body,
    })),
    ...BODY.map(([id, alt, tags, body]) => ({
      id,
      kind: "object" as const,
      file: `objects/${id}.svg`,
      alt,
      tags,
      body,
    })),
    ...ANIMALS.map(([id, alt, tags, body]) => ({
      id,
      kind: "animal" as const,
      file: `animals/${id}.svg`,
      alt,
      tags,
      body,
    })),
    ...ILLUSTRATIONS.map(([id, alt, tags, body]) => ({
      id,
      kind: "illustration" as const,
      file: `illustrations/${id}.svg`,
      alt,
      tags,
      body,
    })),
  ];

  const seen = new Set<string>();
  for (const asset of assets) {
    if (seen.has(asset.id)) throw new Error(`duplicate media id: ${asset.id}`);
    seen.add(asset.id);
    const target = path.join(OUT, asset.file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, svg(asset.body), "utf8");
  }

  /** The bytes as written, so the hash is of the file a browser will actually fetch. */
  const hashOf = (file: string): string =>
    `sha256:${createHash("sha256")
      .update(readFileSync(path.join(OUT, file)))
      .digest("hex")}`;

  const registry = {
    // Audio is authored by hand, never generated: a recording needs a human voice (ADR-046).
    // The generator preserves whatever is already declared.
    audio:
      JSON.parse(readFileSync(path.join(ROOT, "content/media/registry.json"), "utf8")).audio ?? [],
    assets: assets.map(({ id, kind, file, alt, tags }) => ({
      id,
      kind,
      file,
      alt,
      tags,
      origin: "teka-edu-created",
      provenance: "Tracé original produit par tools/media/build.ts pour Teka Edu.",
      contentHash: hashOf(file),
    })),
  };
  // Formatted the way `npm run format:check` expects. Writing raw JSON.stringify output left the
  // committed file and the generator's output permanently one `prettier --write` apart, so
  // re-running the generator dirtied the tree and hand-formatting was reverted by the next run.
  const registryPath = path.join(ROOT, "content/media/registry.json");
  writeFileSync(
    registryPath,
    await format(JSON.stringify(registry, null, 2), {
      ...(await resolveConfig(registryPath)),
      filepath: registryPath,
    }),
    "utf8",
  );
  console.log(`Wrote ${assets.length} assets and content/media/registry.json`);
}

await main();
