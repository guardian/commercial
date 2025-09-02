import type { BrowserContext, Cookie, Page } from '@playwright/test';

const headerBiddingAnalyticsUrl = {
	dev: 'http://performance-events.code.dev-guardianapis.com/header-bidding',
	code: 'https://performance-events.code.dev-guardianapis.com/header-bidding',
	prod: 'https://performance-events.guardianapis.com/header-bidding',
} as const;

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

export {
	clearCookie,
	countLiveblogInlineSlots,
	headerBiddingAnalyticsUrl,
	waitForIsland,
	waitForSlot,
};
