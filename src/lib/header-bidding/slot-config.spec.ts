import { Advert } from '../../define/Advert';
import type { SizeMapping } from '../../lib/ad-sizes';
import { adSizes, createAdSize } from '../../lib/ad-sizes';
import { getHeaderBiddingAdSlots } from './slot-config';
import { getBreakpointKey, shouldIncludeMobileSticky } from './utils';
import type * as Utils from './utils';

jest.mock('./utils', () => {
	const original: typeof Utils = jest.requireActual('./utils');
	return {
		...original,
		getBreakpointKey: jest.fn(),
		shouldIncludeMobileSticky: jest.fn(),
	};
});

jest.mock('experiments/ab', () => ({
	isInVariantSynchronous: jest.fn(
		(testId, variantId) => variantId === 'variant',
	),
}));

jest.mock('define/init-slot-ias', () => ({
	initSlotIas: jest.fn(() => Promise.resolve()),
}));

jest.mock('lib/targeting/teads-eligibility', () => ({
	isEligibleForTeads: jest.fn(),
}));

const slotPrototype = {
	fake: 'slot',
	defineSizeMapping: () => slotPrototype,
	addService: () => slotPrototype,
	setTargeting: () => slotPrototype,
	setSafeFrameConfig: () => slotPrototype,
	getTargeting: () => slotPrototype,
};

// Mock window.googletag
window.googletag = {
	sizeMapping: () => ({
		// @ts-expect-error these are just mocks
		addSize: () => {
			/* Do nothing*/
		},
		build: () => [],
	}),
	// @ts-expect-error these are just mocks
	defineSlot: () => ({ ...slotPrototype }),
	// @ts-expect-error these are just mocks
	pubads: () => ({}),
};

const buildAdvert = (name: string, sizes?: SizeMapping, id?: string) => {
	const elt = document.createElement('div');
	elt.setAttribute('id', id ?? `dfp-ad--${name}`);
	elt.setAttribute('data-name', name);
	return new Advert(elt, sizes);
};

