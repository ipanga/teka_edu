/**
 * Draws the September visual set and writes content/media/registry.json (ADR-042).
 *
 *   npx tsx tools/media/build.ts
 *
 * The SVGs are committed; this exists so the set stays consistent and can be regenerated and
 * reviewed as a whole, like tools/annual-plan/build.ts. It is not run at build time.
 *
 * Style: flat, two-tone, no gradients, no faces, recognisable at arm's length on a phone. Colour
 * never carries meaning — the child is asked for *the square*, never for *the blue one*.
 */
import { createHash } from "node:crypto";
import { format } from "prettier";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(ROOT, "public/media");
const SIZE = 200;

const INK = "#1f2937";
const PAPER = "#fffdf7";
const BLUE = "#6aa9d8";
const GREEN = "#79b98a";
const AMBER = "#e9b96e";
const CLAY = "#c9785f";
const STONE = "#b9b2a6";

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
const face = (cx: number, cy: number, spread = 16, r = 4.5, mouth: "smile" | "o" = "smile") =>
  `<circle cx="${cx - spread / 2}" cy="${cy}" r="${r}" fill="${LINE}"/>` +
  `<circle cx="${cx + spread / 2}" cy="${cy}" r="${r}" fill="${LINE}"/>` +
  (mouth === "o"
    ? `<circle cx="${cx}" cy="${cy + 14}" r="4" fill="${LINE}"/>`
    : `<path d="M${cx - 9} ${cy + 12} q9 9 18 0" fill="none" ${OUTLINE}/>`);

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
  const s = o.scale ?? 1;
  const { cx, top, thumb } = o;
  const w = 52 * s;
  const h = 54 * s;
  const spacing = 13 * s;
  const finger = 11 * s;
  const heights = (o.heights ?? [32, 44, 50, 46]).map((v) => v * s);
  const folded = o.folded ?? [false, false, false, false];
  const skin = base("skin");
  const parts: string[] = [];
  // Wrist first, so the palm sits on it.
  parts.push(
    `<rect x="${cx - 14 * s}" y="${top + h - 8 * s}" width="${28 * s}" height="${30 * s}" rx="${8 * s}" fill="${shade("skin")}" ${OUTLINE}/>`,
  );
  // Fingers, little finger on the side away from the thumb.
  [-1.5, -0.5, 0.5, 1.5].forEach((k, i) => {
    const fx = cx + thumb * k * spacing;
    const rise = folded[i] ? 10 * s : heights[i]!;
    parts.push(capsule(fx, top + 8 * s, fx, top + 8 * s - rise, finger, skin));
  });
  // Thumb, reaching outward and up on its own side.
  if (!o.thumbFolded) {
    const tx = cx + thumb * (w / 2 - 4 * s);
    const ty = top + 24 * s;
    parts.push(capsule(tx, ty, tx + thumb * 16 * s, ty - 22 * s, finger, skin));
  }
  // Palm: the shade carries the outline; the base sits inside it, a little higher.
  parts.push(
    `<rect x="${cx - w / 2}" y="${top}" width="${w}" height="${h}" rx="${18 * s}" fill="${shade("skin")}" ${OUTLINE}/>`,
    `<rect x="${cx - w / 2 + 3}" y="${top + 3}" width="${w - 6}" height="${h - 14 * s}" rx="${16 * s}" fill="${skin}"/>`,
  );
  if (o.thumbFolded) {
    const tx = cx + thumb * (w / 2 - 6 * s);
    parts.push(capsule(tx, top + 20 * s, cx + thumb * 4 * s, top + 34 * s, finger, skin));
  }
  return parts.join("\n      ");
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
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <rect x="70" y="45" width="60" height="90" fill="${AMBER}"/>
      <polygon points="70,135 130,135 100,175" fill="${PAPER}"/>
      <rect x="70" y="30" width="60" height="18" fill="${CLAY}"/>
    </g>`,
  ],
  [
    "objet-cahier",
    "Un cahier",
    ["cahier", "école"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <rect x="45" y="35" width="110" height="140" rx="6" fill="${BLUE}"/>
      <line x1="70" y1="35" x2="70" y2="175"/>
      <line x1="90" y1="75" x2="135" y2="75"/>
      <line x1="90" y1="105" x2="135" y2="105"/>
      <line x1="90" y1="135" x2="135" y2="135"/>
    </g>`,
  ],
  [
    "objet-sac",
    "Un sac d’école",
    ["sac", "cartable", "école"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <path d="M70 80 a30 30 0 0 1 60 0" fill="none"/>
      <rect x="45" y="80" width="110" height="90" rx="12" fill="${GREEN}"/>
      <rect x="45" y="80" width="110" height="30" rx="10" fill="${AMBER}"/>
    </g>`,
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
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <rect x="40" y="45" width="120" height="110" rx="6" fill="${BLUE}"/>
      <line x1="100" y1="45" x2="100" y2="155"/>
      <line x1="40" y1="100" x2="160" y2="100"/>
    </g>`,
  ],
  [
    "objet-lit",
    "Un lit",
    ["lit", "maison", "dormir"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <rect x="30" y="95" width="140" height="45" rx="8" fill="${GREEN}"/>
      <rect x="42" y="78" width="45" height="28" rx="8" fill="${PAPER}"/>
      <line x1="30" y1="140" x2="30" y2="165"/>
      <line x1="170" y1="140" x2="170" y2="165"/>
    </g>`,
  ],
  [
    "objet-marmite",
    "Une marmite",
    ["marmite", "maison", "cuisine"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <path d="M50 85 h100 l-10 80 h-80 z" fill="${STONE}"/>
      <rect x="40" y="70" width="120" height="16" rx="8" fill="${INK}"/>
      <line x1="40" y1="95" x2="22" y2="112"/>
      <line x1="160" y1="95" x2="178" y2="112"/>
    </g>`,
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
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <path d="M45 90 h110 l-14 80 h-82 z" fill="${AMBER}"/>
      <path d="M70 88 a30 28 0 0 1 60 0" fill="none"/>
      <line x1="72" y1="110" x2="64" y2="165"/>
      <line x1="128" y1="110" x2="136" y2="165"/>
    </g>`,
  ],
  [
    "objet-tomate",
    "Une tomate",
    ["tomate", "marché", "manger"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <circle cx="100" cy="115" r="55" fill="${CLAY}"/>
      <path d="M100 60 l-22 -18 M100 60 l22 -18 M100 60 v-22" fill="none" stroke="${GREEN}" stroke-width="8"/>
    </g>`,
  ],
  [
    "objet-banane",
    "Une banane",
    ["banane", "marché", "manger"],
    `<path d="M45 70 q10 85 105 85 q-55 -20 -75 -95 z" fill="${AMBER}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`,
  ],
  [
    "objet-oignon",
    "Un oignon",
    ["oignon", "marché", "manger"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <path d="M100 65 q55 30 40 70 q-15 40 -40 40 q-25 0 -40 -40 q-15 -40 40 -70 z" fill="${STONE}"/>
      <path d="M100 65 l-14 -22 M100 65 l14 -22" fill="none" stroke="${GREEN}" stroke-width="7"/>
    </g>`,
  ],
  [
    "objet-caillou",
    "Un caillou",
    ["caillou", "compter", "petit objet"],
    `<path d="M60 120 q-8 -35 30 -45 q45 -12 55 20 q12 38 -25 48 q-48 12 -60 -23 z" fill="${STONE}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`,
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
      <rect x="84" y="140" width="40" height="46" rx="10" fill="${shade("skin")}" ${OUTLINE}/>
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
    "Le ventre d’un enfant, avec le nombril, entre le tee-shirt et le short",
    ["ventre", "corps"],
    `<rect x="52" y="146" width="96" height="42" rx="8" fill="${base("leaf")}" ${OUTLINE}/>
      <path d="M54 80 q46 -16 92 0 q8 34 0 68 q-46 16 -92 0 q-8 -34 0 -68 z" fill="${base("skin")}" ${OUTLINE}/>
      <ellipse cx="100" cy="140" rx="34" ry="6" fill="${shade("skin")}"/>
      <rect x="26" y="26" width="24" height="34" rx="8" fill="${shade("sky")}" ${OUTLINE}/>
      <rect x="150" y="26" width="24" height="34" rx="8" fill="${shade("sky")}" ${OUTLINE}/>
      <circle cx="100" cy="122" r="5" fill="${LINE}"/>
      <path d="M40 20 h120 v50 q-60 16 -120 0 z" fill="${base("sky")}" ${OUTLINE}/>
      <path d="M46 60 q54 14 108 0 v6 q-54 16 -108 0 z" fill="${shade("sky")}"/>`,
  ],
];

const ANIMALS: [id: string, alt: string, tags: string[], body: string][] = [
  [
    "animal-poule",
    "Une poule",
    ["poule", "animal"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <ellipse cx="105" cy="120" rx="52" ry="42" fill="${PAPER}"/>
      <circle cx="62" cy="88" r="24" fill="${PAPER}"/>
      <path d="M55 64 q7 -16 14 0" fill="${CLAY}"/>
      <polygon points="40,88 24,94 40,100" fill="${AMBER}"/>
      <circle cx="56" cy="84" r="4" fill="${INK}" stroke="none"/>
      <line x1="95" y1="162" x2="95" y2="176"/>
      <line x1="120" y1="162" x2="120" y2="176"/>
    </g>`,
  ],
  [
    "animal-poussin",
    "Un petit poussin",
    ["poussin", "animal", "kumu"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <circle cx="105" cy="118" r="40" fill="${AMBER}"/>
      <circle cx="76" cy="88" r="24" fill="${AMBER}"/>
      <polygon points="56,88 40,94 56,100" fill="${CLAY}"/>
      <circle cx="70" cy="84" r="4" fill="${INK}" stroke="none"/>
      <line x1="96" y1="158" x2="96" y2="172"/>
      <line x1="118" y1="158" x2="118" y2="172"/>
    </g>`,
  ],
  [
    "animal-chevre",
    "Une chèvre",
    ["chèvre", "animal", "bibi"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <rect x="60" y="95" width="90" height="50" rx="18" fill="${PAPER}"/>
      <circle cx="55" cy="80" r="22" fill="${PAPER}"/>
      <path d="M45 62 q-8 -18 6 -20 M65 62 q8 -18 -6 -20" fill="none"/>
      <circle cx="48" cy="78" r="4" fill="${INK}" stroke="none"/>
      <line x1="78" y1="145" x2="78" y2="172"/>
      <line x1="132" y1="145" x2="132" y2="172"/>
    </g>`,
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
    "Un petit poussin devant la porte ouverte du poulailler",
    ["kumu", "poussin", "histoire"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <rect x="18" y="60" width="70" height="110" fill="${STONE}"/>
      <rect x="32" y="86" width="42" height="84" fill="${PAPER}"/>
      <circle cx="132" cy="126" r="30" fill="${AMBER}"/>
      <circle cx="112" cy="102" r="18" fill="${AMBER}"/>
      <polygon points="97,102 84,107 97,112" fill="${CLAY}"/>
      <circle cx="108" cy="99" r="3" fill="${INK}" stroke="none"/>
      <line x1="126" y1="156" x2="126" y2="170"/>
      <line x1="142" y1="156" x2="142" y2="170"/>
    </g>`,
  ],
  [
    "histoire-nsimba",
    "Un enfant avec un sac devant la porte de l’école",
    ["nsimba", "école", "rentrée", "histoire"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <rect x="96" y="34" width="86" height="140" rx="6" fill="${CLAY}"/>
      <circle cx="112" cy="106" r="6" fill="${PAPER}"/>
      <circle cx="58" cy="74" r="20" fill="${PAPER}"/>
      <rect x="40" y="98" width="38" height="48" rx="10" fill="${GREEN}"/>
      <rect x="30" y="104" width="18" height="30" rx="7" fill="${AMBER}"/>
      <line x1="48" y1="146" x2="48" y2="172"/>
      <line x1="70" y1="146" x2="70" y2="172"/>
    </g>`,
  ],
  [
    "histoire-mangue",
    "Une mangue coupée en trois morceaux",
    ["mangue", "partage", "histoire"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <path d="M60 62 q34 -16 44 16 q10 32 -18 46 q-32 14 -40 -18 q-8 -30 14 -44 z" fill="${AMBER}"/>
      <path d="M28 128 q28 -12 36 14 q8 26 -16 34 q-26 8 -32 -14 q-6 -22 12 -34 z" fill="${AMBER}"/>
      <path d="M118 126 q28 -12 36 14 q8 26 -16 34 q-26 8 -32 -14 q-6 -22 12 -34 z" fill="${AMBER}"/>
    </g>`,
  ],
  [
    "histoire-bibi",
    "Une chèvre devant une barrière et des feuilles",
    ["bibi", "chèvre", "jardin", "histoire"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <line x1="126" y1="60" x2="126" y2="168"/>
      <line x1="160" y1="60" x2="160" y2="168"/>
      <line x1="112" y1="92" x2="176" y2="92"/>
      <line x1="112" y1="132" x2="176" y2="132"/>
      <rect x="36" y="104" width="70" height="44" rx="16" fill="${PAPER}"/>
      <circle cx="32" cy="90" r="20" fill="${PAPER}"/>
      <path d="M22 72 q-7 -16 6 -18 M42 72 q7 -16 -6 -18" fill="none"/>
      <circle cx="26" cy="88" r="3" fill="${INK}" stroke="none"/>
      <line x1="52" y1="148" x2="52" y2="172"/>
      <line x1="94" y1="148" x2="94" y2="172"/>
    </g>`,
  ],
  [
    "histoire-marche",
    "Un panier de marché avec des tomates et une banane",
    ["marché", "panier", "histoire"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <circle cx="74" cy="76" r="20" fill="${CLAY}"/>
      <circle cx="114" cy="70" r="20" fill="${CLAY}"/>
      <path d="M128 96 q22 -30 46 -22 q-20 12 -30 30 z" fill="${AMBER}"/>
      <path d="M36 96 h128 l-16 76 h-96 z" fill="${AMBER}"/>
      <path d="M70 94 a30 26 0 0 1 60 0" fill="none"/>
    </g>`,
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
    "Trois cailloux : un rond, un plat et un pointu",
    ["cailloux", "trois", "histoire"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <circle cx="52" cy="120" r="28" fill="${STONE}"/>
      <ellipse cx="104" cy="132" rx="30" ry="16" fill="${STONE}"/>
      <polygon points="156,96 178,140 134,140" fill="${STONE}"/>
    </g>`,
  ],
  [
    "histoire-malo",
    "Un petit chien endormi en rond sous la lune",
    ["malo", "chien", "dormir", "histoire"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <path d="M150 34 a26 26 0 1 0 20 34 a22 22 0 0 1 -20 -34 z" fill="${AMBER}"/>
      <circle cx="92" cy="132" r="42" fill="${PAPER}"/>
      <circle cx="60" cy="146" r="20" fill="${PAPER}"/>
      <path d="M46 132 q-12 -6 -8 -20 q10 4 12 18 z" fill="${STONE}"/>
      <path d="M52 148 q6 4 12 0" fill="none"/>
    </g>`,
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
      ${hand({ cx: 52, top: 90, thumb: 1, scale: 0.92 })}
      ${hand({ cx: 148, top: 90, thumb: -1, scale: 0.92 })}`,
  ],
  [
    "comptine-semaine",
    "Les sept jours de la semaine, alignés",
    ["semaine", "jours", "comptine"],
    `<g stroke="${INK}" stroke-width="5" stroke-linejoin="round">
      <rect x="14" y="80" width="24" height="40" rx="5" fill="${PAPER}"/>
      <rect x="42" y="80" width="24" height="40" rx="5" fill="${PAPER}"/>
      <rect x="70" y="80" width="24" height="40" rx="5" fill="${PAPER}"/>
      <rect x="98" y="80" width="24" height="40" rx="5" fill="${PAPER}"/>
      <rect x="126" y="80" width="24" height="40" rx="5" fill="${PAPER}"/>
      <rect x="154" y="80" width="24" height="40" rx="5" fill="${GREEN}"/>
      <rect x="98" y="130" width="24" height="24" rx="5" fill="${AMBER}"/>
    </g>`,
  ],
  [
    "comptine-cabri",
    "Un petit cabri qui saute",
    ["cabri", "sauter", "comptine"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <rect x="62" y="80" width="74" height="40" rx="16" fill="${PAPER}"/>
      <circle cx="148" cy="66" r="18" fill="${PAPER}"/>
      <path d="M140 50 q-6 -14 5 -16 M158 50 q6 -14 -5 -16" fill="none"/>
      <circle cx="153" cy="64" r="3" fill="${INK}" stroke="none"/>
      <line x1="74" y1="120" x2="58" y2="146"/>
      <line x1="124" y1="120" x2="140" y2="146"/>
      <path d="M26 156 q30 -30 60 -10" fill="none" stroke="${STONE}"/>
    </g>`,
  ],
  [
    "comptine-formes",
    "Les quatre formes qui dansent : rond, carré, rectangle, triangle",
    ["formes", "comptine"],
    `<g stroke="${INK}" stroke-width="5" stroke-linejoin="round">
      <circle cx="46" cy="70" r="24" fill="${CLAY}"/>
      <rect x="112" y="46" width="48" height="48" rx="4" fill="${BLUE}"/>
      <rect x="24" y="118" width="60" height="34" rx="4" fill="${GREEN}"/>
      <polygon points="136,110 166,158 106,158" fill="${AMBER}"/>
    </g>`,
  ],
  [
    "plante-parties",
    "Une plante avec ses feuilles, sa tige et ses racines sous la terre",
    ["plante", "feuille", "tige", "racine"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <line x1="100" y1="128" x2="100" y2="40" stroke="${GREEN}"/>
      <path d="M100 66 q-36 -12 -44 14 q34 12 44 -14 z" fill="${GREEN}"/>
      <path d="M100 92 q36 -12 44 14 q-34 12 -44 -14 z" fill="${GREEN}"/>
      <line x1="20" y1="128" x2="180" y2="128" stroke="${CLAY}"/>
      <path d="M100 128 v20 M100 148 l-22 22 M100 148 l22 22" fill="none" stroke="${STONE}"/>
    </g>`,
  ],
  [
    "bonhomme-articule",
    "Un bonhomme dessiné au crayon sur une feuille, avec les bras et les jambes pliés",
    ["bonhomme", "corps", "articulation", "dessin"],
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
    await format(JSON.stringify(registry, null, 2), { filepath: registryPath }),
    "utf8",
  );
  console.log(`Wrote ${assets.length} assets and content/media/registry.json`);
}

await main();
