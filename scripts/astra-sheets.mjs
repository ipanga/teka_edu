import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
const { assets } = JSON.parse(readFileSync("content/media/registry.json", "utf8"));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 1140 } });
for (let i = 0; i < assets.length; i += 9) {
  const group = assets.slice(i, i + 9);
  await page.setContent(
    `<html><style>body{font:16px system-ui;background:#fffdf7;color:#1f2937;margin:24px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}figure{margin:0;background:#f4efe4;border-radius:20px;padding:10px;text-align:center}img{width:270px;height:270px}figcaption{height:32px;font-weight:600}</style><h1>September baseline · ${i + 1}–${i + group.length} / 49</h1><main>${group.map((a) => `<figure><img src="data:image/svg+xml;base64,${readFileSync("public/media/" + a.file).toString("base64")}"><figcaption>${a.id}</figcaption></figure>`).join("")}</main></html>`,
  );
  await page.screenshot({
    path: `docs/review/media/astra-baseline/assets-${1 + i / 9}.png`,
    fullPage: true,
  });
}
await browser.close();
