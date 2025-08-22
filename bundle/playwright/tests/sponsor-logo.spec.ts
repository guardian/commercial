import { test } from '@playwright/test';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { waitForSlot } from '../lib/util';

test.describe('sponsorshipLogo', () => {
	test('sponsor logo ad is correctly filled in thrasher fixture', async ({
		page,
	}) => {
		await loadPage({
			page,
			path: '/Front/https://www.theguardian.com/uk',
			queryParams: { adtest: undefined },
		});

		await cmpAcceptAll(page);

		await waitForSlot(page, 'sponsor-logo');
	});

	test('sponsor logo ad is correctly populated when it fires a custom event', async ({
		page,
	}) => {
		await loadPage({
			page,
			path: '/Front/https://www.theguardian.com/uk',
			queryParams: { adtest: undefined },
		});

		await cmpAcceptAll(page);

		await waitForSlot(page, 'sponsor-logo');
	});
});
