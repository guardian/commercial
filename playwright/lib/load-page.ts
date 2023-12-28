import { type Page } from '@playwright/test';
import { logUnfilledSlots } from './util';

const loadPage = async (page: Page, path: string, region = 'GB') => {
	await page.addInitScript((region) => {
		// force geo region
		window.localStorage.setItem(
			'gu.geo.override',
			JSON.stringify({ value: region }),
		);
		// prevent support banner
		window.localStorage.setItem(
			'gu.prefs.engagementBannerLastClosedAt',
			`{"value":"${new Date().toISOString()}"}`,
		);

		// subscribe to commercial logger
		window.localStorage.setItem('gu.logger', '{"value":"commercial"}');
	}, region);

	logUnfilledSlots(page);

	// Abort all ophan requests as it stops the page from firing the 'load' event
	//
	// await page.route(/ophan.theguardian.com/, (route) => {
	// 	route.abort();
	// });
	//
	// Instead of aborting ophan change the waituntil to 'domcontentloaded'
	// rather than 'load'. Monitor this to see if it works for our use cases.
	console.log('Loading page', path);
	await page.goto(path, { waitUntil: 'domcontentloaded' });
};

export { loadPage };
