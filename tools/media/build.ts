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
import { mkdirSync, writeFileSync } from "node:fs";
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
  kind: "shape" | "object" | "animal";
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
    ...ANIMALS.map(([id, alt, tags, body]) => ({
      id,
      kind: "animal" as const,
      file: `animals/${id}.svg`,
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
