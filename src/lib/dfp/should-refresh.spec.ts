import { Advert } from '../../define/Advert';
import { adSizes, createAdSize } from '../../lib/ad-sizes';
import { shouldRefresh } from './should-refresh';

const outstreamSizes = [
	adSizes.outstreamDesktop.toString(),
	adSizes.outstreamMobile.toString(),
	adSizes.outstreamGoogleDesktop.toString(),
];

jest.mock('define/init-slot-ias', () => ({
	initSlotIas: jest.fn(() => Promise.resolve()),
}));

jest.mock('lib/targeting/teads-eligibility', () => ({
	isEligibleForTeads: jest.fn(),
}));

describe('shouldRefresh', () => {
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
			getTargeting: jest.fn(() => []),
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

		// @ts-expect-error -- it's a partial for a mock
		window.guardian.config.page = {};
	});

	it('should return false for fluid ads', () => {
		const slot = document.createElement('div');
		slot.setAttribute('data-name', 'inline');
		const advert = new Advert(slot);
		advert.size = createAdSize(0, 0);
		const result = shouldRefresh(advert);
		expect(result).toBe(false);
	});

	it('should return true for non-fluid ads', () => {
		const slot = document.createElement('div');
		slot.setAttribute('data-name', 'inline');
		const advert = new Advert(slot);
		advert.size = adSizes.halfPage;
		const result = shouldRefresh(advert);
		expect(result).toBe(true);
	});

	outstreamSizes.forEach((size) => {
		it(`should return false for outstream ${size}`, () => {
			const slot = document.createElement('div');
			slot.setAttribute('data-name', 'inline');
			const advert = new Advert(slot);
			const [width, height] = size.split(',');
			advert.size = createAdSize(Number(width), Number(height));
			const result = shouldRefresh(advert);
			expect(result).toBe(false);
		});
	});

	it('if config.hasPageSkin is true ads should not refresh', () => {
		window.guardian.config.page.hasPageSkin = true;

		const slot = document.createElement('div');
		slot.setAttribute('data-name', 'inline');
		const advert = new Advert(slot);
		advert.size = adSizes.halfPage;
		const result = shouldRefresh(advert);
		expect(result).toBe(false);
	});

	it('if the line item id is in nonRefreshableLineItemIds should not refresh', () => {
		const slot = document.createElement('div');
		slot.setAttribute('data-name', 'inline');
		const advert = new Advert(slot);
		advert.size = adSizes.halfPage;
		advert.lineItemId = 123;
		const result = shouldRefresh(advert, [123]);
		expect(result).toBe(false);
	});
});
