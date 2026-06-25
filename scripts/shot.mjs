// ヘッドレスChromiumでアプリを描画してスクショ＋コンソール/ページエラーを出力。
// 使い方: node scripts/shot.mjs [url] [out.png]
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'fs';

// 事前インストール済みChromiumを直接指定（playwright版とブラウザ版がズレているため）
function findChrome() {
  const base = '/opt/pw-browsers';
  try {
    for (const d of readdirSync(base)) {
      if (d.startsWith('chromium-')) {
        const p = `${base}/${d}/chrome-linux/chrome`;
        if (existsSync(p)) return p;
      }
    }
  } catch {}
  return undefined;
}

const url = process.argv[2] || 'http://localhost:5173/';
const out = process.argv[3] || '/tmp/shot.png';
const waitMs = parseInt(process.env.SHOT_WAIT || '6000', 10);
const W = parseInt(process.env.SHOT_W || '1440', 10);
const H = parseInt(process.env.SHOT_H || '810', 10);

const browser = await chromium.launch({
  headless: true,
  executablePath: findChrome(),
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
  ],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`);
});
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

try {
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
} catch (e) {
  console.log('GOTO-FAIL: ' + e.message);
}
// 3Dの見た目を見たいので文字UIは隠す
if (process.env.SHOT_HIDEUI !== '0') {
  await page
    .addStyleTag({ content: '.sidenav,.topbar,.menu-backdrop,.hud-caption,.notice{display:none !important}' })
    .catch(() => {});
}
await page.waitForTimeout(waitMs);
// SHOT_CLIP="x,y,w,h" で一部だけ原寸キャプチャ（細部の確認用）
let clip;
if (process.env.SHOT_CLIP) {
  const [x, y, w, h] = process.env.SHOT_CLIP.split(',').map(Number);
  clip = { x, y, width: w, height: h };
}
await page.screenshot({ path: out, ...(clip ? { clip } : {}) });
await browser.close();

if (logs.length) {
  console.log('--- console/page errors ---');
  console.log(logs.slice(0, 40).join('\n'));
} else {
  console.log('(no console errors)');
}
console.log('SHOT: ' + out);
