import { expect, test } from '@playwright/test';
import { cmpAcceptAll } from '../lib/cmp';
import { articles } from '../fixtures/pages';
import { loadPage } from '../lib/load-page';

test.describe('commercial.queue', () => {
	test(`A function added to the queue before initialisation is executed during boot`, async ({
		page,
	}) => {
		await loadPage({
			page,
			path: articles[2].path,
			// In GB, we don't load commercial until the CMP has been interacted with
			region: 'GB',
		});

		// Add an event listener for the custom event before the queue is set up
		// The handler adds a test div to the document body when receiving the event
		await page.evaluate(() => {
			document.addEventListener('playwright:commercial-queue', () => {
				const fragment = document.createDocumentFragment();
				const testDiv = fragment.appendChild(
					document.createElement('div'),
				);
				testDiv.id = 'playwright-commercial-queue-test';
				document.body.appendChild(fragment);
			});
		});

		// Set up the commercial queue with a custom event to dispatch once initialised
		await page.evaluate(() => {
			if (window.guardian) {
				window.guardian.commercial ??= {};
				window.guardian.commercial.queue ??= [];
				window.guardian.commercial.queue.push(
					() =>
						void document.dispatchEvent(
							new Event('playwright:commercial-queue'),
						),
				);
			}
		});

		// Commercial hasn't booted at this stage so the function to dispatch
		// the event is still queued up waiting to be executed
		expect(
			page.locator('#playwright-commercial-queue-test'),
		).not.toBeAttached();

		await cmpAcceptAll(page);

		// Commercial boots up and flushes the queue, resulting in the
		// custom event dispatching and subsequently being handled
		expect(
			page.locator('#playwright-commercial-queue-test'),
		).toBeAttached();
	});

	test(`A function added to the queue after initialisation is executed immediately`, async ({
		page,
	}) => {
		await loadPage({ page, path: articles[2].path, region: 'GB' });
		await cmpAcceptAll(page);

		// Add an event listener for the custom event before the queue is set up
		// The handler adds a test div to the document body when receiving the event
		await page.evaluate(() => {
			document.addEventListener('playwright:commercial-queue', () => {
				const fragment = document.createDocumentFragment();
				const testDiv = fragment.appendChild(
					document.createElement('div'),
				);
				testDiv.id = 'playwright-commercial-queue-test';
				document.body.appendChild(fragment);
			});
		});

		// Set up the commercial queue with a custom event to dispatch once initialised
		await page.evaluate(() => {
			if (window.guardian) {
				window.guardian.commercial ??= {};
				window.guardian.commercial.queue ??= [];
				window.guardian.commercial.queue.push(
					() =>
						void document.dispatchEvent(
							new Event('playwright:commercial-queue'),
						),
				);
			}
		});

		// Commercial has already booted at this stage so the function to dispatch
		// the event executes immediately
		expect(
			page.locator('#playwright-commercial-queue-test'),
		).toBeAttached();
	});
});
