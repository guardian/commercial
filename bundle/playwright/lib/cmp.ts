import type { Page } from '@playwright/test';
import { waitForIsland } from './util';

const SP_LAYER1_IFRAME = '[id*="sp_message_iframe"]';
const SP_LAYER1_ACCEPT_ALL_BUTTON = 'button.sp_choice_type_11';
const SP_LAYER1_REJECT_ALL_BUTTON = 'button.sp_choice_type_13';

const SP_LAYER2_IFRAME = 'iframe[title="SP Consent Message"]';
const SP_LAYER2_ACCEPT_ALL_BUTTON = 'button.sp_choice_type_ACCEPT_ALL';

const cmpAcceptAll = async (page: Page) => {
	await page.waitForSelector(SP_LAYER1_IFRAME, { timeout: 10_000 }); // 10s
	const acceptAllButton = page
		.frameLocator(SP_LAYER1_IFRAME)
		.locator(SP_LAYER1_ACCEPT_ALL_BUTTON);
	await acceptAllButton.click();
	await new Promise((r) =>
		setTimeout(
			r,
			2_000, // 2s
		),
	);
};

const cmpRejectAll = async (page: Page) => {
	const rejectAllButton = page
		.frameLocator(SP_LAYER1_IFRAME)
		.locator(SP_LAYER1_REJECT_ALL_BUTTON);
	await rejectAllButton.click();
	await new Promise((r) =>
		setTimeout(
			r,
			2_000, // 2s
		),
	);
};

const cmpReconsent = async (page: Page) => {
	await waitForIsland(page, 'PrivacySettingsLink');
	const privacySettingsSelector = '[data-link-name="privacy-settings"]';
	await page.locator(privacySettingsSelector).scrollIntoViewIfNeeded();
	await page.locator(privacySettingsSelector).click();
	const acceptAllButton = page
		.frameLocator(SP_LAYER2_IFRAME)
		.locator(SP_LAYER2_ACCEPT_ALL_BUTTON);
	await acceptAllButton.click();
	await new Promise((r) =>
		setTimeout(
			r,
			2_000, // 2s
		),
	);
};

export { cmpAcceptAll, cmpReconsent, cmpRejectAll };
