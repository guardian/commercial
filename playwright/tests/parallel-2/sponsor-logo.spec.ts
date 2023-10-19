import { test } from '@playwright/test';
import { cmpAcceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';
import { getStage, getTestUrl, waitForSlot } from '../../lib/util';

test.describe('sponsorshipLogo', () => {
	test('sponsor logo ad is correctly filled in thrasher fixture', async ({
		page,
	}) => {
		// Construct a path that uses a fixture where a thrasher contains a sponsor logo
		const path = getTestUrl({
			stage: getStage(),
			path: 'uk',
			type: 'front',
			adtest: undefined,
			fixtureId: 'sponsorshipLogoInThrasher',
		});

		await loadPage(page, path);

		await cmpAcceptAll(page);

		await waitForSlot(page, 'sponsor-logo');
	});
});
