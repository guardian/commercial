import type { Page } from '@playwright/test';
import { test } from '@playwright/test';
import { standardArticle } from '../../fixtures/json/article-standard';
import { articles } from '../../fixtures/pages';
import { cmpAcceptAll, cmpReconsent, cmpRejectAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';
import { fakeLogin, getHost, waitForSlot } from '../../lib/util';

const { path } = articles[0];

const adsShouldShow = async (page: Page) => {
	await waitForSlot(page, 'top-above-nav');
};

const adsShouldNotShow = async (page: Page) => {
	// wait for consentless to remove slot
	// TODO check this is correct behaviour
	const slot = page.locator('#dfp-ad--top-above-nav');
	// wait for locator to be removed from the dom i.e. detached
	await slot.waitFor({ state: 'detached', timeout: 120000 });
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

test.describe('tcfv2 consent', () => {
	test(`Reject all, ads should NOT show`, async ({ page }) => {
		await visitArticleNoOkta(page);
		await cmpRejectAll(page);
		await adsShouldNotShow(page);
	});

	test(`Reject all, login NOT as subscriber, ads should NOT show`, async ({
		page,
		context,
	}) => {
		await fakeLogin(page, context, false);
		await visitArticleNoOkta(page);

		await cmpRejectAll(page);

		await visitArticleNoOkta(page);
		await adsShouldNotShow(page);
	});

	test(`Accept all, login as subscriber, ads should NOT show`, async ({
		page,
		context,
	}) => {
		await fakeLogin(page, context, true);
		await visitArticleNoOkta(page);

		await cmpAcceptAll(page);

		await visitArticleNoOkta(page);
		// TODO check containers are not rendered i.e. no SSR slots
		await adsShouldNotShow(page);
	});

	test(`Reject all, reconsent, ads should NOT show`, async ({ page }) => {
		await loadPage(page, path);

		await cmpRejectAll(page);

		await loadPage(page, path);

		await cmpReconsent(page);

		await loadPage(page, path);

		await adsShouldShow(page);
	});

	// //skipped because of the opt-out $sf.host.Config error
	// it.skip(`Test ${path} reject all, login as subscriber, log out should show ads`, () => {
	// 	const { path } = articles[4];

	// 	fakeLogin(true);

	// 	cy.visit(path);

	// 	cy.rejectAllConsent();

	// 	cy.reload();

	// 	fakeLogOut();

	// 	cy.reload();

	// 	adsShouldShow();
	// });

	// //skipped because of the opt-out $sf.host.Config error
	// it.skip(`Test ${path} reject all, login as non-subscriber should show ads, log out should show ads`, () => {
	// 	const { path } = articles[4];

	// 	fakeLogin(false);

	// 	cy.visit(path);

	// 	cy.rejectAllConsent();

	// 	adsShouldShow();

	// 	fakeLogOut();

	// 	adsShouldShow();
	// });

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
