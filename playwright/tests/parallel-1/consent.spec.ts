import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { standardArticle } from '../../fixtures/json/article-standard';
import { articles } from '../../fixtures/pages';
import { cmpAcceptAll, cmpReconsent, cmpRejectAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';
import { fakeLogin, fakeLogOut, getHost, waitForSlot } from '../../lib/util';

const { path } = articles[0];

const adSlotsAreFulfilled = async (page: Page) => {
	await waitForSlot(page, 'top-above-nav');
};

const adsSlotsArePresent = async (page: Page) => {
	// Warning!
	// isVisible() is an immediate check and does not wait.
	// While slots will be present when opt-out loads we will remove
	// a slot if it is not fulfilled. So using this visibility check
	// relies on the slot being present before removal occurs.
	await page.locator('#dfp-ad--top-above-nav').isVisible();
};

const adsSlotsAreNotPresent = async (page: Page) => {
	// This is intended for when SSR does not render slots i.e for subscribers
	await expect(page.locator('#dfp-ad--top-above-nav')).not.toBeVisible();
};

const visitArticleNoOkta = async (page: Page) => {
	const url = `${getHost()}/Article`;
	await page.route(url, async (route) => {
		const postData = {
			...standardArticle,
			config: {
				...standardArticle.config,
				switches: {
					...standardArticle.config.switches,
					/**
					 * We want to continue using cookies for signed in features
					 * until we figure out how to use Okta in Cypress.
					 * See https://github.com/guardian/dotcom-rendering/issues/8758
					 */
					okta: false,
					idCookieRefresh: false,
				},
			},
		};
		await route.continue({
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			postData,
		});
	});
	await loadPage(page, url);
};

const waitForOptOut = (page: Page) =>
	page.waitForRequest(/cdn.optoutadvertising.com/);

test.describe('tcfv2 consent', () => {
	test(`Reject all, load opt out, ads slots are present`, async ({
		page,
	}) => {
		await loadPage(page, path);

		const optOutPromise = waitForOptOut(page);
		await cmpRejectAll(page);
		await optOutPromise;

		await adsSlotsArePresent(page);
	});

	test(`Reject all, login as non-subscriber, load opt out, ads slots are present`, async ({
		page,
		context,
	}) => {
		await fakeLogin(page, context, false);

		await visitArticleNoOkta(page);

		const optOutPromise = waitForOptOut(page);
		await cmpRejectAll(page);
		await optOutPromise;

		await visitArticleNoOkta(page);

		await adsSlotsArePresent(page);
	});

	test(`Accept all, login as subscriber, ads slots are not present`, async ({
		page,
		context,
	}) => {
		await fakeLogin(page, context, true);

		await visitArticleNoOkta(page);

		await cmpAcceptAll(page);

		await visitArticleNoOkta(page);

		await adsSlotsAreNotPresent(page);
	});

	test(`Reject all, reconsent, ad slots are fulfilled`, async ({ page }) => {
		await loadPage(page, path);

		await cmpRejectAll(page);

		await loadPage(page, path);

		await cmpReconsent(page);

		await loadPage(page, path);

		await adSlotsAreFulfilled(page);
	});

	test(`Reject all, login as subscriber, ad slots are not present, log out, load opt out, ad slots are present`, async ({
		page,
		context,
	}) => {
		await fakeLogin(page, context, true);

		await visitArticleNoOkta(page);

		await cmpRejectAll(page);

		await visitArticleNoOkta(page);

		await adsSlotsAreNotPresent(page);

		await fakeLogOut(page, context);

		await visitArticleNoOkta(page);

		await adsSlotsArePresent(page);
	});

	test(`Reject all, login as non-subscriber, ad slots are present, log out, ad slots are present`, async ({
		page,
		context,
	}) => {
		await fakeLogin(page, context, false);

		await visitArticleNoOkta(page);

		await cmpRejectAll(page);

		await visitArticleNoOkta(page);

		await adsSlotsArePresent(page);

		await fakeLogOut(page, context);

		await visitArticleNoOkta(page);

		await adsSlotsArePresent(page);
	});

	// //skipped because of the opt-out $sf.host.Config error
	// it.skip(`Test ${path} reject all, login as non-subscriber, reconsent should show ads`, () => {
	// 	cy.visit(path);

	// 	cy.rejectAllConsent();

	// 	fakeLogin(false);

	// 	// prevent support banner so we can click privacy settings button
	// 	localStorage.setItem(
	// 		'gu.prefs.engagementBannerLastClosedAt',
	// 		`{"value":"${new Date().toISOString()}"}`,
	// 	);

	// 	cy.reload();

	// 	adsShouldShow();

	// 	reconsent();

	// 	cy.reload();

	// 	adsShouldShow();
	// });

	// //skipping because this test is very flaky and works about 50% of the time
	// it.skip(`Test ${path} accept all, login as subscriber, subscription expires, should show ads`, () => {
	// 	fakeLogin(true);

	// 	cy.visit(path);

	// 	cy.allowAllConsent();

	// 	cy.reload();

	// 	cy.setCookie(
	// 		'gu_user_features_expiry',
	// 		String(new Date().getTime() - 10000),
	// 	);

	// 	// to intercept response
	// 	fakeLogin(false);

	// 	cy.reload();

	// 	cy.wait('@userData', { timeout: 30000 });

	// 	cy.wait(5000);

	// 	cy.reload();

	// 	cy.wait(5000);

	// 	adsShouldShow();
	// });

	// //skipped because of the opt-out $sf.host.Config error
	// it.skip(`Test ${path} reject all, login as subscriber, subscription expires, should show ads`, () => {
	// 	const { path } = articles[4];

	// 	fakeLogin(true);

	// 	cy.visit(path);

	// 	cy.rejectAllConsent();

	// 	cy.setCookie(
	// 		'gu_user_features_expiry',
	// 		String(new Date().getTime() - 1000),
	// 	);

	// 	// to intercept response
	// 	fakeLogin(false);

	// 	cy.reload();

	// 	// reload twice so server is not sent ad free cookie
	// 	cy.reload();

	// 	adsShouldShow();
	// });
});
