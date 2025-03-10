import { test } from '@playwright/test';
import { articles } from '../fixtures/pages';
import { cmpRejectAll } from '../lib/cmp';
import { visitArticleNoOkta } from '../lib/load-page';
import { setupFakeLogin } from '../lib/util';

const viewport = { width: 1400, height: 800 };

const authFile = 'playwright/.auth/reject-all.json';

test('setup', async ({ page, context }) => {
	const loadPath = articles[0].path;

	await page.setViewportSize(viewport);

	// After consent or pay, we need to be logged in and mock an ad-lite subscription to be able to reject all
	await setupFakeLogin(page, context, false, true);

	await visitArticleNoOkta(page, loadPath);

	await cmpRejectAll(page);

	await visitArticleNoOkta(page);

	await page.context().storageState({ path: authFile });
});
