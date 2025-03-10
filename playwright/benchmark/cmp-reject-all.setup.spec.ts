import { test } from '@playwright/test';
import { cmpRejectAll } from '../lib/cmp';
import { visitArticleNoOkta } from '../lib/load-page';
import { setupFakeLogin } from '../lib/util';

const viewport = { width: 1400, height: 800 };

const authFile = 'playwright/.auth/reject-all.json';

test('setup', async ({ page, context }) => {
	await page.setViewportSize(viewport);

	// After consent or pay, we need to be logged in and mock an ad-lite subscription to be able to reject all
	await setupFakeLogin(page, context, false, true);

	await visitArticleNoOkta(page);

	await cmpRejectAll(page);

	await visitArticleNoOkta(page);

	await page.context().storageState({ path: authFile });
});
