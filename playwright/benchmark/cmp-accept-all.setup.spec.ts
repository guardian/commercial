import { test } from '@playwright/test';
import { articles } from '../fixtures/pages';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';

const viewport = { width: 1400, height: 800 };

const authFile = 'playwright/.auth/accept-all.json';

test('setup', async ({ page }) => {
	const loadPath = articles[0].path;

	await page.setViewportSize(viewport);

	await loadPage(page, loadPath);

	await cmpAcceptAll(page);

	await page.context().storageState({ path: authFile });
});
