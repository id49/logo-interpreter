import { test, expect } from '@playwright/test';
test('built app loads its bundled worker and executes input, procedures and drawing', async ({
  page,
}) => {
  const errors: string[] = [],
    workers: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('worker', (worker) => workers.push(worker.url()));
  await page.goto('/');
  await page
    .locator('.cm-content')
    .fill('to square :size\nrepeat 4 [forward :size right 90]\nend\nprint readword square 20');
  await page.locator('#speed').fill('100');
  await page.locator('#run').click();
  await expect(page.locator('#input-form')).toBeVisible();
  await page.locator('#input').fill('production');
  await page.locator('#input-form button').click();
  await expect(page.locator('#status')).toHaveText('Concluído');
  await expect(page.locator('#console')).toContainText('production\nproduction');
  await expect(page.locator('#coordinates')).toContainText('x 0.0');
  expect(workers[0]).toMatch(/\/assets\/worker-.*\.js$/);
  expect(errors).toEqual([]);
});
