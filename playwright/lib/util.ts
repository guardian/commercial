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
) => {
	if (stage === 'dev') {
		if (type === 'liveblog' || type === 'article') {
			return `Article/https://www.theguardian.com${path}`;
		}
		return `Front/https://www.theguardian.com${path}`;
	}

	return path;
};

const normalizeStage = (stage: string): Stage =>
	['code', 'prod', 'dev'].includes(stage) ? (stage as Stage) : 'dev';

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
) => {
	const url = new URL('https://www.theguardian.com');

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive runtime
	url.href = hostnames[stage] ?? hostnames.dev;

	url.pathname = getPath(stage, type, path);

	if (type === 'liveblog') {
		url.searchParams.append('live', '1');
	}

	if (adtest) {
		url.searchParams.append('adtest', adtest);
		// force an invalid epic so it is not shown
		if (adtest === 'fixed-puppies-ci' || adtest === 'puppies-pageskin') {
			url.searchParams.append('force-epic', '9999:CONTROL');
		}
	}
	return url.toString();
};

/**
 * Pass different stage in via environment variable
 * e.g. `STAGE=code yarn playwright test`
 */
const getStage = (): Stage => {
	// TODO check playwright picks up the STAGE env var
	const stage = process.env.STAGE;
	return normalizeStage(stage?.toLowerCase() ?? 'dev');
};

const fakeLogin = async (
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
		},
	]);

	// return the promise and don't await so it can be awaited on by the test where necessary
	return page.route(
		'https://members-data-api.theguardian.com/user-attributes/me**',
		(route) => {
			void route.fulfill({
				body: JSON.stringify(bodyOverride),
			});
		},
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

const fakeLogOut = async (page: Page, context: BrowserContext) => {
	await clearCookie(context, 'GU_U');
	await page.reload();
};

/**
 * This function will mock the intersection observer API, and will call the callback immediately to trigger lazy-loading behaviour
 *
 * Optionally, you can pass in a selector to mock the intersection observer for specific elements, useful for ads because loading them all at once can be quite slow
 *
 * @param win window object
 * @param selector optional selector to target specific elements, if empty, will indiscriminately mock all observers
 */
// const mockIntersectionObserver = (win: Window, selector?: string) => {
// 	const Original = win.IntersectionObserver;
// 	win.IntersectionObserver = function (
// 		cb: IntersectionObserverCallback,
// 		options: IntersectionObserverInit | undefined,
// 	) {
// 		const instance: IntersectionObserver = {
// 			thresholds: Array.isArray(options?.threshold)
// 				? options?.threshold ?? [0]
// 				: [options?.threshold ?? 0],
// 			root: options?.root ?? null,
// 			rootMargin: options?.rootMargin ?? '0px',
// 			takeRecords: () => [],
// 			observe: (element: HTMLElement) => {
// 				if (!selector || element.matches(selector)) {
// 					const entry = [
// 						{
// 							isIntersecting: true,
// 							boundingClientRect: element.getBoundingClientRect(),
// 							intersectionRatio: 1,
// 							intersectionRect: element.getBoundingClientRect(),
// 							rootBounds:
// 								instance.root instanceof HTMLElement
// 									? instance.root.getBoundingClientRect()
// 									: null,
// 							target: element,
// 							time: Date.now(),
// 						},
// 					];
// 					cb(entry, instance);
// 				} else {
// 					const observer = new Original(cb, options);
// 					observer.observe(element);
// 				}
// 			},
// 			unobserve: () => {},
// 			disconnect: () => {},
// 		};
// 		return instance;
// 	} as unknown as IntersectionObserver;
// };

const waitForSlotIframe = async (page: Page, slotId: string) => {
	const iframe = page.locator(`#${slotId} iframe`);
	await iframe.waitFor({ state: 'visible', timeout: 1200000 });
};

export { fakeLogOut, fakeLogin, getStage, getTestUrl, waitForSlotIframe };
