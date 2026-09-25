/**
 * Review index for evidence not yet inspected: full-scroll phone frames and the four
 * initial-screen viewport sets never reviewed by hand. Reads existing captures only; never
 * opens the app, never marks anything reviewed except frames an earlier manifest names.
 * ASTRA_SHEETS=0 writes the manifests without rendering sheets. Existing sheets are kept.
 */
import { chromium } from "@playwright/test";
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
const root = "private/astra-visual-evidence";
const out = `${root}/remaining-review`;
const scrollSource = `${root}/interactions-scroll`;
const initialSource = `${root}/after-fourwords`;
const scrollEvidence = JSON.parse(
  readFileSync("docs/review/media/astra-interaction-scroll-evidence.json", "utf8"),
);
const { sessions } = JSON.parse(
  readFileSync("docs/review/media/astra-baseline/inventory.json", "utf8"),
);
const renderSheets = process.env.ASTRA_SHEETS !== "0";
const png = (file) => {
  const b = readFileSync(file);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
};
const numeric = (a, b) => a.localeCompare(b, undefined, { numeric: true });
const problems = [];

// Full-scroll frames, one row per captured state.
const previouslyReviewed = new Set(scrollEvidence.manuallyReviewedFrames);
const scrollStates = readdirSync(scrollSource)
  .filter((f) => f.endsWith(".json"))
  .sort(numeric)
  .flatMap((f) => JSON.parse(readFileSync(`${scrollSource}/${f}`, "utf8")))
  .filter((s) => s.frames.length);
const seenFrames = new Set();
const scrollRows = scrollStates.map((s) => {
  const viewport = s.filename.split("-")[0];
  const frames = s.frames.map((file, index) => {
    if (seenFrames.has(file)) problems.push(`duplicate frame ${file}`);
    seenFrames.add(file);
    if (!existsSync(`${scrollSource}/${file}`)) problems.push(`missing frame ${file}`);
    return {
      file,
      position: index + 1,
      of: s.frames.length,
      scrollTop: Number(file.match(/-scroll-(\d+)\.png$/)[1]),
      reviewed: previouslyReviewed.has(file),
    };
  });
  return {
    viewport,
    activity: s.activity,
    state: s.name,
    stateScreenshot: s.filename,
    clientHeight: s.scrollGeometry.clientHeight,
    scrollHeight: s.scrollGeometry.scrollHeight,
    frames,
  };
});
for (const f of previouslyReviewed) {
  if (!seenFrames.has(f)) problems.push(`previously reviewed frame not in capture: ${f}`);
}

// Pack whole states into sheets of at most three rows of five 320px frames.
const scrollSheets = [];
let current = [];
let rows = 0;
for (const row of scrollRows.filter((r) => r.frames.some((f) => !f.reviewed))) {
  const needed = Math.ceil(row.frames.length / 5);
  if (current.length && rows + needed > 3) {
    scrollSheets.push(current);
    current = [];
    rows = 0;
  }
  current.push(row);
  rows += needed;
}
if (current.length) scrollSheets.push(current);

