import { test } from '@playwright/test';
import { frontWithThrasherSponsor } from '../fixtures/front-with-thrasher-sponsor';
import { frontWithThrasherSponsorFiresAdvert } from '../fixtures/front-with-thrasher-sponsor-fires-advert';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { waitForSlot } from '../lib/util';

/**
 * This test is unique in that it creates a test front collection
 * to test the sponsor logo ad placement within a thrasher
 */
const fetchFrontJson = () => {
	return fetch('https://www.theguardian.com/uk/sport.json?dcr').then(
		(response) => response.json(),
	);
};

test.describe('sponsorshipLogo', () => {
	test('sponsor logo ad is correctly filled in thrasher fixture', async ({
		page,
	}) => {
		const frontendJson = await fetchFrontJson();
		frontendJson.pressedPage.collections =
			frontWithThrasherSponsor.pressedPage.collections;
		await loadPage({
			page,
			path: '/Front/https://www.theguardian.com/uk/sport',
			overrides: {
				feFixture: frontendJson,
			},
		});

		await cmpAcceptAll(page);
		await waitForSlot(page, 'sponsor-logo');
	});

	test('sponsor logo ad is correctly populated when it fires a custom event', async ({
		page,
	}) => {
		const frontendJson = await fetchFrontJson();
		frontendJson.pressedPage.collections =
			frontWithThrasherSponsorFiresAdvert.pressedPage.collections;
		await loadPage({
			page,
			path: '/Front/https://www.theguardian.com/uk/sport',
			overrides: {
				feFixture: frontendJson,
			},
		});

		await cmpAcceptAll(page);
		await waitForSlot(page, 'sponsor-logo');
	});
});
