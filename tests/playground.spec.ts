import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
async function code(page: Page, text: string) {
  await page.locator('.cm-content').fill(text);
}
async function instant(page: Page) {
  await page.locator('#speed').fill('100');
}
async function run(page: Page, text: string) {
  await code(page, text);
  await instant(page);
  await page.locator('#run').click();
}
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});
test('square end-to-end, syntax highlighting, both turtle appearances and clean state', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await expect(page.locator('.cm-content')).toContainText('repita');
  expect(await page.locator('.cm-content span').count()).toBeGreaterThan(3);
  await instant(page);
  await page.locator('#run').click();
  await expect(page.locator('#status')).toHaveText('Concluído');
  await expect(page.locator('#coordinates')).toContainText('0.0');
  await expect(page.locator('#canvas')).toHaveScreenshot('turtle-square.png');
  const coordinates = await page.locator('#coordinates').textContent();
  await page.locator('#appearance').selectOption('triangle');
  await expect(page.locator('#coordinates')).toHaveText(coordinates!);
  await expect(page.locator('#canvas')).toHaveScreenshot('triangle-square.png');
  await page.locator('#appearance').selectOption('turtle');
  await expect(page.locator('#canvas')).toHaveScreenshot('turtle-square.png');
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});
test('one step executes one instruction inside repeat with argument procedure', async ({
  page,
}) => {
  await code(page, 'to amount\noutput 12\nend\nrepeat 2 [forward amount right 90]');
  await instant(page);
  await page.locator('#step').click();
  await expect(page.locator('#status')).toHaveText('Pausado');
  await expect(page.locator('.executing-line')).toHaveCount(1);
  await expect(page.locator('#coordinates')).toContainText('y 0.0');
  await page.locator('#step').click();
  await expect(page.locator('#coordinates')).toContainText('y 12.0');
  await expect(page.locator('#coordinates')).toContainText('0°');
  await page.locator('#step').click();
  await expect(page.locator('#coordinates')).toContainText('90°');
  await page.locator('#resume').click();
  await expect(page.locator('#status')).toHaveText('Concluído');
  await expect(page.locator('#coordinates')).toContainText('x 12.0');
});
test('stop preserves drawing, new run resets and cancel recovers from an infinite program', async ({
  page,
}) => {
  await code(page, 'to forever\nforward 2\nforever\nend\nforever');
  await page.locator('#speed').fill('90');
  await page.locator('#run').click();
  await expect(page.locator('#coordinates')).not.toContainText('y 0.0');
  await page.locator('#stop').click();
  await expect(page.locator('#status')).toHaveText('Interrompido');
  const coordinates = await page.locator('#coordinates').textContent();
  await page.waitForTimeout(150);
  await expect(page.locator('#coordinates')).toHaveText(coordinates!);
  await run(page, 'forward 7');
  await expect(page.locator('#status')).toHaveText('Concluído');
  await expect(page.locator('#coordinates')).toContainText('y 7.0');
});
test('pause, change speed, continue', async ({ page }) => {
  await code(page, 'repeat 15 [forward 2]');
  await page.locator('#speed').fill('70');
  await page.locator('#run').click();
  await expect(page.locator('#coordinates')).not.toContainText('y 0.0');
  await page.locator('#pause').click();
  await expect(page.locator('#status')).toHaveText('Pausado');
  const position = await page.locator('#coordinates').textContent();
  await page.waitForTimeout(200);
  await expect(page.locator('#coordinates')).toHaveText(position!);
  await instant(page);
  await page.locator('#resume').click();
  await expect(page.locator('#status')).toHaveText('Concluído');
  await expect(page.locator('#coordinates')).toContainText('y 30.0');
});
test('consecutive input, invalid input retry, step input and cancellation', async ({ page }) => {
  await run(page, 'print readchar show readlist print readword');
  await expect(page.locator('#input-form')).toBeVisible();
  await page.locator('#input').fill('abc');
  await page.locator('#input-form button').click();
  await expect(page.locator('#console')).toContainText('exatamente um');
  await page.locator('#input').fill('🐢');
  await page.locator('#input-form button').click();
  await expect(page.locator('#input-label')).toContainText('readlist');
  await page.locator('#input').fill('[bad');
  await page.locator('#input-form button').click();
  await expect(page.locator('#console')).toContainText('sem fechamento');
  await page.locator('#input').fill('1 [a b]');
  await page.locator('#input-form button').click();
  await expect(page.locator('#input-label')).toContainText('readword');
  await page.locator('#input').fill('hello world');
  await page.locator('#input-form button').click();
  await expect(page.locator('#status')).toHaveText('Concluído');
  await expect(page.locator('#console')).toContainText('[1 [a b]]');
  await code(page, 'print readword forward 9');
  await page.locator('#step').click();
  await expect(page.locator('#input-form')).toBeVisible();
  await page.locator('#input').fill('step');
  await page.locator('#input-form button').click();
  await expect(page.locator('#status')).toHaveText('Pausado');
  await expect(page.locator('#coordinates')).toContainText('y 0.0');
  await page.locator('#step').click();
  await expect(page.locator('#status')).toHaveText('Concluído');
  await run(page, 'print readword');
  await expect(page.locator('#input-form')).toBeVisible();
  await page.locator('#stop').click();
  await expect(page.locator('#input-form')).toBeHidden();
  await run(page, 'print "recovered');
  await expect(page.locator('#console')).toHaveText('recovered\n');
});
test('pause during input retains entered response until continue', async ({ page }) => {
  await run(page, 'print readword forward 20');
  await expect(page.locator('#input-form')).toBeVisible();
  await page.locator('#pause').click();
  await page.locator('#input').fill('answer');
  await page.locator('#input-form button').click();
  await expect(page.locator('#status')).toHaveText('Pausado');
  await expect(page.locator('#console')).toHaveText('❯ answer\n');
  await page.locator('#resume').click();
  await expect(page.locator('#status')).toHaveText('Concluído');
  await expect(page.locator('#console')).toHaveText('❯ answer\nanswer\n');
});
test('open, edit, download, reopen preserves exact unicode content and warns before replacement', async ({
  page,
}) => {
  const original = '\uFEFF; Olá 🐢\r\nprint [um dois]\r\n\r\n';
  await page
    .locator('#file')
    .setInputFiles({ name: 'a.logo', mimeType: 'text/plain', buffer: Buffer.from(original) });
  await expect(page.locator('.cm-content')).toContainText('Olá');
  // Saving unedited files must preserve the original newline encoding too.
  let download = page.waitForEvent('download');
  await page.locator('#save').click();
  let path = await (await download).path();
  expect(await readFile(path!, 'utf8')).toBe(original);
  const edited = '; alteração 🐢\nrepeat 3 [forward 30 right 120]\n';
  await code(page, edited);
  await expect(page.locator('#dirty')).toContainText('não salvas');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.locator('#new').click();
  await expect(page.locator('.cm-content')).toContainText('alteração');
  download = page.waitForEvent('download');
  await page.locator('#save').click();
  path = await (await download).path();
  expect(await readFile(path!, 'utf8')).toBe(edited);
  await page.locator('#new').click();
  await expect(page.locator('.cm-content')).toHaveText('');
  await page.locator('#file').setInputFiles(path!);
  await expect(page.locator('.cm-content')).toContainText('repeat 3');
  await instant(page);
  await page.locator('#run').click();
  await expect(page.locator('#status')).toHaveText('Concluído');
});
test('language and mode changes never rewrite code; localized UI is independent', async ({
  page,
}) => {
  await code(page, 'FD 10');
  await page.locator('#mode').selectOption('strict');
  await page.locator('#command-language').selectOption('en');
  await page.locator('#ui-language').selectOption('en');
  await page.locator('#run').click();
  await expect(page.locator('#diagnostic')).toContainText('forward');
  await expect(page.locator('.cm-content')).toHaveText('FD 10');
  await page.locator('#mode').selectOption('strict-abbreviations');
  await code(page, 'fd 10');
  await instant(page);
  await page.locator('#run').click();
  await expect(page.locator('#status')).toHaveText('Completed');
  await page.locator('#command-language').selectOption('pt');
  await code(page, 'pf 10 pd 90');
  await page.locator('#run').click();
  await expect(page.locator('#status')).toHaveText('Completed');
  await expect(page.locator('#coordinates')).toContainText('90°');
});
test('responsive layout keeps all controls usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#run')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await instant(page);
  await page.locator('#run').click();
  await expect(page.locator('#status')).toHaveText('Concluído');
  await page.locator('#canvas').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});
