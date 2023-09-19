import type { Page } from '@playwright/test';

const SP_LAYER1_IFRAME_LOCATOR = '[id*="sp_message_iframe"]';
const SP_ACCEPT_ALL_LOCATOR = 'button.sp_choice_type_11';
const SP_MANAGE_MY_COOKIES_BUTTON = 'button.sp_choice_type_12';

const SP_LAYER2_IFRAME_LOCATOR = 'iframe[title="SP Consent Message"]';
const SP_REJECT_ALL_BUTTON = 'button.sp_choice_type_REJECT_ALL';

const cmpAcceptAll = async (page: Page) => {
	const acceptAllButton = page
		.frameLocator(SP_LAYER1_IFRAME_LOCATOR)
		.locator(SP_ACCEPT_ALL_LOCATOR);
	await acceptAllButton.click();
	await new Promise((r) => setTimeout(r, 2000));
};

const cmpRejectAll = async (page: Page) => {
	const manageMyCookiesButton = page
		.frameLocator(SP_LAYER1_IFRAME_LOCATOR)
		.locator(SP_MANAGE_MY_COOKIES_BUTTON);
	await manageMyCookiesButton.click();
	const rejectAllButton = page
		.frameLocator(SP_LAYER2_IFRAME_LOCATOR)
		.locator(SP_REJECT_ALL_BUTTON);
	await rejectAllButton.click();
	await new Promise((r) => setTimeout(r, 2000));
};

const cmpReconsent = async (page: Page) => {
	const privacySettingsSelector = '[data-link-name="privacy-settings"]';
	await page.locator(privacySettingsSelector).scrollIntoViewIfNeeded();
	await page.locator(privacySettingsSelector).click();
	await cmpAcceptAll(page);
};

export { cmpAcceptAll, cmpReconsent, cmpRejectAll };
