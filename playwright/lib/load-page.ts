import { type Page } from '@playwright/test';

const loadPage = async (page: Page, path: string, region = 'GB') => {
	// abort all ophan requests as it stops the page from firing the 'load' event
	// await page.route(/ophan.theguardian.com/, (route) => {
	// 	route.abort();
	// });
	await page.addInitScript((region) => {
		window.localStorage.setItem(
			'gu.geo.override',
			JSON.stringify({ value: region }),
		);
	}, region);
	await page.goto(path, { waitUntil: 'domcontentloaded' });
};

export { loadPage };
