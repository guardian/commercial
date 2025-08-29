import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

const TEN_SECONDS = 10_000;

const expectToBeVisible = async (
	page: Page,
	selector: string,
	nth = 0,
): Promise<void> => {
	await expect(page.locator(selector).nth(nth)).toBeVisible({
		timeout: TEN_SECONDS,
	});
};

const expectToNotBeVisible = async (
	page: Page,
	selector: string,
	nth = 0,
): Promise<void> => {
	await expect(page.locator(selector).nth(nth)).not.toBeVisible({
		timeout: TEN_SECONDS,
	});
};

const expectLocatorToBeVisible = async (
	locator: Locator,
	count = 1,
): Promise<void> => {
	await expect(locator).toHaveCount(count, { timeout: TEN_SECONDS });
	await expect(locator).toBeVisible({ timeout: TEN_SECONDS });
};

const expectLocatorToNotBeVisible = async (locator: Locator): Promise<void> => {
	await expect(locator).not.toBeVisible({ timeout: TEN_SECONDS });
};

export {
	expectLocatorToBeVisible,
	expectLocatorToNotBeVisible,
	expectToBeVisible,
	expectToNotBeVisible,
};
