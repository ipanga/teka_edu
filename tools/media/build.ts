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
];

/** Objects a September lesson names: the three vocabulary corpora and what gets counted. */
const OBJECTS: [id: string, alt: string, tags: string[], body: string][] = [
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
    `<g stroke="${INK}" stroke-width="6" stroke-linecap="round">
      <rect x="25" y="70" width="150" height="20" rx="6" fill="${AMBER}"/>
      <line x1="45" y1="90" x2="45" y2="165"/>
      <line x1="155" y1="90" x2="155" y2="165"/>
    </g>`,
  ],
  [
    "objet-chaise",
    "Une chaise",
    ["chaise", "maison", "école"],
    `<g stroke="${INK}" stroke-width="6" stroke-linecap="round">
      <rect x="65" y="35" width="18" height="95" fill="${CLAY}"/>
      <rect x="65" y="105" width="80" height="18" fill="${AMBER}"/>
      <line x1="75" y1="123" x2="75" y2="170"/>
      <line x1="137" y1="123" x2="137" y2="170"/>
    </g>`,
  ],
  [
    "objet-porte",
    "Une porte",
    ["porte", "maison"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <rect x="55" y="30" width="90" height="145" rx="6" fill="${CLAY}"/>
      <circle cx="128" cy="105" r="7" fill="${PAPER}"/>
    </g>`,
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
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <path d="M55 75 h90 l-12 95 h-66 z" fill="${BLUE}"/>
      <path d="M62 72 a38 30 0 0 1 76 0" fill="none"/>
    </g>`,
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
    "Une main ouverte",
    ["main", "corps"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" fill="${AMBER}">
      <rect x="72" y="92" width="56" height="62" rx="14"/>
      <rect x="72" y="46" width="13" height="52" rx="6"/>
      <rect x="90" y="36" width="13" height="62" rx="6"/>
      <rect x="108" y="44" width="13" height="54" rx="6"/>
      <rect x="124" y="58" width="13" height="42" rx="6"/>
      <rect x="52" y="96" width="24" height="13" rx="6"/>
    </g>`,
  ],
  [
    "corps-pied",
    "Un pied",
    ["pied", "corps"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" fill="${AMBER}">
      <path d="M78 46 q26 0 30 26 l6 52 q4 30 -26 30 q-28 0 -28 -28 l0 -54 q0 -26 18 -26 z"/>
      <circle cx="122" cy="70" r="9"/>
      <circle cx="134" cy="84" r="8"/>
      <circle cx="141" cy="100" r="7"/>
      <circle cx="144" cy="116" r="6"/>
    </g>`,
  ],
  [
    "corps-tete",
    "Une tête",
    ["tête", "corps", "visage"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="100" cy="98" r="52" fill="${AMBER}"/>
      <circle cx="82" cy="90" r="6" fill="${INK}" stroke="none"/>
      <circle cx="118" cy="90" r="6" fill="${INK}" stroke="none"/>
      <path d="M82 118 q18 14 36 0" fill="none"/>
      <path d="M48 92 q-12 0 -12 12 q0 12 12 12" fill="${AMBER}"/>
      <path d="M152 92 q12 0 12 12 q0 12 -12 12" fill="${AMBER}"/>
    </g>`,
  ],
  [
    "corps-ventre",
    "Le ventre",
    ["ventre", "corps"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
      <path d="M62 52 q38 -12 76 0 l0 96 q-38 12 -76 0 z" fill="${BLUE}"/>
      <circle cx="100" cy="104" r="7" fill="${INK}" stroke="none"/>
      <path d="M62 52 q-16 10 -18 34" fill="none"/>
      <path d="M138 52 q16 10 18 34" fill="none"/>
    </g>`,
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
    "Un seau posé sur une chaise",
    ["histoire", "seau", "chaise"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
      <rect x="44" y="120" width="60" height="8" fill="${AMBER}"/>
      <rect x="48" y="128" width="8" height="42" fill="${AMBER}"/>
      <rect x="92" y="128" width="8" height="42" fill="${AMBER}"/>
      <rect x="92" y="74" width="8" height="52" fill="${AMBER}"/>
      <path d="M106 76 l44 0 l-8 44 l-28 0 z" fill="${BLUE}"/>
      <path d="M108 76 q20 -22 40 0" fill="none"/>
    </g>`,
  ],
  [
    "histoire-tika",
    "Un enfant qui se lève de son lit, le soleil à la fenêtre",
    ["histoire", "matin", "lit"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="150" cy="56" r="20" fill="${AMBER}"/>
      <rect x="30" y="110" width="96" height="10" fill="${CLAY}"/>
      <rect x="30" y="120" width="10" height="40" fill="${CLAY}"/>
      <rect x="116" y="120" width="10" height="40" fill="${CLAY}"/>
      <rect x="34" y="92" width="26" height="20" rx="6" fill="${PAPER}"/>
      <circle cx="84" cy="82" r="16" fill="${AMBER}"/>
      <path d="M84 98 l0 14" fill="none"/>
    </g>`,
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
    "La pluie qui tombe sur un toit",
    ["pluie", "toit", "histoire"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <polygon points="100,58 178,110 22,110" fill="${CLAY}"/>
      <rect x="46" y="110" width="108" height="58" fill="${PAPER}"/>
      <path d="M58 26 q8 14 0 18 q-8 -4 0 -18 z" fill="${BLUE}"/>
      <path d="M100 16 q8 14 0 18 q-8 -4 0 -18 z" fill="${BLUE}"/>
      <path d="M142 26 q8 14 0 18 q-8 -4 0 -18 z" fill="${BLUE}"/>
    </g>`,
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
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <rect x="66" y="58" width="18" height="60" rx="9" fill="${PAPER}"/>
      <rect x="90" y="44" width="18" height="74" rx="9" fill="${PAPER}"/>
      <rect x="114" y="58" width="18" height="60" rx="9" fill="${PAPER}"/>
      <path d="M58 110 h84 v28 a42 42 0 0 1 -84 0 z" fill="${PAPER}"/>
    </g>`,
  ],
  [
    "comptine-bonjour",
    "Le soleil qui se lève et deux mains qui se saluent",
    ["bonjour", "soleil", "comptine"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <circle cx="100" cy="76" r="30" fill="${AMBER}"/>
      <line x1="100" y1="26" x2="100" y2="38"/>
      <line x1="56" y1="40" x2="64" y2="50"/>
      <line x1="144" y1="40" x2="136" y2="50"/>
      <path d="M40 148 q22 -22 44 0" fill="${PAPER}"/>
      <path d="M116 148 q22 -22 44 0" fill="${PAPER}"/>
      <line x1="30" y1="150" x2="170" y2="150"/>
    </g>`,
  ],
  [
    "comptine-mains",
    "Deux mains levées",
    ["mains", "corps", "comptine"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round">
      <path d="M44 96 h44 v44 a22 22 0 0 1 -44 0 z" fill="${PAPER}"/>
      <rect x="46" y="56" width="14" height="46" rx="7" fill="${PAPER}"/>
      <rect x="64" y="46" width="14" height="56" rx="7" fill="${PAPER}"/>
      <path d="M112 96 h44 v44 a22 22 0 0 1 -44 0 z" fill="${PAPER}"/>
      <rect x="122" y="46" width="14" height="56" rx="7" fill="${PAPER}"/>
      <rect x="140" y="56" width="14" height="46" rx="7" fill="${PAPER}"/>
    </g>`,
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
    "Un bonhomme dessiné avec les bras et les jambes pliés",
    ["bonhomme", "corps", "articulation", "dessin"],
    `<g stroke="${INK}" stroke-width="6" stroke-linejoin="round" fill="none">
      <circle cx="100" cy="46" r="22" fill="${PAPER}"/>
      <line x1="100" y1="68" x2="100" y2="122"/>
      <path d="M100 82 l-30 14 l-8 30"/>
      <path d="M100 82 l30 14 l8 30"/>
      <path d="M100 122 l-22 26 l4 30"/>
      <path d="M100 122 l22 26 l-4 30"/>
    </g>`,
  ],
];

function svg(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img" fill="none">\n  ${body.trim()}\n</svg>\n`;
}

function main() {
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
    })),
  };
  writeFileSync(
    path.join(ROOT, "content/media/registry.json"),
    `${JSON.stringify(registry, null, 2)}\n`,
    "utf8",
  );
  console.log(`Wrote ${assets.length} assets and content/media/registry.json`);
}

main();