describe('getPrebidAdSlots', () => {
	test('should return the correct top-above-nav slot at breakpoint D', () => {
		(getBreakpointKey as jest.Mock).mockReturnValue('D');
		expect(getHeaderBiddingAdSlots(buildAdvert('top-above-nav'))).toEqual([
			{
				key: 'top-above-nav',
				sizes: [createAdSize(970, 250), createAdSize(728, 90)],
			},
		]);
	});

	test('should return the correct interactive banner slot at breakpoint D', () => {
		(getBreakpointKey as jest.Mock).mockReturnValue('D');
		const dfpAdvert = buildAdvert(
			'banner',
			{ mobile: [adSizes.mpu] },
			'dfp-ad--1',
		);
		dfpAdvert.node.setAttribute(
			'class',
			'js-ad-slot ad-slot ad-slot--banner-ad ad-slot--banner-ad-desktop ad-slot--rendered',
		);

		const slotReturned = getHeaderBiddingAdSlots(dfpAdvert)[0];
		expect(slotReturned).toBeDefined();
		expect(slotReturned).toMatchObject({
			key: 'banner',
		});
	});

	test('should return the correct top-above-nav slot at breakpoint T', () => {
		(getBreakpointKey as jest.Mock).mockReturnValue('T');
		expect(getHeaderBiddingAdSlots(buildAdvert('top-above-nav'))).toEqual([
			{
				key: 'top-above-nav',
				sizes: [createAdSize(728, 90)],
			},
		]);
	});

	test('should return the correct top-above-nav slot at breakpoint M', () => {
		(getBreakpointKey as jest.Mock).mockReturnValue('M');
		expect(getHeaderBiddingAdSlots(buildAdvert('top-above-nav'))).toEqual([
			{
				key: 'top-above-nav',
				sizes: [createAdSize(300, 250)],
			},
		]);
	});

	test('should return the correct mobile-sticky slot at breakpoint M', () => {
		(getBreakpointKey as jest.Mock).mockReturnValue('M');
		(shouldIncludeMobileSticky as jest.Mock).mockReturnValue(true);
		expect(
			getHeaderBiddingAdSlots(
				buildAdvert('mobile-sticky', { mobile: [adSizes.mpu] }),
			),
		).toEqual([
			{
				key: 'mobile-sticky',
				sizes: [createAdSize(320, 50), createAdSize(300, 50)],
			},
		]);
	});

	test('should return the correct inline1 slot at breakpoint D with no additional size mappings', () => {
		(getBreakpointKey as jest.Mock).mockReturnValue('D');
		window.guardian.config.page.contentType = 'Article';

		const hbSlots = getHeaderBiddingAdSlots(buildAdvert('inline1'));
		expect(hbSlots).toHaveLength(1);
		expect(hbSlots[0]?.sizes).toEqual([
			createAdSize(300, 250),
			createAdSize(620, 350),
		]);
	});

	test('should return the correct inline1 slot at breakpoint M with no additional size mappings', () => {
		(getBreakpointKey as jest.Mock).mockReturnValue('M');
		window.guardian.config.page.contentType = 'Article';

		const hbSlots = getHeaderBiddingAdSlots(buildAdvert('inline1'));
		expect(hbSlots).toHaveLength(1);
		expect(hbSlots[0]?.sizes).toEqual([
			createAdSize(300, 197),
			createAdSize(300, 250),
			createAdSize(320, 480),
		]);
	});

	test('should return the correct inline2 slot at breakpoint D with no additional size mappings', () => {
		(getBreakpointKey as jest.Mock).mockReturnValue('D');
		window.guardian.config.page.contentType = 'Article';

		const hbSlots = getHeaderBiddingAdSlots(buildAdvert('inline2'));
		expect(hbSlots).toHaveLength(1);
		expect(hbSlots[0]?.sizes).toEqual([
			createAdSize(160, 600),
			createAdSize(300, 600),
			createAdSize(300, 250),
		]);
	});

	test('should return the correct inline2 slot at breakpoint M with no additional size mappings', () => {
		(getBreakpointKey as jest.Mock).mockReturnValue('M');
		window.guardian.config.page.contentType = 'Article';

		const hbSlots = getHeaderBiddingAdSlots(buildAdvert('inline2'));
		expect(hbSlots).toHaveLength(1);
		expect(hbSlots[0]?.sizes).toEqual([
			createAdSize(300, 250),
			createAdSize(320, 480),
			createAdSize(371, 660),
		]);
	});

	test('should return the correct inline slot at breakpoint M when inline is in size mappings', () => {
		(getBreakpointKey as jest.Mock).mockReturnValue('M');
		window.guardian.config.page.contentType = 'Article';
		const hbSlots = getHeaderBiddingAdSlots(buildAdvert('inline4'));

		expect(hbSlots).toContainEqual(
			expect.objectContaining({
				key: 'inline',
				sizes: [createAdSize(300, 250)],
			}),
		);
	});

	test('should return the correct inline slot at breakpoint D with no additional size mappings', () => {
		(getBreakpointKey as jest.Mock).mockReturnValue('D');
		window.guardian.config.page.contentType = 'Article';

		const hbSlots = getHeaderBiddingAdSlots(buildAdvert('inline4'));
		expect(hbSlots).toHaveLength(1);
		expect(hbSlots[0]?.sizes).toEqual([createAdSize(300, 250)]);
	});

	test('should return the correct inline slot at breakpoint D with additional size mappings', () => {
		(getBreakpointKey as jest.Mock).mockReturnValue('D');
		window.guardian.config.page.contentType = 'Article';

		const hbSlots = getHeaderBiddingAdSlots(
			buildAdvert('inline4', {
				desktop: [adSizes.halfPage, adSizes.skyscraper],
			}),
		);
		expect(hbSlots).toHaveLength(1);
		expect(hbSlots[0]?.sizes).toEqual([
			createAdSize(160, 600),
			createAdSize(300, 600),
			createAdSize(300, 250),
		]);
	});
});
