import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { articles } from '../fixtures/pages';
import type { GuPage } from '../fixtures/pages/Page';
import {
	cmpAcceptAll,
	cmpReconsent,
	cmpRejectAll,
	dropCookiesForNonAdvertisingBanner,
} from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import {
	fakeLogOut,
	getStage,
	getTestUrl,
	setupFakeLogin,
	waitForSlot,
} from '../lib/util';

const { path } = articles[0] as unknown as GuPage;

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
	const fixture = {
		config: {
			switches: {
				okta: false,
				idCookieRefresh: false,
			},
		},
	};
	const url = getTestUrl({
		stage: getStage(),
		path: 'politics/2022/feb/10/keir-starmer-says-stop-the-war-coalition-gives-help-to-authoritarians-like-putin',
		type: 'article',
		adtest: undefined,
		fixture,
	});
	await loadPage(page, url);
};

const waitForOptOut = (page: Page) =>
	page.waitForRequest(/cdn\.optoutadvertising\.com/);

test.describe('tcfv2 consent', () => {
	test(`Accept all for Consent or Pay banner, ad slots are fulfilled`, async ({
		page,
	}) => {
		await loadPage(page, path);

		await cmpAcceptAll(page);

		await loadPage(page, path);

		await adSlotsAreFulfilled(page);
	});

	test(`Reject all on Non-Advertising banner, load Opt Out, ads slots are present`, async ({
		page,
	}) => {
		await dropCookiesForNonAdvertisingBanner(page);
		await loadPage(page, path);
		const optOutPromise = waitForOptOut(page);
		await cmpRejectAll(page);
		await optOutPromise;

		await adSlotsArePresent(page);
	});

	test(`Reject all on Non-Advertising banner, login as subscriber, load Opt Out, ads slots are not present`, async ({
		page,
		context,
	}) => {
		await setupFakeLogin(page, context, true);
		await dropCookiesForNonAdvertisingBanner(page);

		await visitArticleNoOkta(page);

		const optOutPromise = waitForOptOut(page);
		await cmpRejectAll(page);
		await optOutPromise;

		await visitArticleNoOkta(page);

		await adSlotsAreNotPresent(page);
	});

	// Can't reject all as non subscriber as they are redirected to support page
	test.skip(`Reject all, login as non-subscriber, load Opt Out, ads slots are present`, async ({
		page,
		context,
	}) => {
		await setupFakeLogin(page, context, false);

		await visitArticleNoOkta(page);

		const optOutPromise = waitForOptOut(page);
		await cmpRejectAll(page);
		await optOutPromise;

		await visitArticleNoOkta(page);

		await adSlotsArePresent(page);
	});

	test(`Reject all on Non-Advertising banner, accept all, ad slots are fulfilled`, async ({
		page,
	}) => {
		await dropCookiesForNonAdvertisingBanner(page);

		await loadPage(page, path);

		await cmpRejectAll(page);

		await loadPage(page, path);

		await cmpReconsent(page);

		await loadPage(page, path);

		await adSlotsAreFulfilled(page);
	});

	test(`Accept all on Non Advertising banner, login as subscriber, ads slots are not present`, async ({
		page,
		context,
	}) => {
		await setupFakeLogin(page, context, true);
		await dropCookiesForNonAdvertisingBanner(page);

		await visitArticleNoOkta(page);

		await cmpAcceptAll(page);

		// TODO investigate
		// user-features does not run until consent state has been given.
		// So when we accept all, ads will load despite being ad free as
		// the ad free cookie has not yet been set.

		await visitArticleNoOkta(page);

		await adSlotsAreNotPresent(page);
	});

	test(`Reject all on Non advertising banner, login as subscriber, ad slots are not present, log out, load Opt Out, ad slots are present`, async ({
		page,
		context,
	}) => {
		await setupFakeLogin(page, context, true);

		await dropCookiesForNonAdvertisingBanner(page);

		await visitArticleNoOkta(page);

		await cmpRejectAll(page);

		await visitArticleNoOkta(page);

		await adSlotsAreNotPresent(page);

		await fakeLogOut(context);

		await visitArticleNoOkta(page);

		await adSlotsArePresent(page);
	});

	test(`Reject all on Non advertising banner, login as subscriber, ad slots are not present on multiple page loads`, async ({
		page,
		context,
	}) => {
		await setupFakeLogin(page, context, true);

		await dropCookiesForNonAdvertisingBanner(page);

		await visitArticleNoOkta(page);

		await cmpRejectAll(page);

		await visitArticleNoOkta(page);

		await adSlotsAreNotPresent(page);

		await visitArticleNoOkta(page);

		await adSlotsAreNotPresent(page);
	});

	// Can't reject all as non subscriber as they are redirected to support page
	test.skip(`Reject all, login as non-subscriber, ad slots are present, log out, ad slots are present`, async ({
		page,
		context,
	}) => {
		await setupFakeLogin(page, context, false);

		await visitArticleNoOkta(page);

		await cmpRejectAll(page);

		await visitArticleNoOkta(page);

		await adSlotsArePresent(page);

		await fakeLogOut(context);

		await visitArticleNoOkta(page);

		await adSlotsArePresent(page);
	});

	// Can't reject all as non subscriber as they are redirected to support page
	test.skip(`Reject all, login as non-subscriber, ad slots are present, accept all, ad slots are fulfilled`, async ({
		page,
		context,
	}) => {
		await setupFakeLogin(page, context, false);

		await visitArticleNoOkta(page);

		await cmpRejectAll(page);

		await visitArticleNoOkta(page);

		await adSlotsArePresent(page);

		await cmpReconsent(page);

		await visitArticleNoOkta(page);

		await adSlotsAreFulfilled(page);
	});

	test(`Reject all on Non advertising banner, ad slots are present, accept all, page refreshes, ad slots are fulfilled`, async ({
		page,
	}) => {
		await dropCookiesForNonAdvertisingBanner(page);

		await visitArticleNoOkta(page);

		await cmpRejectAll(page);

		await visitArticleNoOkta(page);

		await adSlotsArePresent(page);

		await cmpReconsent(page);

		await page.waitForLoadState('domcontentloaded');

		await adSlotsAreFulfilled(page);
	});
});
