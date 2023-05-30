import type * as AdSizesType from 'core/ad-sizes';
import { slotSizeMappings as slotSizeMappings_ } from 'core/ad-sizes';
import { _, Advert } from './Advert';

const { getSlotSizeMapping } = _;

jest.mock('../../../../lib/raven');
jest.mock('ophan-tracker-js', () => null);

jest.mock('core/ad-sizes', () => {
	const adSizes: typeof AdSizesType = jest.requireActual('core/ad-sizes');
	const slotSizeMappings = adSizes.slotSizeMappings;
	const slots = {
		'mobile-only-slot': {
			mobile: [[300, 50]],
		},
		slot: {
			mobile: [
				[300, 50],
				[320, 50],
			],
			tablet: [[728, 90]],
			desktop: [
				[728, 90],
				[900, 250],
				[970, 250],
			],
		},
	};
	return {
		__esModule: true,
		...adSizes,
		slotSizeMappings: {
			...slotSizeMappings,
			...slots,
		},
	};
});

describe('Advert', () => {
	let googleSlot: googletag.Slot;

	beforeEach(() => {
		let sizesArray: googletag.SizeMappingArray = [];

		const sizeMapping = {
			sizes: sizesArray,
			addSize: jest.fn((width, sizes) => {
				sizesArray.unshift([width, sizes]);
			}),
			build: jest.fn(() => {
				const tmp = sizesArray;
				sizesArray = [];
				return tmp;
			}),
		} as unknown as googletag.SizeMappingBuilder;

		//@ts-expect-error - it is a partial mock
		googleSlot = {
			defineSizeMapping: jest.fn(() => googleSlot),
			setSafeFrameConfig: jest.fn(() => googleSlot),
			setTargeting: jest.fn(() => googleSlot),
			addService: jest.fn(() => googleSlot),
		};

		const partialGoogletag: Partial<typeof googletag> = {
			pubads() {
				return {} as googletag.PubAdsService;
			},
			sizeMapping() {
				return sizeMapping;
			},
			defineSlot() {
				return googleSlot;
			},
		};

		// @ts-expect-error -- we’re making it a partial
		window.googletag = partialGoogletag;
	});

	it('should enable safeframe to expand in the top-above-nav slot', () => {
		const slot = document.createElement('div');
		slot.setAttribute('data-name', 'top-above-nav');
		const ad = new Advert(slot);
		expect(ad).toBeDefined();
		expect(googleSlot.setSafeFrameConfig).toBeCalledWith({
			allowOverlayExpansion: false,
			allowPushExpansion: true,
			sandbox: true,
		});
	});

	it('should enable safeframe to expand in the inline1 slot', () => {
		const slot = document.createElement('div');
		slot.setAttribute('data-name', 'inline1');
		const ad = new Advert(slot);
		expect(ad).toBeDefined();
		expect(googleSlot.setSafeFrameConfig).toBeCalledWith({
			allowOverlayExpansion: false,
			allowPushExpansion: true,
			sandbox: true,
		});
	});

	it('should not enable safeframe to expand in a slot that cannot take outstream ads', () => {
		const slot = document.createElement('div');
		slot.setAttribute('data-name', 'inline2');
		const ad = new Advert(slot);
		expect(ad).toBeDefined();
		expect(googleSlot.setSafeFrameConfig).not.toBeCalled();
	});

	it('should throw an error if no size mappings are found or passed in', () => {
		const slot = document.createElement('div');
		slot.setAttribute('data-name', 'bad-slot');
		const createAd = () => new Advert(slot);
		expect(createAd).toThrow(
			`Tried to render ad slot 'bad-slot' without any size mappings`,
		);
	});
});

describe('getAdSizeMapping', () => {
	it('getAdSizeMapping for test slots should get the size mapping', () => {
		expect(getSlotSizeMapping('slot')).toEqual({
			mobile: [
				[300, 50],
				[320, 50],
			],
			tablet: [[728, 90]],
			desktop: [
				[728, 90],
				[900, 250],
				[970, 250],
			],
		});
		expect(getSlotSizeMapping('mobile-only-slot')).toEqual({
			mobile: [[300, 50]],
		});
	});

	it.each(['inline1', 'inline10', ...Object.keys(slotSizeMappings_)])(
		'getAdSizeMapping(%s) should get the size mapping for real slots',
		(value) => {
			const slotName = /inline\d+/.test(value)
				? 'inline'
				: (value as AdSizesType.SlotName);
			expect(getSlotSizeMapping(value)).toEqual(
				slotSizeMappings_[slotName],
			);
		},
	);
});
