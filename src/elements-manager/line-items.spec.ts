import type { PageTargeting } from 'core';
import lineItemFixture from '../__fixtures__/line-items-fixtures.json';
import { findLineItems } from './line-items';

beforeEach(() => {
	global.fetch = jest.fn(() =>
		Promise.resolve({
			json: () => Promise.resolve(lineItemFixture),
		}),
	) as jest.Mock;
});

describe('findLineItems', () => {
	it('always returns items with no custom targeting', async () => {
		const noTargetingIds = lineItemFixture.flatMap((lineItem) =>
			lineItem.customTargeting === null ? lineItem.id : [],
		);
		const targeting = {} as PageTargeting;

		const lineItems = await findLineItems(targeting);
		const lineItemIds = lineItems.map((item) => item.id);

		noTargetingIds.forEach((id) => {
			expect(lineItemIds).toContain(id);
		});
	});

	it('returns items when targeting matches custom parameters', async () => {
		const targeting = {
			at: 'rhubarb_feast',
			url: '/music/article/2024/jul/12/will-i-just-disappear-laura-marling-on-the-ecstasy-of-motherhood-and-why-she-might-quit-music',
		} as PageTargeting;
		const lineItems = await findLineItems(targeting);
		const lineItemIds = lineItems.map((item) => item.id);

		expect(lineItemIds).toContain(6753800134);
	});
});
