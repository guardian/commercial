import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { articles } from '../fixtures/pages';
import type { GuPage } from '../fixtures/pages/Page';
import { cmpAcceptAll, cmpReconsent, cmpRejectAll } from '../lib/cmp';
import { loadPage, visitArticleNoOkta } from '../lib/load-page';
import { fakeLogOut, setupFakeLogin, waitForSlot } from '../lib/util';

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

const waitForOptOut = (page: Page) =>
	page.waitForRequest(/cdn\.optoutadvertising\.com/);

test.describe('tcfv2 consent', () => {
	test(`Accept all, ad slots are fulfilled`, async ({ page }) => {
		await loadPage(page, path);

		await cmpAcceptAll(page);

		await loadPage(page, path);

		await adSlotsAreFulfilled(page);
	});

	test(`Reject all, load Opt Out, ad slots are present`, async ({ page }) => {
		// if we pretend to be in Ireland, we can reject all and see opt out ads
		// without needing to fake logging into an ad-lite account
		await loadPage(page, path, 'IE');

		const optOutPromise = waitForOptOut(page);

		await cmpRejectAll(page);

		await optOutPromise;

		await adSlotsArePresent(page);
	});

	test(`Login as subscriber, reject all, load Opt Out, ad slots are not present on multiple page loads`, async ({
		page,
		context,
	}) => {
		await setupFakeLogin(page, context, true);

		await visitArticleNoOkta(page, path, 'IE');

		const optOutPromise = waitForOptOut(page);

		await cmpRejectAll(page);

		await optOutPromise;

		await visitArticleNoOkta(page, path, 'IE');

		await adSlotsAreNotPresent(page);

		await visitArticleNoOkta(page, path, 'IE');

		await adSlotsAreNotPresent(page);

		await visitArticleNoOkta(page, path, 'IE');

		await adSlotsAreNotPresent(page);
	});

	test(`Reject all, ad slots are fulfilled, then accept all, ad slots are fulfilled`, async ({
		page,
	}) => {
		// if we pretend to be in Ireland, we can reject all and see opt out ads
		// without needing to fake logging into an ad-lite account
		await loadPage(page, path, 'IE');

		const optOutPromise = waitForOptOut(page);

		await cmpRejectAll(page);

		await optOutPromise;

		await adSlotsArePresent(page);

		await cmpReconsent(page);

		await adSlotsAreFulfilled(page);
	});

	test(`Login as subscriber, accept all, ad slots are not present`, async ({
		page,
		context,
	}) => {
		await setupFakeLogin(page, context, true);

		await visitArticleNoOkta(page);

		await cmpAcceptAll(page);

		// TODO investigate
		// user-features does not run until consent state has been given.
		// So when we accept all, ads will load despite being ad free as
		// the ad free cookie has not yet been set.

		await visitArticleNoOkta(page);

		await adSlotsAreNotPresent(page);
	});

	test(`Login as subscriber, reject all, ad slots are not present. Log out, load Opt Out, ad slots are present`, async ({
		page,
		context,
	}) => {
		await setupFakeLogin(page, context, true);

		await visitArticleNoOkta(page);

		await cmpRejectAll(page);

		await visitArticleNoOkta(page);

		await adSlotsAreNotPresent(page);

		await fakeLogOut(context);

		await visitArticleNoOkta(page);

		await adSlotsArePresent(page);
	});

	test(`Reject all, ad slots are present, accept all, page refreshes, ad slots are fulfilled`, async ({
		page,
	}) => {
		// if we pretend to be in Ireland, we can reject all and see opt out ads
		// without needing to fake logging into an ad-lite account
		await loadPage(page, path, 'IE');

		await cmpRejectAll(page);

		await loadPage(page, path, 'IE');

		await adSlotsArePresent(page);

		await cmpReconsent(page);

		await page.waitForLoadState('domcontentloaded');

		await adSlotsAreFulfilled(page);
	});
});
