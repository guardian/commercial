import { commercialFeatures } from 'lib/commercial-features';
import { isInCanada } from 'utils/geo-utils';
import { a9 } from '../../lib/header-bidding/a9/a9';
import { _ } from './prepare-a9';

const { setupA9 } = _;

jest.mock('utils/geo-utils', () => ({
	isInCanada: jest.fn(() => false),
}));

jest.mock('experiments/ab', () => ({
	isInABTestSynchronous: jest.fn().mockReturnValue(false),
	isInVariantSynchronous: jest.fn().mockReturnValue(false),
}));

jest.mock('lib/commercial-features', () => ({
	commercialFeatures: {},
}));

jest.mock('lib/header-bidding/a9/a9');

jest.mock('define/Advert');

jest.mock('core/__vendor/a9-apstag', () => ({
	a9Apstag: jest.fn(),
}));

jest.mock('lib/build-page-targeting');

jest.mock('lib/header-bidding/prebid/bid-config');

jest.mock('lib/header-bidding/utils', () => ({
	isInUsRegion: () => true,
}));

jest.mock('@guardian/libs');

jest.mock('@guardian/libs');

const originalUA = navigator.userAgent;
const fakeUserAgent = (userAgent?: string) => {
	Object.defineProperty(navigator, 'userAgent', {
		get: () => userAgent ?? originalUA,
		configurable: true,
	});
};

describe('init', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		fakeUserAgent();
		window.guardian.config.switches = {};
	});

	afterAll(() => {
		jest.clearAllMocks();
	});

	it('should initialise A9 when A9 switch is ON and advertising is on and ad-free is off', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;

		await setupA9();

		expect(a9.initialise).toBeCalled();
	});

	it('should NOT initialise A9 when in Canada', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		(isInCanada as jest.Mock).mockReturnValueOnce(true);

		await setupA9();

		expect(a9.initialise).not.toBeCalled();
	});

	it('should initialise A9 when both prebid and a9 switches are ON and advertising is on and ad-free is off', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		await setupA9();
		expect(a9.initialise).toBeCalled();
	});

	it('should not initialise A9 when useragent is Google Web Preview', async () => {
		fakeUserAgent('Google Web Preview');
		await setupA9();
		expect(a9.initialise).not.toBeCalled();
	});

	it('should not initialise A9 when no external demand', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: false,
		};
		await setupA9();
		expect(a9.initialise).not.toBeCalled();
	});

	it('should not initialise a9 when advertising is switched off', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = false;
		commercialFeatures.adFree = false;
		await setupA9();
		expect(a9.initialise).not.toBeCalled();
	});

	it('should not initialise a9 when ad-free is on', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = true;
		await setupA9();
		expect(a9.initialise).not.toBeCalled();
	});

	it('should not initialise a9 when the page has a pageskin', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		window.guardian.config.page.hasPageSkin = true;
		await setupA9();
		expect(a9.initialise).not.toBeCalled();
	});

	it('should initialise a9 when the page has no pageskin', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		window.guardian.config.page.hasPageSkin = false;
		await setupA9();
		expect(a9.initialise).toBeCalled();
	});

	it('should not initialise a9 on the secure contact pages', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		commercialFeatures.isSecureContact = true;
		await setupA9();
		expect(a9.initialise).not.toBeCalled();
	});
});
