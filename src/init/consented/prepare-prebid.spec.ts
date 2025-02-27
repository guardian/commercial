import type {
	ConsentState,
	TCFv2ConsentState,
	USNATConsentState,
} from '@guardian/libs';
import { getConsentFor, log, onConsent } from '@guardian/libs';
import { commercialFeatures } from '../../lib/commercial-features';
import { isInCanada } from '../../lib/geo/geo-utils';
import { prebid } from '../../lib/header-bidding/prebid/prebid';
import { allTcfPrebidVendorsConsented } from '../../lib/header-bidding/utils';
import { _ } from './prepare-prebid';

const { setupPrebid } = _;

jest.mock('lib/geo/geo-utils', () => ({
	isInCanada: jest.fn(() => false),
}));

jest.mock('experiments/ab', () => ({
	isInABTestSynchronous: jest.fn().mockReturnValue(false),
	isInVariantSynchronous: jest.fn().mockReturnValue(false),
	isUserInVariant: jest.fn().mockReturnValue(false),
}));

jest.mock('lib/commercial-features', () => ({
	commercialFeatures: {},
}));

jest.mock('lib/header-bidding/prebid/prebid', () => ({
	prebid: {
		initialise: jest.fn(),
	},
}));

jest.mock('define/Advert', () =>
	jest.fn().mockImplementation(() => ({ advert: jest.fn() })),
);

jest.mock('lib/page-targeting', () => ({
	getPageTargeting: jest.fn(),
}));

jest.mock('lib/header-bidding/prebid/bid-config', () => ({
	isInVariant: jest.fn(),
}));

jest.mock('lib/header-bidding/utils', () => ({
	...jest.requireActual('lib/header-bidding/utils'),
	allTcfPrebidVendorsConsented: jest.fn().mockReturnValue(true),
	shouldIncludeOnlyA9: false,
}));

jest.mock('@guardian/libs', () => ({
	log: jest.fn(),
	onConsent: jest.fn(),
	getConsentFor: jest.fn(),
}));

const mockOnConsent = (consentState: ConsentState) =>
	(onConsent as jest.Mock).mockReturnValueOnce(Promise.resolve(consentState));

const mockGetConsentFor = (hasConsent: boolean) =>
	(getConsentFor as jest.Mock)
		.mockReturnValueOnce(hasConsent)
		.mockReturnValueOnce(hasConsent);

const mockGetConsentForWithCustom = (
	hasGlobalVendorConsent: boolean,
	hasCustomVendorConsent: boolean,
) =>
	(getConsentFor as jest.Mock)
		.mockReturnValueOnce(hasGlobalVendorConsent)
		.mockReturnValueOnce(hasCustomVendorConsent);

const defaultTCFv2State: TCFv2ConsentState = {
	consents: { 1: false },
	eventStatus: 'tcloaded',
	vendorConsents: { abc: false },
	addtlConsent: 'xyz',
	gdprApplies: true,
	tcString: 'YAAA',
};

const tcfv2WithConsent = {
	tcfv2: {
		...defaultTCFv2State,
		vendorConsents: { '5f92a62aa22863685f4daa4c': true },
	},
	canTarget: true,
	framework: 'tcfv2',
} as ConsentState;

const tcfv2WithoutConsent = {
	tcfv2: {
		...defaultTCFv2State,
		vendorConsents: { '5f92a62aa22863685f4daa4c': false },
	},
	canTarget: false,
	framework: 'tcfv2',
} as ConsentState;

const usnatConsent: USNATConsentState = {
	doNotSell: false,
	signalStatus: 'ready',
};

const usnatNonConsent: USNATConsentState = {
	doNotSell: true,
	signalStatus: 'ready',
};

const usnatWithConsent = {
	usnat: usnatConsent,
	canTarget: true,
	framework: 'usnat',
} as ConsentState;

const usnatWithoutConsent = {
	usnat: usnatNonConsent,
	canTarget: false,
	framework: 'usnat',
} as ConsentState;

const ausWithConsent = {
	aus: { personalisedAdvertising: true },
	canTarget: true,
	framework: 'aus',
} as ConsentState;

const ausWithoutConsent = {
	aus: { personalisedAdvertising: false },
	canTarget: false,
	framework: 'aus',
} as ConsentState;

