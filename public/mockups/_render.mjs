import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(dir, "nutrogin-detail.html");
const outDir = path.join(dir, "..", "product", "detail"); // 서빙 경로: /product/detail/
fs.mkdirSync(outDir, { recursive: true });

// 렌더 매트릭스: 3종 × (데스크톱 860 / 모바일 750). 파일명은 슬러그(nutrogin-<tone>) 기준.
const tones = process.argv[2] ? [process.argv[2]] : ["focus", "clear", "rest"];
const modes = [
  { name: "", width: 860 },
  { name: "-mobile", width: 750 },
];

const browser = await chromium.launch();
for (const tone of tones) {
  for (const m of modes) {
    const page = await browser.newPage({ viewport: { width: m.width, height: 1200 }, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(html).href + `?p=${tone}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    const out = path.join(outDir, `nutrogin-${tone}-detail${m.name}.png`);
    await page.screenshot({ path: out, fullPage: true });
    console.log(`${tone}${m.name || "(desktop)"}  ${m.width}px  -> product/detail/${path.basename(out)}`);
    await page.close();
  }
}
await browser.close();
