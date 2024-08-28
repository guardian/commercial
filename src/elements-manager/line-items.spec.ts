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

describe('findLineItems - custom targeting', () => {
	it('always returns items that do not have device-specific or other custom targeting', async () => {
		const noTargetingIds = lineItemFixture.flatMap((lineItem) => {
			const noDeviceTargeting = lineItem.deviceTargeting === null;
			const noCustomTargeting = lineItem.customTargeting === null;
			return noCustomTargeting && noDeviceTargeting ? lineItem.id : [];
		});
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

	it('returns items when one optional condition is met', async () => {
		const dummyFixtureOneId = 6739402048;

		const targeting = {
			at: 'banana_feast',
			ct: 'liveblog',
		} as PageTargeting;
		const lineItemIds = await getLineItemIds(targeting);

		expect(lineItemIds).toContain(dummyFixtureOneId);
	})
});

describe('findLineItems - device targeting', () => {
	it('does not return items which exclude the current breakpoint', async () => {
		const mobileTabletAdId = 6839075892;
		const targeting = {
			bp: 'desktop'
		} as PageTargeting;
		const lineItemIds = await getLineItemIds(targeting);

		expect(lineItemIds).not.toContain(mobileTabletAdId);
	});

	it('returns items which match the current breakpoint', async () => {
		const mobileTabletAdId = 6839075892;
		const targeting = {
			bp: 'mobile'
		} as PageTargeting;
		const lineItemIds = await getLineItemIds(targeting);

		expect(lineItemIds).toContain(mobileTabletAdId);
	});

	it('returns items when both the breakpoint and custom targeting are a match', async () => {
		const mobileRhubarbAdId = 6029384758;
		const targeting = {
			bp: 'mobile',
			at: 'rhubarb_feast'
		} as PageTargeting;
		const lineItemIds = await getLineItemIds(targeting);

		expect(lineItemIds).toContain(mobileRhubarbAdId);
	});

	it('does not items when the breakpoint and custom targeting are not both a match', async () => {
		const mobileRhubarbAdId = 6029384758;
		const targeting = {
			bp: 'desktop',
			at: 'rhubarb_feast'
		} as PageTargeting;
		const lineItemIds = await getLineItemIds(targeting);

		expect(lineItemIds).not.toContain(mobileRhubarbAdId);
	});
});
