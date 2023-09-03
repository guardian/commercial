import { test } from '@playwright/test';
import { allPages, articles } from '../../fixtures/pages';
import { acceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';

const gamUrl = /https:\/\/securepubads.g.doubleclick.net\/gampad\/ads/;

test.describe('GAM targeting', () => {
	test('checks that a request is made', async ({ page }) => {
		const gamRequestPromise = page.waitForRequest(gamUrl);
		await loadPage(page, articles[0].path);
		await acceptAll(page);
		await gamRequestPromise;
	});

	test('checks the gdpr_consent param', async ({ page }) => {
		const gamRequestPromise = page.waitForRequest((request) => {
			const isURL = request.url().match(gamUrl);
			if (!isURL) return false;
			const url = new URL(request.url());
			const gdprConsent = url.searchParams.get('gdpr_consent');
			if (gdprConsent === null) return false;
			return gdprConsent.length > 0;
		});
		await loadPage(page, articles[0].path);
		await acceptAll(page);
		await gamRequestPromise;
	});

	test(`checks sensitive content is marked as sensitive`, async ({
		page,
	}) => {
		const gamRequestPromise = page.waitForRequest((request) => {
			const isURL = request.url().match(gamUrl);
			if (!isURL) return false;
			const url = new URL(request.url());
			const custParams = url.searchParams.get('cust_params') ?? '';
			if (custParams === null) return false;
			const decodedCustParams = decodeURIComponent(custParams);
			const sens = new URLSearchParams(decodedCustParams).get('sens');
			return sens === 't';
		});
		const sensitivePage = allPages.find(
			(page) => page?.name === 'sensitive-content',
		);
		if (!sensitivePage)
			throw new Error('No sensitive articles found to run test.');

		await loadPage(page, sensitivePage.path);
		await acceptAll(page);
		await gamRequestPromise;
	});

	// describe('Prebid targeting', () => {
	// 	const interceptGamRequest = () =>
	// 		cy.intercept(
	// 			{
	// 				url: gamUrl,
	// 			},
	// 			function (req) {
	// 				const url = new URL(req.url);

	// 				const targetingParams = decodeURIComponent(
	// 					url.searchParams.get('prev_scp') || '',
	// 				);
	// 				const targeting = new URLSearchParams(targetingParams);
	// 				if (targeting.get('hb_bidder') === 'criteo') {
	// 					Object.entries(wins.criteo.targeting).forEach(
	// 						([key, value]) => {
	// 							expect(targeting.get(key)).to.equal(value);
	// 						},
	// 					);
	// 				}
	// 			},
	// 		);

	// 	before(() => {
	// 		bidderURLs.forEach((url) => {
	// 			cy.intercept(url, (req) => {
	// 				if (req.url.includes(wins.criteo.url)) {
	// 					req.reply({ body: wins.criteo.response });
	// 				} else {
	// 					req.reply({
	// 						statusCode: 204,
	// 					});
	// 				}
	// 			});
	// 		});
	// 	});

	// 	// This test is flaky, so we're skipping it for now
	// 	it.skip(`prebid winner should display ad and send targeting to GAM`, () => {
	// 		const { path } = articles[0];

	// 		interceptGamRequest();

	// 		const url = new URL(path);
	// 		url.searchParams.set('adrefresh', 'false');
	// 		url.searchParams.delete('adtest');
	// 		cy.visit(url.toString());

	// 		cy.getIframeBody('google_ads_iframe_')
	// 			.find('[data-cy="test-creative"]')
	// 			.should('exist');
	// 	});
});