// Initial child screens at the four viewport sets that have no manual review.
const sourceTime = statSync(initialSource).mtime.toISOString();
const initialSets = [
  ["large-phone", 4, 8],
  ["tablet-portrait", 2, 4],
  ["tablet-landscape", 2, 4],
  ["desktop", 2, 4],
];
const order = sessions.flatMap(({ level, day, session }) =>
  session.steps.flatMap((s) => s.activities).map((a) => ({ level, day, activity: a })),
);
const initial = initialSets.map(([viewport, columns, perSheet]) => {
  const rows = new Map(
    order
      .map(({ level, day }) => `${initialSource}/${viewport}-${level}-${day}.json`)
      .filter((f, i, all) => all.indexOf(f) === i)
      .flatMap((f) => JSON.parse(readFileSync(f, "utf8")))
      .map((r) => [r.activity, r]),
  );
  const panels = order.map(({ level, day, activity }) => {
    const file = `${viewport}-${activity.id}.png`;
    if (!existsSync(`${initialSource}/${file}`)) {
      problems.push(`missing ${file}`);
      return null;
    }
    const captured = rows.get(activity.id);
    if (!captured) problems.push(`no capture record for ${file}`);
    const later = [];
    // Changes committed after this capture set (30769a0, 7e74ecb, 4a062ee) that could apply.
    if (/\n\d+ \/ \d+\n/.test(captured?.child.text ?? "")) {
      later.push("story page counter now single-line (7e74ecb)");
    }
    if (viewport === "desktop" && activity.renderer === "word-cards") {
      later.push("word grid ≥1280px now count-aware (30769a0)");
    }
    if (viewport === "desktop" && captured?.child.images.length === 5) {
      later.push("five choices ≥1280px may now be one row (4a062ee)");
    }
    return {
      level,
      day,
      activity: activity.id,
      renderer: activity.renderer,
      file,
      ...png(`${initialSource}/${file}`),
      possiblyStale: later,
      reviewed: false,
    };
  });
  const present = panels.filter(Boolean);
  const sheets = [];
  for (let i = 0; i < present.length; i += perSheet) {
    sheets.push({
      sheet: `${viewport}/${viewport}-${String(i / perSheet + 1).padStart(3, "0")}.png`,
      panels: present.slice(i, i + perSheet),
      reviewed: false,
    });
  }
  return { viewport, columns, panels: present, sheets };
});

const scrollManifest = {
  generated: "scripts/astra-remaining-sheets.mjs",
  source: scrollSource,
  sourceBuild: scrollEvidence.build,
  meaning:
    "Capture coverage lists every frame the walker saved. Manual review is only the `reviewed` flag, true solely for frames named in astra-interaction-scroll-evidence.json. Sheets do not review anything.",
  frames: seenFrames.size,
  statesWithFrames: scrollRows.length,
  reviewedFrames: scrollRows.flatMap((r) => r.frames).filter((f) => f.reviewed).length,
  sheets: scrollSheets.map((sheetRows, i) => ({
    sheet: `scroll/scroll-${String(i + 1).padStart(3, "0")}.png`,
    states: sheetRows.map((r) => `${r.activity} · ${r.state}`),
    reviewed: false,
  })),
  states: scrollRows,
};
const initialManifest = {
  generated: "scripts/astra-remaining-sheets.mjs",
  source: initialSource,
  sourceRevision: `Uncommitted working tree after 0e9e4e5, directory last written ${sourceTime}; exact revision not recorded. Predates runtime commits 30769a0, 7e74ecb and 4a062ee.`,
  staleness:
    "`possiblyStale` names a later runtime change that could alter a panel; empty does not prove the panel is current. Initial screens only: no retry, reveal, page or scroll states at these sizes.",
  meaning: "Every panel and sheet is unreviewed. Capture exists; no manual inspection recorded.",
  viewports: initial.map(({ viewport, panels, sheets }) => ({
    viewport,
    sourceDimensions: [...new Set(panels.map((p) => `${p.width}x${p.height}`))],
    screens: panels.length,
    possiblyStale: panels.filter((p) => p.possiblyStale.length).length,
    sheets,
  })),
};
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
mkdirSync(`${out}/scroll`, { recursive: true });
writeFileSync(`${out}/scroll-manifest.json`, JSON.stringify(scrollManifest, null, 2) + "\n");
writeFileSync(`${out}/initial-manifest.json`, JSON.stringify(initialManifest, null, 2) + "\n");

