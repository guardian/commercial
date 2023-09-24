import type { BrowserContext, Cookie, Page } from '@playwright/test';
import type { UserFeaturesResponse } from '../../src/types/membership';

// TODO playwright
// - check env vars are picked up
// - global setup for ophan blocking
// - helper functions for cmp accept and reject
// - split up utils into separate files

type Stage = 'code' | 'prod' | 'dev';

const hostnames = {
	code: 'https://code.dev-theguardian.com',
	prod: 'https://www.theguardian.com',
	dev: 'http://localhost:3030',
} as const;

const getPath = (
	stage: Stage,
	type: 'article' | 'liveblog' | 'front' = 'article',
	path: string,
	fixtureId?: string,
) => {
	if (stage === 'dev') {
		const dcrContentType =
			type === 'liveblog' || type === 'article' ? 'Article' : 'Front';
		if (fixtureId) {
			return `${dcrContentType}/http://localhost:3031/renderFixture/${fixtureId}/${path}`;
		}
		return `${dcrContentType}/https://www.theguardian.com${path}`;
	}
	return path;
};

const normalizeStage = (stage: string): Stage =>
	['code', 'prod', 'dev'].includes(stage) ? (stage as Stage) : 'dev';

/**
 * Pass different stage in via environment variable
 * e.g. `STAGE=code yarn playwright test`
 */
const getStage = (): Stage => {
	// TODO check playwright picks up the STAGE env var
	const stage = process.env.STAGE;
	return normalizeStage(stage?.toLowerCase() ?? 'dev');
};

const getHost = (stage?: Stage | undefined) => {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive runtime
	return hostnames[stage ?? getStage()] ?? hostnames.dev;
};

/**
 * Generate a full URL for a given relative path and the desired stage
 *
 * @param {'dev' | 'code' | 'prod'} stage
 * @param {string} path
 * @param {{ isDcr?: boolean }} options
 * @returns {string} The full path
 */
const getTestUrl = (
	stage: Stage,
	path: string,
	type: 'article' | 'liveblog' | 'front' = 'article',
	adtest = 'fixed-puppies-ci',
	fixtureId?: string,
) => {
	const url = new URL(getPath(stage, type, path, fixtureId), getHost(stage));

	if (type === 'liveblog') {
		url.searchParams.append('live', '1');
	}

	url.searchParams.append('adtest', adtest);

	// force an invalid epic so it is not shown
	url.searchParams.append('force-epic', '9999:CONTROL');

	return url.toString();
};

const setupFakeLogin = async (
	page: Page,
	context: BrowserContext,
	subscriber = true,
) => {
	const bodyOverride: UserFeaturesResponse = {
		userId: '107421393',
		digitalSubscriptionExpiryDate: '2999-01-01',
		showSupportMessaging: false,
		contentAccess: {
			member: false,
			paidMember: false,
			recurringContributor: false,
			digitalPack: true,
			paperSubscriber: false,
			guardianWeeklySubscriber: false,
		},
	};

	if (!subscriber) {
		bodyOverride.contentAccess.digitalPack = false;
		delete bodyOverride.digitalSubscriptionExpiryDate;
	}

	await context.addCookies([
		{
			name: 'GU_U',
			value: 'WyIzMjc5Nzk0IiwiIiwiSmFrZTkiLCIiLDE2NjA4MzM3NTEyMjcsMCwxMjEyNjgzMTQ3MDAwLHRydWVd.MC0CFQCIbpFtd0J5IqK946U1vagzLgCBkwIUUN3UOkNfNN8jwNE3scKfrcvoRSg',
			domain: 'localhost',
			path: '/',
		},
	]);

	await page.route(
		'https://members-data-api.theguardian.com/user-attributes/me**',
		(route) => {
			return route.fulfill({
				body: JSON.stringify(bodyOverride),
			});
		},
		{ times: 1 },
	);
};

const clearCookie = async (context: BrowserContext, cookieName: string) => {
	const cookies = await context.cookies();
	const filteredCookies = cookies.filter(
		(cookie: Cookie) => cookie.name !== cookieName,
	);
	await context.clearCookies();
	await context.addCookies(filteredCookies);
};

const fakeLogOut = async (page: Page, context: BrowserContext) =>
	await clearCookie(context, 'GU_U');

const waitForSlot = async (page: Page, slot: string) => {
	const slotId = `#dfp-ad--${slot}`;
	// Check that the ad slot is on the page
	await page.locator(slotId).isVisible();
	// creative isn't loaded unless slot is in view
	await page.locator(slotId).scrollIntoViewIfNeeded();
	// iframe locator
	const iframe = page.locator(`${slotId} iframe`);
	// wait for the iframe
	await iframe.waitFor({ state: 'visible', timeout: 120000 });
};

export { fakeLogOut, setupFakeLogin, getStage, getTestUrl, waitForSlot };
