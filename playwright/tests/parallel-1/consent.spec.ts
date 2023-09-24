import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { articles } from '../../fixtures/pages';
import { cmpAcceptAll, cmpReconsent, cmpRejectAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';
import {
	fakeLogin,
	fakeLogOut,
	getStage,
	getTestUrl,
	waitForSlot,
} from '../../lib/util';

const { path } = articles[0];

const adSlotsAreFulfilled = async (page: Page) =>
	await waitForSlot(page, 'top-above-nav');

/**
 * Warning!
 * isVisible() is an immediate check and does not wait.
 * While slots will be present when opt-out loads we remove
 * a slot if it is not fulfilled. Using this visibility check
 * ensures we check the slot is present before removal occurs.
 */
const adSlotsArePresent = async (page: Page) =>
	await page.locator('#dfp-ad--top-above-nav').isVisible();

/**
 * This function is intended to check if slots are _not_ present
 * immediately i.e. when SSR does not render slots for adFree users.
 */
const adSlotsAreNotPresent = async (page: Page) =>
	expect(await adSlotsArePresent(page)).toBeFalsy();

const visitArticleNoOkta = async (page: Page) => {
	const url = getTestUrl(
		getStage(),
		'politics/2022/feb/10/keir-starmer-says-stop-the-war-coalition-gives-help-to-authoritarians-like-putin',
		'article',
		undefined, // use the default ad test
		'overwriteOktaSwitchFalse',
	);
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

		// TODO investigate
		// user-features does not run until consent state has been given
		// so when we accept all ads will load despite being ad free as
		// the ad free cookie has not yet been set.

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
				value: String(new Date().getTime() / 1000 - 1000),
				domain: 'localhost',
				path: '/',
			},
		]);

		await visitArticleNoOkta(page);

		await visitArticleNoOkta(page);

		await adSlotsAreFulfilled(page);
	});

	test.skip(`Reject all, login as subscriber, ad slots are not present, subscription expires, ads slots are present`, async ({
		page,
		context,
	}) => {
		await fakeLogin(page, context, true);

		await visitArticleNoOkta(page);

		await cmpRejectAll(page);

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

		await adSlotsArePresent(page);
	});

	test.skip(`Reject all, login as subscriber, ad slots are not present on every page load`, async ({
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
