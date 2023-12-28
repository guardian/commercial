import type { BrowserContext, Cookie, Page } from '@playwright/test';
import type { UserFeaturesResponse } from '../../src/types/membership';

type Stage = 'code' | 'prod' | 'dev';

type ContentType = 'article' | 'liveblog' | 'front' | 'tagFront';

const normalizeStage = (stage: string): Stage =>
	['code', 'prod', 'dev'].includes(stage) ? (stage as Stage) : 'dev';

/**
 * Set the stage via environment variable STAGE
 * e.g. `STAGE=code yarn playwright test`
 */
const getStage = (): Stage => {
	// TODO check playwright picks up the STAGE env var
	const stage = process.env.STAGE;
	return normalizeStage(stage?.toLowerCase() ?? 'dev');
};

const hostnames = {
	code: 'https://code.dev-theguardian.com',
	prod: 'https://www.theguardian.com',
	dev: 'http://localhost:3030',
} as const;

const getHost = (stage?: Stage | undefined) => {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive runtime
	return hostnames[stage ?? getStage()] ?? hostnames.dev;
};

const getDcrContentType = (
	type: ContentType,
): 'Article' | 'Front' | 'TagFront' => {
	switch (type) {
		case 'front':
			return 'Front';

		case 'tagFront':
			return 'TagFront';

		default:
			return 'Article';
	}
};

/**
 * Generate the path for the request to DCR
 */
const getPath = (
	stage: Stage,
	type: ContentType = 'article',
	path: string,
	fixtureId: string | undefined,
	fixture: Record<string, unknown> | undefined,
) => {
	if (stage === 'dev') {
		const dcrContentType = getDcrContentType(type);

		if (fixtureId) {
			return `${dcrContentType}/http://localhost:3031/renderFixtureWithId/${fixtureId}/${path}`;
		}

		if (fixture) {
			const fixtureJson = JSON.stringify(fixture);
			const base64Fixture = Buffer.from(fixtureJson).toString('base64');
			return `${dcrContentType}/http://localhost:3031/renderFixture/${path}?fixture=${base64Fixture}`;
		}

		return `${dcrContentType}/https://www.theguardian.com${path}`;
	}
	return path;
};

/**
 * Generate a full URL i.e domain and path
 */
const getTestUrl = ({
	stage,
	path,
	type = 'article',
	adtest = 'fixed-puppies-ci',
	fixtureId,
	fixture,
}: {
	stage: Stage;
	path: string;
	type?: ContentType;
	adtest?: string;
	fixtureId?: string;
	fixture?: Record<string, unknown>;
}) => {
	const url = new URL(
		getPath(stage, type, path, fixtureId, fixture),
		getHost(stage),
	);

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

// Playwright does not currently have a useful method for removing a cookie, so this workaround is needed.
const clearCookie = async (context: BrowserContext, cookieName: string) => {
	const cookies = await context.cookies();
	const filteredCookies = cookies.filter(
		(cookie: Cookie) => cookie.name !== cookieName,
	);
	await context.clearCookies();
	await context.addCookies(filteredCookies);
};

const fakeLogOut = async (context: BrowserContext) =>
	await clearCookie(context, 'GU_U');

const waitForSlot = async (page: Page, slot: string, waitForIframe = true) => {
	const slotId = `#dfp-ad--${slot}`;
	// create a locator for the slot
	const slotLocator = page.locator(slotId);
	// check that the ad slot is present on the page
	await slotLocator.isVisible();
	// scroll to it
	await slotLocator.scrollIntoViewIfNeeded();

	if (waitForIframe) {
		// iframe locator
		const iframe = page.locator(`${slotId} iframe`);
		// wait for the iframe
		await iframe.waitFor({ state: 'visible', timeout: 120000 });
	}
};

const waitForIsland = async (page: Page, island: string) => {
	const islandSelector = `gu-island[name="${island}"]`;
	// create a locator for the island
	const islandLocator = page.locator(islandSelector);
	// check that the island is present on the page
	await islandLocator.isVisible();
	// scroll to it
	await islandLocator.scrollIntoViewIfNeeded();
	// wait for it to be hydrated
	const hyrdatedIslandSelector = `gu-island[name="${island}"][data-island-status="hydrated"]`;
	const hyrdatedIslandLocator = page.locator(hyrdatedIslandSelector);
	await hyrdatedIslandLocator.waitFor({ state: 'visible', timeout: 120000 });
};

const countLiveblogInlineSlots = async (page: Page, isMobile: boolean) => {
	const mobileSuffix = isMobile ? '--mobile' : '';
	const locator = `#liveblog-body .ad-slot--liveblog-inline${mobileSuffix}`;

	return await page.locator(locator).count();
};

const getSlotName = (url: string) => {
	const adRequest = new URL(url);
	const adRequestParams = adRequest.searchParams;

	const prevScp = new URLSearchParams(adRequestParams.get('prev_scp') ?? '');

	return prevScp.get('slot') ?? 'unknown';
};

// Warn if any slots are unfilled
const logUnfilledSlots = (page: Page) => {
	page.on('response', (response) => {
		const url = response.url();

		const slotName = getSlotName(url);

		if (url.includes('securepubads.g.doubleclick.net/gampad/ads')) {
			const lineItemId = response.headers()['google-lineitem-id'] ?? '';
			const creativeId = response.headers()['google-creative-id'] ?? '';

			console.info(`Slot: ${slotName}`);
			console.info(`Line item: ${lineItemId}`);
			console.info(`Creative: ${creativeId}`);

			if (
				!lineItemId ||
				!creativeId ||
				lineItemId === '-2' ||
				creativeId === '-2'
			) {
				console.warn(`Unfilled slot: ${slotName}`);
			}
		}
	});
};

export {
	countLiveblogInlineSlots,
	fakeLogOut,
	getStage,
	getTestUrl,
	setupFakeLogin,
	waitForIsland,
	waitForSlot,
	logUnfilledSlots,
};
