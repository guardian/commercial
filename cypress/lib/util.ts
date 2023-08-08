import type { UserFeaturesResponse } from '../../src/types/membership';

type Stage = 'code' | 'prod' | 'dev';

const hostnames = {
	code: 'https://code.dev-theguardian.com',
	prod: 'https://www.theguardian.com',
	dev: 'http://localhost:3030',
};

const getPath = (
	stage: Stage,
	type: 'article' | 'liveblog' | 'front' = 'article',
	path: string,
) => {
	if (stage === 'dev') {
		if (type === 'liveblog' || type === 'article') {
			return `Article/https://www.theguardian.com${path}`;
		} else {
			return `Front/https://www.theguardian.com${path}`;
		}
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
export const getTestUrl = (
	stage: Stage,
	path: string,
	type: 'article' | 'liveblog' | 'front' = 'article',
	adtest = 'fixed-puppies-ci',
) => {
	let url = new URL('https://www.theguardian.com');

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
 * e.g. `yarn cypress run --env stage=code`
 */
export const getStage = (): Stage => {
	const stage = Cypress.env('stage');
	return normalizeStage(stage?.toLowerCase());
};

export const fakeLogin = (subscriber = true) => {
	const response: UserFeaturesResponse = {
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
		response.contentAccess.digitalPack = false;
		delete response.digitalSubscriptionExpiryDate;
	}

	cy.setCookie(
		'GU_U',
		'WyIzMjc5Nzk0IiwiIiwiSmFrZTkiLCIiLDE2NjA4MzM3NTEyMjcsMCwxMjEyNjgzMTQ3MDAwLHRydWVd.MC0CFQCIbpFtd0J5IqK946U1vagzLgCBkwIUUN3UOkNfNN8jwNE3scKfrcvoRSg',
		{ timeout: 30000 },
	);

	cy.wait(5000);

	cy.intercept(
		'https://members-data-api.theguardian.com/user-attributes/me',
		{ times: 1 },
		response,
	).as('userData');
};

export const fakeLogOut = () => {
	// we can't just click sign out because cypress does not like following links to other domains
	cy.clearCookie('GU_U');

	cy.reload();
};

/**
 * This function will mock the intersection observer API, and will call the callback immediately to trigger lazy-loading behaviour
 *
 * Optionally, you can pass in a selector to mock the intersection observer for specific elements, useful for ads because loading them all at once can be quite slow
 *
 * @param win window object
 * @param selector optional selector to target specific elements, if empty, will indiscriminately mock all observers
 */
export const mockIntersectionObserver = (win: Window, selector?: string) => {
	const Original = win.IntersectionObserver;
	// ts-expect-error
	win.IntersectionObserver = function (
		cb: IntersectionObserverCallback,
		options: IntersectionObserverInit | undefined,
	) {
		const instance: IntersectionObserver = {
			thresholds: Array.isArray(options?.threshold)
				? options?.threshold || [0]
				: [options?.threshold || 0],
			root: options?.root || null,
			rootMargin: options?.rootMargin || '0px',
			takeRecords: () => [],
			observe: (element: HTMLElement) => {
				if (!selector || element.matches(selector)) {
					const entry = [
						{
							isIntersecting: true,
							boundingClientRect: element.getBoundingClientRect(),
							intersectionRatio: 1,
							intersectionRect: element.getBoundingClientRect(),
							rootBounds:
								instance.root instanceof HTMLElement
									? instance.root.getBoundingClientRect()
									: null,
							target: element,
							time: Date.now(),
						},
					];
					cb(entry, instance);
				} else {
					const observer = new Original(cb, options);
					observer.observe(element);
				}
			},
			unobserve: () => {},
			disconnect: () => {},
		};
		return instance;
	};
};
