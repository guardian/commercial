import { BrowserContext } from '@playwright/test';

/**
 * Adds a cookie to the browser context to allow the CMP reject all option to be tested in Playwright.
 * This is necessary because normally only ad-lite or subscribers see the reject all option.
 * @param context The Playwright browser context
 */
const allowRejectAll = async (context: BrowserContext) => {
	await context.addCookies([
		{
			name: 'gu_allow_reject_all',
			value: `${Date.now() + 1000 * 60 * 60}`, // 1 hour
			domain: 'localhost',
			path: '/',
			httpOnly: false,
		},
	]);
};

export { allowRejectAll };
