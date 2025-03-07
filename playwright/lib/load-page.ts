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

		// set reject all cookie
		const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

		window.localStorage.setItem(
			'gu_allow_reject_all',
			sevenDaysLater.toUTCString(),
		);
		window.localStorage.setItem(
			'gu_hide_support_messaging',
			sevenDaysLater.toUTCString(),
		);
		window.localStorage.setItem(
			'gu_user_benefits_expiry',
			sevenDaysLater.toUTCString(),
		);

		// subscribe to commercial logger
		window.localStorage.setItem('gu.logger', '{"value":"commercial"}');
	}, region);

	logUnfilledSlots(page);

	// Uncomment to log commercial logs
	// logCommercial(page);

	// console.log('Loading page', path);
	await page.goto(path, { waitUntil: 'domcontentloaded' });
};

export { loadPage };
