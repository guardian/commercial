import { Page } from '@playwright/test';

const SP_IFRAME_LOCATOR = '[id*="sp_message_iframe"]';
const SP_ACCEPT_ALL_LOCATOR = 'button.sp_choice_type_11';

const cmpAcceptAll = async (page: Page) => {
	const acceptAllButton = page
		.frameLocator(SP_IFRAME_LOCATOR)
		.locator(SP_ACCEPT_ALL_LOCATOR);
	await acceptAllButton.click();
	await new Promise((r) => setTimeout(r, 2000));
};

export { cmpAcceptAll };
