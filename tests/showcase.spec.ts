import { expect, test } from '@playwright/test';

test('all four projects render with correct launch links and no errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle('Doug — App Showcase');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Built to be explored.');
  const projects = [
    ['intentshot', 'https://app.intent-shot.com/'],
    ['ash-and-oath', 'https://ash-and-oath.web.app/'],
    ['project-rone', 'https://project-rone.vercel.app/'],
    ['fuller-chiro', 'https://fuller-chiro-d66b1.web.app/'],
  ];
  for (const [id, url] of projects) {
    const card = page.locator(`#project-${id}`);
    await expect(card).toBeVisible();
    await expect(card.locator('.preview-window')).toHaveAttribute('href', url);
    await expect(card.locator('.launch-button')).toHaveAttribute('href', url);
    await expect(card.locator('.preview-window')).toHaveAttribute('target', '_blank');
    await expect(card.locator('.launch-button')).toHaveAttribute('rel', 'noopener noreferrer');
  }
  await expect(page.locator('#project-intentshot .project-scope')).toHaveText('My work covers the app, not the marketing landing page.');
  const intentShotPreview = page.locator('#project-intentshot .app-screenshot');
  await expect(intentShotPreview).toBeVisible();
  await expect(intentShotPreview).toHaveAttribute('src', '/previews/intent-shot-image.png');
  await expect.poll(() => intentShotPreview.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1897);
  await expect(page.locator('a[href="https://intent-shot.com/"]')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);
});

test('filters show the right projects and announce the result', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Web apps (2)', exact: true }).click();
  await expect(page.locator('.project-card:visible')).toHaveCount(2);
  await expect(page.locator('#project-intentshot')).toBeVisible();
  await expect(page.locator('#project-project-rone')).toBeVisible();
  await page.getByRole('button', { name: 'Games (1)', exact: true }).click();
  await expect(page.locator('.project-card:visible')).toHaveCount(1);
  await expect(page.locator('#project-ash-and-oath')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Games (1)', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status')).toHaveText('Showing 1 game.');
  await page.getByRole('button', { name: 'Websites (1)', exact: true }).click();
  await expect(page.locator('.project-card:visible')).toHaveCount(1);
  await expect(page.locator('#project-fuller-chiro')).toBeVisible();
  await page.getByRole('button', { name: 'All projects (4)', exact: true }).click();
  await expect(page.locator('.project-card:visible')).toHaveCount(4);
});

test('preview window and button open the real destination in a new tab', async ({ page, context }) => {
  // Stub the external document so this test checks navigation independently of provider availability.
  await context.route('https://app.intent-shot.com/**', route => route.fulfill({ contentType: 'text/html', body: '<h1>Test destination</h1>' }));
  await page.goto('/');
  for (const selector of ['.preview-window', '.launch-button']) {
    const popupPromise = page.waitForEvent('popup');
    await page.locator(`#project-intentshot ${selector}`).click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL('https://app.intent-shot.com/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await popup.close();
  }
});

test('keyboard navigation reaches skip link, filters, and project previews', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to projects' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#work$/);
  const games = page.getByRole('button', { name: 'Games (1)', exact: true });
  await games.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.project-card:visible')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Launch Ash and Oath in a new tab' })).toBeFocused();
});

test('missing screenshot files fall back to a labeled cover without breaking launch links', async ({ page }) => {
  await page.route('**/previews/*.png', route => route.abort());
  await page.goto('/');
  await expect(page.locator('.project-cover')).toHaveCount(4);
  await expect(page.locator('.app-screenshot')).toHaveCount(0);
  await expect(page.locator('#project-ash-and-oath .preview-caption')).toHaveText('Project cover · Sign-in required');
  await expect(page.locator('#project-project-rone .launch-button')).toHaveAttribute('href', 'https://project-rone.vercel.app/');
});