const invalidWithoutConsent = {
	canTarget: false,
	framework: null,
} as ConsentState;

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

	it('should initialise Prebid when Prebid switch is ON and advertising is on and ad-free is off', async () => {
		expect.hasAssertions();
		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);
		(allTcfPrebidVendorsConsented as jest.Mock).mockReturnValue(true);

		await setupPrebid();
		expect(prebid.initialise).toHaveBeenCalled();
	});

	it('should not initialise Prebid when useragent is Google Web Preview', async () => {
		expect.hasAssertions();
		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		fakeUserAgent('Google Web Preview');
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);
		(allTcfPrebidVendorsConsented as jest.Mock).mockReturnValue(true);

		await setupPrebid();
		expect(prebid.initialise).not.toHaveBeenCalled();
	});

	it('should not initialise Prebid when no header bidding switches are on', async () => {
		expect.hasAssertions();

		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		window.guardian.config.switches = {
			prebidHeaderBidding: false,
		};
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);
		(allTcfPrebidVendorsConsented as jest.Mock).mockReturnValue(true);

		await setupPrebid();
		expect(prebid.initialise).not.toHaveBeenCalled();
	});

	it('should initialise Prebid when NOT in Canada', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);
		(allTcfPrebidVendorsConsented as jest.Mock).mockReturnValue(true);

		await setupPrebid();
		expect(prebid.initialise).toHaveBeenCalled();
	});

	it('should NOT initialise Prebid when in Canada', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);
		(isInCanada as jest.Mock).mockReturnValueOnce(true);

		await setupPrebid();
		expect(prebid.initialise).not.toHaveBeenCalled();
	});

	it('should not initialise Prebid when advertising is switched off', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = false;
		commercialFeatures.adFree = false;
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(prebid.initialise).not.toHaveBeenCalled();
	});

	it('should not initialise Prebid when ad-free is on', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = true;
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(prebid.initialise).not.toHaveBeenCalled();
	});

	it('should not initialise Prebid if shouldIncludeOnlyA9 is true', async () => {
		jest.mock('lib/header-bidding/utils', () => ({
			...jest.requireActual('lib/header-bidding/utils'),
			allTcfPrebidVendorsConsented: jest.fn().mockReturnValue(true),
			shouldIncludeOnlyA9: true,
		}));

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;

		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(prebid.initialise).not.toHaveBeenCalled();
	});

	it('should not initialise Prebid if allTcfPrebidVendorsConsented is false', async () => {
		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		(allTcfPrebidVendorsConsented as jest.Mock).mockReturnValue(false);

		await setupPrebid();
		expect(prebid.initialise).not.toHaveBeenCalled();
	});

	it('should not initialise Prebid when the page has a pageskin', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		window.guardian.config.page.hasPageSkin = true;
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);
		(allTcfPrebidVendorsConsented as jest.Mock).mockReturnValue(true);

		await setupPrebid();
		expect(prebid.initialise).not.toHaveBeenCalled();
	});

	it('should initialise Prebid when the page has no pageskin', async () => {
		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		window.guardian.config.page.hasPageSkin = false;
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);
		(allTcfPrebidVendorsConsented as jest.Mock).mockReturnValue(true);

		await setupPrebid();
		expect(prebid.initialise).toHaveBeenCalled();
	});

	it('should initialise Prebid if TCFv2 consent with correct Sourcepoint Id is true', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);
		(allTcfPrebidVendorsConsented as jest.Mock).mockReturnValue(true);

		await setupPrebid();
		expect(prebid.initialise).toHaveBeenCalled();
	});

	it('should not initialise Prebid if TCFv2 consent with correct Sourcepoint Id is false', async () => {
		expect.assertions(2);

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		mockOnConsent(tcfv2WithoutConsent);
		mockGetConsentFor(false);
		(allTcfPrebidVendorsConsented as jest.Mock).mockReturnValue(true);

		await setupPrebid();
		expect(log).toHaveBeenCalledWith(
			'commercial',
			expect.stringContaining('Failed to execute prebid'),
			expect.stringContaining('No consent for prebid'),
		);

		expect(prebid.initialise).not.toHaveBeenCalled();
	});

	it('should initialise Prebid in USNAT if doNotSell is false', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		mockOnConsent(usnatWithConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(prebid.initialise).toHaveBeenCalled();
	});

	it('should not initialise Prebid in USNAT if doNotSell is true', async () => {
		expect.assertions(2);

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		mockOnConsent(usnatWithoutConsent);
		mockGetConsentFor(false);

		await setupPrebid();
		expect(log).toHaveBeenCalledWith(
			'commercial',
			expect.stringContaining('Failed to execute prebid'),
			expect.stringContaining('No consent for prebid'),
		);

		expect(prebid.initialise).not.toHaveBeenCalled();
	});

	it('should initialise Prebid in AUS if Advertising is not rejected', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		mockOnConsent(ausWithConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(prebid.initialise).toHaveBeenCalled();
	});

	it('should not initialise Prebid in AUS if Advertising is rejected', async () => {
		expect.assertions(2);

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		mockOnConsent(ausWithoutConsent);
		mockGetConsentFor(false);

		await setupPrebid();
		expect(log).toHaveBeenCalledWith(
			'commercial',
			expect.stringContaining('Failed to execute prebid'),
			expect.stringContaining('No consent for prebid'),
		);

		expect(prebid.initialise).not.toHaveBeenCalled();
	});

	it('should not initialise Prebid if the framework is invalid', async () => {
		expect.assertions(2);

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		mockOnConsent(invalidWithoutConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(log).toHaveBeenCalledWith(
			'commercial',
			expect.stringContaining('Failed to execute prebid'),
			expect.stringContaining('Unknown framework'),
		);

		expect(prebid.initialise).not.toHaveBeenCalled();
	});

	it('should initialise Prebid in TCF when global vendor has consent and custom vendor does not', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentForWithCustom(true, false);
		(allTcfPrebidVendorsConsented as jest.Mock).mockReturnValue(true);

		await setupPrebid();
		expect(prebid.initialise).toHaveBeenCalled();
	});

	it('should initialise Prebid in TCF when global vendor does not have consent but the custom vendor does', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentForWithCustom(false, true);
		(allTcfPrebidVendorsConsented as jest.Mock).mockReturnValue(true);

		await setupPrebid();
		expect(prebid.initialise).toHaveBeenCalled();
	});

	it('should NOT initialise Prebid in TCF when BOTH the global vendor AND custom vendor do NOT have consent', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		commercialFeatures.shouldLoadGoogletag = true;
		commercialFeatures.adFree = false;
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentForWithCustom(false, false);
		(allTcfPrebidVendorsConsented as jest.Mock).mockReturnValue(true);

		await setupPrebid();
		expect(log).toHaveBeenCalledWith(
			'commercial',
			expect.stringContaining('Failed to execute prebid'),
			expect.stringContaining('No consent for prebid'),
		);

		expect(prebid.initialise).not.toHaveBeenCalled();
	});
});
