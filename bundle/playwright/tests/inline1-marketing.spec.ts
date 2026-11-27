import { expect, test } from '@playwright/test';
import { testAtBreakpoints } from '../lib/breakpoints';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';

// const pages = [
// 	{
// 		path: '/Article/https://m.code.dev-theguardian.com/politics/2022/feb/10/keir-starmer-says-stop-the-war-coalition-gives-help-to-authoritarians-like-putin',
// 	},
// 	{
// 		path: 'Article/https://m.code.dev-theguardian.com/fashion/2026/nov/06/minimal-look-maximal-politics-how-the-black-t-shirt-became-a-political-weapon'
// 	}
// ];

const inline1Tests = {
	'TEST:CONTROL': 'Inline1SupportMessage',
	'TESTNEWSLETTER:CONTROL': 'Inline1NewsletterMessage',
	'TESTPUZZLES:CONTROL': 'Inline1PuzzlesMessage',
} satisfies Record<string, string>;

test.describe('Inline1 marketing component', () => {
	testAtBreakpoints(['mobile', 'tablet', 'desktop']).forEach(
		({ breakpoint, width, height }) => {
			Object.entries(inline1Tests).forEach(([testId, messageType]) => {
				test(`Article displays the inline1 preview ${messageType} component on ${breakpoint}`, async ({
					page,
				}) => {
					await page.setViewportSize({ width, height });
					await loadPage({
						page,
						path: '/Article/https://m.code.dev-theguardian.com/fashion/2026/nov/06/minimal-look-maximal-politics-how-the-black-t-shirt-became-a-political-weapon',
						queryParams: {
							'preview-inline1': testId,
						},
					});
					await cmpAcceptAll(page);

					const inline1Slot = page.locator('#dfp-ad--inline1');
					await inline1Slot.scrollIntoViewIfNeeded();

					const componentSelector = `#dfp-ad--inline1 > [data-message-type="${messageType}"]`;
					await expect(page.locator(componentSelector)).toHaveCount(
						1,
						{
							timeout: 3_000,
						},
					);
				});
			});
		},
	);
});
