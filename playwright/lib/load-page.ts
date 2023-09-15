import { type Page } from '@playwright/test';

const loadPage = async (page: Page, path: string) => {
	// abort all ophan requests as it stops the page from firing the 'load' event
	// await page.route(/ophan.theguardian.com/, (route) => {
	// 	route.abort();
	// });
	await page.addInitScript(() => {
		window.localStorage.setItem(
			'gu.geo.override',
			JSON.stringify({ value: 'GB' }),
		);
	});
	await page.goto(path, { waitUntil: 'domcontentloaded' });
};

export { loadPage };
