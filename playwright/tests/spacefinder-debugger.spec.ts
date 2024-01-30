import { clickAcceptAllCookies as cmpAcceptAll } from '@guardian/consent-management-platform';
import { test } from '@playwright/test';
import { articles } from '../fixtures/pages';
import type { GuPage } from '../fixtures/pages/Page';
import { loadPage } from '../lib/load-page';

const { path } = articles[0] as unknown as GuPage;
const pathWithDebug = path + '?sfdebug';

test.describe('Spacefinder debugger', () => {
	test(`Check that Spacefinder debug control panel loads when '?sfdebug' is added to the URL`, async ({
		page,
	}) => {
		await loadPage(page, path);

		await cmpAcceptAll(page);

		await loadPage(page, pathWithDebug);

		const debuggerPanelLocator = page.locator('sfdebug-panel');

		await debuggerPanelLocator.isVisible();
	});
});
