import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { standardArticle } from '../../fixtures/json/article-standard';
import { articles } from '../../fixtures/pages';
import { cmpAcceptAll, cmpReconsent, cmpRejectAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';
import { fakeLogin, fakeLogOut, getHost, waitForSlot } from '../../lib/util';

const { path } = articles[0];

const adSlotsAreFulfilled = async (page: Page) =>
	await waitForSlot(page, 'top-above-nav');

/**
 * Warning!
 * isVisible() is an immediate check and does not wait.
 * While slots will be present when opt-out loads we remove
 * a slot if it is not fulfilled. So using this visibility check
 * relies on the slot being present before removal occurs.
 */
const adSlotsArePresent = async (page: Page) =>
	await page.locator('#dfp-ad--top-above-nav').isVisible();

/**
 * This function is intended to check when SSR does not render slots
 * i.e for subscribers
 */
const adSlotsAreNotPresent = async (page: Page) =>
	expect(
		await page.locator('#dfp-ad--top-above-nav').isVisible(),
	).toBeFalsy();

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

		await adSlotsArePresent(page);
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

		await adSlotsArePresent(page);
	});

	test(`Accept all, login as subscriber, ads slots are not present`, async ({
		page,
		context,
	}) => {
		await fakeLogin(page, context, true);

		await visitArticleNoOkta(page);

		await cmpAcceptAll(page);

		await visitArticleNoOkta(page);

		await adSlotsAreNotPresent(page);
	});

	test(`Reject all, accept all, ad slots are fulfilled`, async ({ page }) => {
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

		await adSlotsAreNotPresent(page);

		await fakeLogOut(page, context);

		await visitArticleNoOkta(page);

		await adSlotsArePresent(page);
	});

	test(`Reject all, login as non-subscriber, ad slots are present, log out, ad slots are present`, async ({
		page,
		context,
	}) => {
		await fakeLogin(page, context, false);

		await visitArticleNoOkta(page);

		await cmpRejectAll(page);

		await visitArticleNoOkta(page);

		await adSlotsArePresent(page);

		await fakeLogOut(page, context);

		await visitArticleNoOkta(page);

		await adSlotsArePresent(page);
	});

	test(`Reject all, login as non-subscriber, ad slots are present, accept all, ad slots are fulfilled`, async ({
		page,
		context,
	}) => {
		await fakeLogin(page, context, false);

		await visitArticleNoOkta(page);

		await cmpRejectAll(page);

		await visitArticleNoOkta(page);

		await adSlotsArePresent(page);

		await cmpReconsent(page);

		await visitArticleNoOkta(page);

		await adSlotsAreFulfilled(page);
	});

	test(`Accept all, login as subscriber, ad slots are not present, subscription expires, ads slots are fulfilled`, async ({
		page,
		context,
	}) => {
		await fakeLogin(page, context, true);

		await visitArticleNoOkta(page);

		await cmpAcceptAll(page);

		await visitArticleNoOkta(page);

		await adSlotsAreNotPresent(page);

		// expire subscription
		await context.addCookies([
			{
				name: 'gu_user_features_expiry',
				value: String(new Date().getTime() - 10000),
				domain: 'localhost',
				path: '/',
			},
		]);

		await visitArticleNoOkta(page);

		await visitArticleNoOkta(page);

		await adSlotsAreFulfilled(page);
	});

	test(`Reject all, login as subscriber, ad slots are not present, subscription expires, ads slots are present`, async ({
		page,
		context,
	}) => {
		await fakeLogin(page, context, true);

		await visitArticleNoOkta(page);

		await cmpRejectAll(page);

		await visitArticleNoOkta(page);

		await adSlotsAreNotPresent(page);

		// expire subscription
		// await context.addCookies([
		// 	{
		// 		name: 'gu_user_features_expiry',
		// 		value: String(new Date().getTime() - 10000),
		// 		domain: 'localhost',
		// 		path: '/',
		// 	},
		// ]);

		await visitArticleNoOkta(page);

		await adSlotsArePresent(page);
	});

	test(`Reject all, login as subscriber, ad slots are not present on every page load`, async ({
		page,
		context,
	}) => {
		await fakeLogin(page, context, true);

		await visitArticleNoOkta(page);

		await cmpRejectAll(page);

		await visitArticleNoOkta(page);

		await adSlotsAreNotPresent(page);

		await visitArticleNoOkta(page);

		await adSlotsAreNotPresent(page);

		await visitArticleNoOkta(page);

		await adSlotsAreNotPresent(page);
	});
});