test('instant loops and heavy console output remain cancellable', async ({ page }) => {
  await run(page, 'repeat 100000 [print [a long line of output] right 1]');
  await expect(page.locator('#console')).toContainText('a long line');
  await page.locator('#pause').click();
  await expect(page.locator('#status')).toHaveText('Pausado');
  await page.locator('#stop').click();
  await expect(page.locator('#status')).toHaveText('Interrompido');
  await run(page, 'print "ready');
  await expect(page.locator('#console')).toHaveText('ready\n');
});
test('examples and file open both protect unsaved work', async ({ page }) => {
  await code(page, 'print "keep');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.locator('#examples').selectOption('1');
  await expect(page.locator('.cm-content')).toHaveText('print "keep');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.locator('#file').setInputFiles({
    name: 'new.logo',
    mimeType: 'text/plain',
    buffer: Buffer.from('print "replace'),
  });
  await expect(page.locator('.cm-content')).toHaveText('print "keep');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#file').setInputFiles({
    name: 'new.logo',
    mimeType: 'text/plain',
    buffer: Buffer.from('print "replace'),
  });
  await expect(page.locator('.cm-content')).toHaveText('print "replace');
});
test('diagnostics include source location, runtime suggestions, and recovery', async ({ page }) => {
  await run(page, 'forward 1\nforward "bad');
  await expect(page.locator('#diagnostic')).toContainText('Linha 2, coluna 1');
  await expect(page.locator('#diagnostic')).toContainText('Use 10');
  await expect(page.locator('#coordinates')).toContainText('y 1.0');
  await run(page, 'setxy 0 1e308\nforward 1e308');
  await expect(page.locator('#diagnostic')).toContainText('Linha 2, coluna 1');
  await expect(page.locator('#status')).toHaveText('Erro');
  await run(page, 'print "ok');
  await expect(page.locator('#status')).toHaveText('Concluído');
});

test('examples are grouped by complexity and follow interface and command languages independently', async ({
  page,
}) => {
  const groups = page.locator('#examples optgroup');
  await expect(groups).toHaveCount(3);
  for (const label of ['Iniciante', 'Intermediário', 'Avançado']) {
    await expect(page.locator(`#examples optgroup[label="${label}"] option`)).toHaveCount(5);
  }
  await page.locator('#mode').selectOption('strict');
  await page.locator('#examples').selectOption({ label: 'Árvore recursiva' });
  await expect(page.locator('.cm-content')).toContainText('aprenda arvore');
  await instant(page);
  await page.locator('#run').click();
  await expect(page.locator('#status')).toHaveText('Concluído');
  await page.locator('#ui-language').selectOption('en');
  await expect(page.locator('#examples optgroup[label="Advanced"] option')).toHaveCount(5);
  await expect(page.locator('.cm-content')).toContainText('aprenda arvore');
  await page.locator('#command-language').selectOption('en');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#examples').selectOption({ label: 'Koch snowflake' });
  await expect(page.locator('.cm-content')).toContainText('to koch');
  await page.locator('#run').click();
  await expect(page.locator('#status')).toHaveText('Completed');
});
