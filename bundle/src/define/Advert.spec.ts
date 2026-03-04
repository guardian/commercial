import type * as AdSizesType from '@guardian/commercial-core/ad-sizes';
import { slotSizeMappings as slotSizeMappings_ } from '@guardian/commercial-core/ad-sizes';
import { _, Advert, findSmallestAdHeightForSlot } from './Advert';

const { getSlotSizeMapping } = _;

jest.mock('define/init-slot-ias', () => ({
	initSlotIas: jest.fn(() => Promise.resolve()),
}));

jest.mock('@guardian/commercial-core/ad-sizes', () => {
	const adSizes: typeof AdSizesType = jest.requireActual(
		'@guardian/commercial-core/ad-sizes',
	);
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

jest.mock('@guardian/commercial-core/targeting/teads-eligibility', () => ({
	isEligibleForTeads: jest.fn(),
}));

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
			setConfig: jest.fn(() => googleSlot),
			addService: jest.fn(() => googleSlot),
			getConfig: jest.fn(() => ({
				targeting: {},
			})),
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
			cmd: [],
		};

		// @ts-expect-error -- we’re making it a partial
		window.googletag = partialGoogletag;
	});

	it('should enable safeframe to expand in the top-above-nav slot', () => {
		const slot = document.createElement('div');
		slot.setAttribute('data-name', 'top-above-nav');
		const ad = new Advert(slot);
		expect(ad).toBeDefined();
		expect(googleSlot.setConfig).toHaveBeenCalledWith({
			safeFrame: expect.objectContaining({
				allowOverlayExpansion: false,
				allowPushExpansion: true,
				sandbox: true,
			}) as Record<string, unknown>,
		});
	});

	it('should enable safeframe to expand in the inline1 slot', () => {
		const slot = document.createElement('div');
		slot.setAttribute('data-name', 'inline1');
		const ad = new Advert(slot);
		expect(ad).toBeDefined();
		expect(googleSlot.setConfig).toHaveBeenCalledWith({
			safeFrame: expect.objectContaining({
				allowOverlayExpansion: false,
				allowPushExpansion: true,
				sandbox: true,
			}) as Record<string, unknown>,
		});
	});

	it('should not enable safeframe to expand in a slot that cannot take outstream ads', () => {
		const slot = document.createElement('div');
		slot.setAttribute('data-name', 'inline2');
		const ad = new Advert(slot);
		expect(ad).toBeDefined();
		expect(googleSlot.setConfig).not.toHaveBeenCalledWith({
			safeFrame: {},
		});
	});

	it('should throw an error if no size mappings are found or passed in', () => {
		const slot = document.createElement('div');
		slot.setAttribute('data-name', 'bad-slot');
		const createAd = () => new Advert(slot);
		expect(createAd).toThrow(
			`Tried to render ad slot 'bad-slot' without any size mappings`,
		);
	});

	it('should set advert.gpid from slot targeting', () => {
		const slot = document.createElement('div');
		slot.setAttribute('data-name', 'top-above-nav');
		const expectedGpid = '/59666047/gu/news/article/top-above-nav';

		(googleSlot.getConfig as jest.Mock).mockImplementation((key) => {
			if (key === 'targeting') {
				return {
					targeting: {
						gpid: expectedGpid,
					},
				};
			}
			return { targeting: {} };
		});

		const ad = new Advert(slot);

		expect(ad).toBeDefined();
		expect(ad.gpid).toBe(expectedGpid);
	});

	describe('status management', () => {
		it('should dispatch statusChange event when status changes', () => {
			const slot = document.createElement('div');
			slot.setAttribute('data-name', 'top-above-nav');
			const ad = new Advert(slot);

			const listener = jest.fn();
			ad.addEventListener('statusChange', listener);

			ad.setStatus('loading', true);

			expect(listener).toHaveBeenCalledTimes(1);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- test
			expect(listener.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- test
			expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({
				name: 'loading',
				status: true,
			});
		});
	});

	describe('on() method', () => {
		it('should call callback immediately if advert is already at the specified status', () => {
			const slot = document.createElement('div');
			slot.setAttribute('data-name', 'top-above-nav');
			const ad = new Advert(slot);

			ad.setStatus('ready', true);

			const callback = jest.fn();
			ad.on('ready', callback);

			expect(callback).toHaveBeenCalledWith('ready');
		});

		it('should call callback when advert reaches the specified status', () => {
			const slot = document.createElement('div');
			slot.setAttribute('data-name', 'top-above-nav');
			const ad = new Advert(slot);

			const callback = jest.fn();
			ad.on('loaded', callback);

			expect(callback).not.toHaveBeenCalled();

			ad.setStatus('loading', true);
			expect(callback).not.toHaveBeenCalled();

			ad.setStatus('loaded', true);
			expect(callback).toHaveBeenCalledWith('loaded');
		});

		it('should call callback for any status in the array', () => {
			const slot = document.createElement('div');
			slot.setAttribute('data-name', 'top-above-nav');
			const ad = new Advert(slot);

			const callback = jest.fn();
			ad.on(['fetching', 'fetched'], callback);

			ad.setStatus('fetching', true);
			expect(callback).toHaveBeenCalledWith('fetching');
			expect(callback).toHaveBeenCalledTimes(1);

			ad.setStatus('fetched', true);
			expect(callback).toHaveBeenCalledWith('fetched');
			expect(callback).toHaveBeenCalledTimes(2);
		});

		it('should return a function to remove the listener', () => {
			const slot = document.createElement('div');
			slot.setAttribute('data-name', 'top-above-nav');
			const ad = new Advert(slot);

			const callback = jest.fn();
			const { remove } = ad.on('loaded', callback);

			remove();
			ad.setStatus('loaded', true);

			expect(callback).not.toHaveBeenCalled();
		});

		it('should call callback multiple times if status changes through it multiple times', () => {
			const slot = document.createElement('div');
			slot.setAttribute('data-name', 'top-above-nav');
			const ad = new Advert(slot);

			ad.setStatus('ready', true);
			const callback = jest.fn();
			ad.on('ready', callback);

			expect(callback).toHaveBeenCalledTimes(1);

			ad.setStatus('rendered', true);
			ad.setStatus('ready', true);

			expect(callback).toHaveBeenCalledTimes(2);
		});
	});

	describe('once() method', () => {
		it('should call callback immediately if advert is already at the specified status', () => {
			const slot = document.createElement('div');
			slot.setAttribute('data-name', 'top-above-nav');
			const ad = new Advert(slot);

			ad.setStatus('ready', true);

			const callback = jest.fn();
			ad.once('ready', callback);

			expect(callback).toHaveBeenCalledWith('ready');
		});

		it('should call callback only once when advert reaches the specified status', () => {
			const slot = document.createElement('div');
			slot.setAttribute('data-name', 'top-above-nav');
			const ad = new Advert(slot);

			const callback = jest.fn();
			ad.once('loaded', callback);

			ad.setStatus('loaded', true);
			expect(callback).toHaveBeenCalledTimes(1);

			ad.setStatus('fetching', true);
			ad.setStatus('fetched', true);
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it('should not call callback again after being triggered once', () => {
			const slot = document.createElement('div');
			slot.setAttribute('data-name', 'top-above-nav');
			const ad = new Advert(slot);

			const callback = jest.fn();
			ad.once('fetching', callback);

			ad.setStatus('fetching', true);
			expect(callback).toHaveBeenCalledTimes(1);

			ad.setStatus('rendered', true);
			ad.setStatus('ready', true);

			ad.setStatus('fetching', true);
			expect(callback).toHaveBeenCalledTimes(1);
		});
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

describe('findSmallestAdHeightForSlot', () => {
	it.each([
		['inline', 'desktop', 250],
		['inline', 'phablet', 197],
		['inline', 'tablet', 197],
		['inline', 'mobile', 197],
		['top-above-nav', 'desktop', 90],
		['top-above-nav', 'tablet', 90],
		['top-above-nav', 'phablet', 197],
		['top-above-nav', 'mobile', 197],
		['fronts-banner', 'mobile', null],
		['fronts-banner', 'tablet', 90],
		['fronts-banner', 'desktop', 250],
		['right', 'mobile', 250],
		['right', 'tablet', 250],
		['right', 'desktop', 250],
	] as const)(
		'should find the smallest size for %s slot at %s breakpoint',
		(slot, breakpoint, expected) => {
			expect(findSmallestAdHeightForSlot(slot, breakpoint)).toEqual(
				expected,
			);
		},
	);
});