if (renderSheets) {
  const style = `body{font:16px system-ui;background:#dedad1;margin:16px;color:#1c1917}h1{font-size:22px;margin:0 0 4px}p.note{margin:0 0 12px;font-size:15px}h2{font-size:17px;margin:6px 4px}h3{font-size:14px;margin:4px;font-weight:600}section.state{background:#f5f1e8;border:2px solid #57534e;margin-bottom:16px;padding:8px}div.frames{display:grid;grid-template-columns:repeat(5,320px);gap:16px}figure{margin:0;background:white}figure.done{outline:6px solid #0d9488}figcaption{font-size:13px;padding:4px}main{display:grid;gap:16px}section.panel{background:white}.stale{color:#9a3412;font-size:13px;margin:4px}`;
  const image = (file) => `data:image/png;base64,${readFileSync(file).toString("base64")}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 5 * 336 + 48, height: 1200 } });
  for (const [i, sheetRows] of scrollSheets.entries()) {
    const path = `${out}/${scrollManifest.sheets[i].sheet}`;
    if (existsSync(path)) continue;
    const body = sheetRows
      .map(
        (r) =>
          `<section class="state"><h2>${r.activity} · état « ${r.state} » · ${r.viewport} ${320}×${r.clientHeight} · page ${r.scrollHeight}px</h2><div class="frames">${r.frames
            .map(
              (f) =>
                `<figure class="${f.reviewed ? "done" : ""}"><figcaption>Scroll position ${f.position} / ${f.of} · scrollTop ${f.scrollTop}px${f.reviewed ? " · already reviewed" : ""}<br>${f.file}</figcaption><img width="320" height="${r.clientHeight}" src="${image(`${scrollSource}/${f.file}`)}"></figure>`,
            )
            .join("")}</div></section>`,
      )
      .join("");
    await page.setContent(
      `<html><style>${style}</style><h1>Full-scroll frames · ${scrollManifest.sheets[i].sheet}</h1><p class="note">Each row is ONE state at separate scroll positions of the same screen (step 80% of the viewport, so frames overlap). Not separate screens. Unreviewed unless outlined “already reviewed”.</p>${body}</html>`,
    );
    await page.screenshot({ path, fullPage: true });
  }
  await page.close();
  for (const { viewport, columns, sheets } of initial) {
    mkdirSync(`${out}/${viewport}`, { recursive: true });
    const width = sheets[0].panels[0].width;
    const sheetPage = await browser.newPage({
      viewport: { width: columns * (width + 16) + 32, height: 1200 },
    });
    for (const { sheet, panels } of sheets) {
      const path = `${out}/${sheet}`;
      if (existsSync(path)) continue;
      const cards = panels
        .map(
          (p) =>
            `<section class="panel"><h3>${p.activity} · class ${p.level} day ${p.day} · ${p.renderer} · source ${p.width}×${p.height}<br>${p.file}</h3>${p.possiblyStale.map((s) => `<div class="stale">Possibly stale: ${s}</div>`).join("")}<img width="${p.width}" height="${p.height}" src="${image(`${initialSource}/${p.file}`)}"></section>`,
        )
        .join("");
      await sheetPage.setContent(
        `<html><style>${style}main{grid-template-columns:repeat(${columns},${width}px)}</style><h1>Initial child screens · ${viewport} · ${sheet}</h1><p class="note">Actual source size, unscaled. Captured before runtime commits 30769a0, 7e74ecb, 4a062ee (${sourceTime}). Unreviewed.</p><main>${cards}</main></html>`,
      );
      await sheetPage.screenshot({ path, fullPage: true });
    }
    await sheetPage.close();
  }
  await browser.close();
}
const initialSheets = initial.reduce((n, v) => n + v.sheets.length, 0);
console.log(
  `${scrollManifest.frames} scroll frames in ${scrollRows.length} states (${scrollManifest.reviewedFrames} previously reviewed); ${scrollSheets.length} scroll sheets; ${initialSheets} initial sheets for ${initial.map((v) => `${v.viewport} ${v.panels.length}`).join(", ")}${renderSheets ? "" : " (manifests only)"}. Nothing marked reviewed.`,
);
