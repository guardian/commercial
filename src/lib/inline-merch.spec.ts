import { isInVariantSynchronous } from './experiments/ab';
import { shouldAddInlineMerchAd } from './inline-merch';

jest.mock('lib/experiments/ab', () => ({
	isInVariantSynchronous: jest.fn(),
}));

afterEach(() => {
	jest.clearAllMocks();
});

describe('shouldAddInlineMerchAd', () => {
	it('returns false when in the variant and page is not eligible', () => {
		(isInVariantSynchronous as jest.Mock).mockReturnValue(true);
		window.guardian.config.page.hasInlineMerchandise = false;
		expect(shouldAddInlineMerchAd()).toBe(false);
	});

	it('returns false when not in the variant and page is not eligible', () => {
		(isInVariantSynchronous as jest.Mock).mockReturnValue(false);
		window.guardian.config.page.hasInlineMerchandise = false;
		expect(shouldAddInlineMerchAd()).toBe(false);
	});

	it('returns true when not in the variant and page is eligible', () => {
		(isInVariantSynchronous as jest.Mock).mockReturnValue(false);
		window.guardian.config.page.hasInlineMerchandise = true;
		expect(shouldAddInlineMerchAd()).toBe(true);
	});

	it('returns false when in the variant and the page is eligible', () => {
		(isInVariantSynchronous as jest.Mock).mockReturnValue(true);
		window.guardian.config.page.hasInlineMerchandise = true;
		expect(shouldAddInlineMerchAd()).toBe(false);
	});
});
