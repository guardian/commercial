import { _ } from './fill-static-advert-slots';

const { findStaticAdverts } = _;

jest.mock('../remove-slots', () => ({
	removeDisabledSlots: jest.fn(),
}));

jest.mock('./create-advert', () => ({
	createAdvert: jest.fn(),
}));

jest.mock('./display-ads', () => ({
	displayAds: jest.fn(),
}));

jest.mock('./display-lazy-ads', () => ({
	displayLazyAds: jest.fn(),
}));

jest.mock('./merchandising-high-test', () => ({
	includeBillboardsInMerchHigh: jest.fn(),
}));

jest.mock('./prepare-prebid', () => ({
	setupPrebidOnce: jest.fn(),
}));

describe('findStaticAdverts', () => {
	beforeEach(() => {
		window.guardian = {
			config: {
				// @ts-expect-error - mocking
				page: {
					contentType: 'Article',
					hasPageSkin: false,
				},
			},
		};
	});

	it('should filter out adverts already in `dfpEnv`', () => {
		jest.mock('./dfp-env', () => ({
			dfpEnv: {
				advertIds: {
					'dfp-ad--inline1': 1,
				},
			},
		}));

		document.body.innerHTML = `
		<div id="dfp-ad--top-above-nav" class="js-ad-slot"></div>
		<div id="dfp-ad--inline1" class="js-ad-slot"></div>
	`;

		const adSlots = [
			...document.querySelectorAll<HTMLElement>('.js-ad-slot'),
		];

		const adverts = findStaticAdverts(adSlots);

		expect(adverts.find((ad) => ad.node.id === 'dfp-ad--inline1')).toEqual(
			undefined,
		);
	});

	it('should filter top-above-nav on mobile view in DCR', () => {
		jest.mock('./dfp-env', () => ({
			dfpEnv: {
				advertIds: {},
			},
		}));

		jest.mock('lib/detect/detect-breakpoint', () => ({
			getCurrentBreakpoint: () => 'mobile',
		}));

		window.guardian.config.isDotcomRendering = true;

		document.body.innerHTML = `
		<div id="dfp-ad--top-above-nav" class="js-ad-slot"></div>
		<div id="dfp-ad--inline1" class="js-ad-slot"></div>
	`;

		const adSlots = [
			...document.querySelectorAll<HTMLElement>('.js-ad-slot'),
		];

		const adverts = findStaticAdverts(adSlots);

		expect(
			adverts.find((ad) => ad.node.id === 'dfp-ad--top-above-nav'),
		).toEqual(undefined);
	});

	it('should filter slots with data-dynamic-slot="true"', () => {
		jest.mock('./dfp-env', () => ({
			dfpEnv: {
				advertIds: {},
			},
		}));

		document.body.innerHTML = `
			<div id="dfp-ad--article-end" class="js-ad-slot" data-dynamic-slot="true"></div>
			<div id="dfp-ad--inline1" class="js-ad-slot"></div>
		`;

		const adSlots = [
			...document.querySelectorAll<HTMLElement>('.js-ad-slot'),
		];

		const adverts = findStaticAdverts(adSlots);

		expect(
			adverts.find((ad) => ad.node.id === 'dfp-ad--article-end'),
		).toEqual(undefined);
	});
});
