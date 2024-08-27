import type { PageTargeting } from 'core';
import lineItemFixture from '../__fixtures__/line-items-fixtures.json';
import { findLineItems } from './line-items';

async function getLineItemIds(targeting: PageTargeting, debug = false) {
	const lineItems = await findLineItems(targeting, debug);
	return lineItems.map((item) => item.id);
}

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
		const lineItemIds = await getLineItemIds(targeting);

		noTargetingIds.forEach((id) => {
			expect(lineItemIds).toContain(id);
		});
	});

	it('returns items when targeting matches required custom parameters - specific values', async () => {
		const rhubarbFeastAdId = 6753800134;
		const targeting = {
			at: 'rhubarb_feast',
			url: '/music/article/2024/jul/12/will-i-just-disappear-laura-marling-on-the-ecstasy-of-motherhood-and-why-she-might-quit-music',
		} as PageTargeting;
		const lineItemIds = await getLineItemIds(targeting);

		expect(lineItemIds).toContain(rhubarbFeastAdId);
	});

	it('returns items when targeting matches required custom parameters and does not match excluded parameters', async () => {
		const microsoftAiAdId = 6745162272;
		const targeting = {
			slot: 'merchandising',
			ct: 'article',
		} as PageTargeting;
		const lineItemIds = await getLineItemIds(targeting);

		expect(lineItemIds).toContain(microsoftAiAdId);
	});

	it('does not return items when targeting is not an exact match to the required custom targeting', async () => {
		const rhubarbFeastAdId = 6753800134;
		const targeting = {
			at: 'rhubarb_feast',
			url: '/education/article/2024/aug/20/add-ice-lolly-licking-to-england-primary-school-curriculum-urge-scientists',
		} as PageTargeting;
		const lineItemIds = await getLineItemIds(targeting);

		expect(lineItemIds).not.toContain(rhubarbFeastAdId);
	});

	it('does not return items when targeting includes items excluded by the custom targeting', async () => {
		const microsoftAiAdId = 6745162272;
		const targeting = {
			slot: 'merchandising',
			ct: 'section',
			se: ['climate-countdown'],
		} as PageTargeting;
		const lineItemIds = await getLineItemIds(targeting);

		expect(lineItemIds).not.toContain(microsoftAiAdId);
	});
});
