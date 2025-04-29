import type { BrowserContext, Cookie, Page } from '@playwright/test';

type Stage = 'code' | 'prod' | 'dev';

type ContentType = 'article' | 'liveblog' | 'front' | 'tagPage';

const normalizeStage = (stage: string): Stage =>
	['code', 'prod', 'dev'].includes(stage) ? (stage as Stage) : 'dev';

/**
 * Set the stage via environment variable STAGE
 * e.g. `STAGE=code pnpm playwright test`
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

const headerBiddingAnalyticsUrl = {
	dev: 'http://performance-events.code.dev-guardianapis.com/header-bidding',
	code: 'https://performance-events.code.dev-guardianapis.com/header-bidding',
	prod: 'http://performance-events.guardianapis.com/header-bidding',
} as const;

const getHost = (stage?: Stage) => {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive runtime
	return hostnames[stage ?? getStage()] ?? hostnames.dev;
};

const getDcrContentType = (
	type: ContentType,
): 'Article' | 'Front' | 'TagPage' => {
	switch (type) {
		case 'front':
			return 'Front';

		case 'tagPage':
			return 'TagPage';

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

// Playwright does not currently have a useful method for removing a cookie, so this workaround is needed.
const clearCookie = async (context: BrowserContext, cookieName: string) => {
	const cookies = await context.cookies();
	const filteredCookies = cookies.filter(
		(cookie: Cookie) => cookie.name !== cookieName,
	);
	await context.clearCookies();
	await context.addCookies(filteredCookies);
};

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
		const iframe = page.locator(`${slotId} iframe:first-child`);
		// wait for the iframe to be visible
		await iframe.waitFor();
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
	await hyrdatedIslandLocator.waitFor();
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

		if (url.includes('securepubads.g.doubleclick.net/gampad/ads')) {
			const lineItemId = response.headers()['google-lineitem-id'] ?? '';
			const creativeId = response.headers()['google-creative-id'] ?? '';

			if (
				!lineItemId ||
				!creativeId ||
				lineItemId === '-2' ||
				creativeId === '-2'
			) {
				console.warn(`Unfilled slot: ${getSlotName(url)}`);
			}
		}
	});
};

// Log commercial logs to playwight console
const logCommercial = (page: Page) => {
	page.on('console', (msg) => {
		const label = JSON.stringify(msg.args()[0]);
		if (label.includes('commercial')) {
			console.log(msg.args().slice(4).map(String).join(' '));
		}
	});
};

export {
	countLiveblogInlineSlots,
	clearCookie,
	getStage,
	getTestUrl,
	waitForIsland,
	waitForSlot,
	logUnfilledSlots,
	logCommercial,
	headerBiddingAnalyticsUrl,
};
