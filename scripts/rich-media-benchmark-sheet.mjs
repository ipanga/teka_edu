import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const benchmarkDir = join(root, "docs/review/media/september-rich-benchmark");
const items = [
  ["Simple object · SVG control", join(root, "public/media/objects/objet-seau.svg")],
  ["Body vocabulary · WebP", join(benchmarkDir, "corps-tete.webp")],
  ["Recurring character · WebP", join(benchmarkDir, "nsimba-character.webp")],
  ["Story page · WebP", join(benchmarkDir, "nsimba-school-gate.webp")],
  ["Rhyme · WebP", join(benchmarkDir, "comptine-bonjour.webp")],
  ["Expressive animal · WebP", join(benchmarkDir, "bibi-character.webp")],
  ["Contextual scene · WebP", join(benchmarkDir, "mangue-partagee.webp")],
];

const cardWidth = 440;
const cardHeight = 390;
const gap = 24;
const columns = 4;
const rows = 2;
const width = columns * cardWidth + (columns + 1) * gap;
const height = rows * cardHeight + (rows + 1) * gap + 70;

const cards = await Promise.all(
  items.map(async ([label, file]) => {
    const picture = await sharp(await readFile(file), { density: 192 })
      .resize(cardWidth - 36, cardHeight - 84, {
        fit: "contain",
        background: "#f4efe5",
      })
      .flatten({ background: "#f4efe5" })
      .png()
      .toBuffer();
    const labelSvg =
      Buffer.from(`<svg width="${cardWidth - 36}" height="40" xmlns="http://www.w3.org/2000/svg">
      <text x="${(cardWidth - 36) / 2}" y="27" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#202938">${label.replaceAll("&", "&amp;")}</text>
    </svg>`);
    return sharp({
      create: { width: cardWidth, height: cardHeight, channels: 4, background: "#ffffff" },
    })
      .composite([
        { input: picture, left: 18, top: 18 },
        { input: labelSvg, left: 18, top: cardHeight - 56 },
      ])
      .png()
      .toBuffer();
  }),
);

const composites = cards.map((input, index) => ({
  input,
  left: gap + (index % columns) * (cardWidth + gap),
  top: 82 + gap + Math.floor(index / columns) * (cardHeight + gap),
}));
const heading = Buffer.from(`<svg width="${width}" height="70" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fffaf0"/>
  <text x="24" y="43" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#202938">Teka Edu · September rich-media Phase B benchmark</text>
</svg>`);

const output = join(root, "docs/review/media/september-rich-benchmark.png");
await sharp({ create: { width, height, channels: 4, background: "#fffaf0" } })
  .composite([{ input: heading, left: 0, top: 0 }, ...composites])
  .png({ compressionLevel: 9 })
  .toFile(output);

await writeFile(
  join(benchmarkDir, "README.md"),
  `# Phase B benchmark assets\n\nThese files are non-production candidates for owner review. The registered production assets remain unchanged. WebP is the proposed delivery format for rich raster art; \`objet-seau.svg\` is the retained simple-object control.\n`,
);

console.log(output);
