import { test } from '@playwright/test';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { getStage, getTestUrl, waitForSlot } from '../lib/util';

test.describe('sponsorshipLogo', () => {
	test('sponsor logo ad is correctly filled in thrasher fixture', async ({
		page,
	}) => {

		const path = getTestUrl({
			stage: getStage(),
			path: 'uk',
			type: 'front',
			adtest: undefined,
		});

		await loadPage(page, path);

		await cmpAcceptAll(page);

		await waitForSlot(page, 'sponsor-logo');
	});

	test('sponsor logo ad is correctly populated when it fires a custom event', async ({
		page,
	}) => {
		const path = getTestUrl({
			stage: getStage(),
			path: 'uk',
			type: 'front',
			adtest: undefined,
		});

		await loadPage(page, path);

		await cmpAcceptAll(page);

		await waitForSlot(page, 'sponsor-logo');
	});
});
