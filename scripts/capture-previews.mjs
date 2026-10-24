import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projects = JSON.parse(await readFile(path.join(root, 'src/projects.json'), 'utf8'));
const manifestPath = path.join(root, 'src/previews.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
await mkdir(path.join(root, 'public/previews'), { recursive: true });
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const browser = await chromium.launch({ executablePath });
let failures = 0;
try {
  for (const project of projects) {
    if (manifest[project.id]?.source === 'user-provided') {
      console.log(`${project.title}: preserving user-provided screenshot`);
      continue;
    }
    const page = await browser.newPage({ viewport: { width: 1440, height: 820 }, deviceScaleFactor: 1 });
    try {
      const failedStyles = [];
      page.on('requestfailed', request => {
        if (request.resourceType() === 'stylesheet' || new URL(request.url()).hostname === 'cdn.tailwindcss.com') failedStyles.push(request.url());
      });
      const response = await page.goto(project.url, { waitUntil: 'load', timeout: 30000 });
      if (!response?.ok()) throw new Error(`HTTP ${response?.status() || 'no response'}`);
      await page.waitForFunction(() => document.body.innerText.trim().length > 20, undefined, { timeout: 15000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => [...document.images].filter(img => { const box = img.getBoundingClientRect(); return box.bottom > 0 && box.top < innerHeight; }).every(img => img.complete && img.naturalWidth > 0), undefined, { timeout: 15000 });
      if (failedStyles.length) throw new Error('Required remote styles did not load');
      const body = await page.locator('body').innerText();
      if (body.trim().length < 20 || /CONNECT tunnel failed|ERR_CERT_AUTHORITY_INVALID|access denied|blocked by.*proxy/i.test(body)) throw new Error('Page content unavailable');
      const file = `${project.id}.png`;
      await page.screenshot({ path: path.join(root, 'public/previews', file) });
      manifest[project.id] = { src: `/previews/${file}`, alt: `${project.title} public entry screen`, capturedAt: new Date().toISOString() };
      console.log(`${project.title}: screenshot saved`);
    } catch (error) {
      failures++;
      console.error(`${project.title}: capture failed; keeping existing preview. ${error.message.split('\n')[0]}`);
    } finally { await page.close(); }
  }
} finally { await browser.close(); }
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
if (failures) process.exitCode = 1;
