import { isInCanada } from '@guardian/commercial-core/geo/geo-utils';
import type {
	ConsentState,
	TCFv2ConsentState,
	USNATConsentState,
} from '@guardian/consent-manager';
import { getConsentFor, onConsent } from '@guardian/consent-manager';
import { log } from '@guardian/libs';
import { isAdFree } from '../../lib/ad-free';
import { prebid } from '../../lib/header-bidding/prebid';
import { shouldLoadAds } from '../../lib/should-load-ads';
import { _ } from './prepare-prebid';

const { setupPrebid } = _;

jest.mock('@guardian/commercial-core/geo/geo-utils', () => ({
	isInCanada: jest.fn(() => false),
}));

jest.mock('lib/ad-free', () => ({
	isAdFree: jest.fn(),
}));

jest.mock('lib/should-load-ads', () => ({
	shouldLoadAds: jest.fn(),
}));

jest.mock('lib/header-bidding/prebid', () => ({
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

jest.mock('lib/header-bidding/prebid/bidders/config', () => ({
	isInVariant: jest.fn(),
}));

jest.mock('lib/header-bidding/utils', () => ({
	shouldIncludeOnlyA9: false,
}));

jest.mock('@guardian/libs', () => ({
	log: jest.fn(),
}));

jest.mock('@guardian/consent-manager', () => ({
	onConsent: jest.fn(),
	getConsentFor: jest.fn(),
}));

const mockOnConsent = (consentState: ConsentState) =>
	(onConsent as jest.Mock).mockReturnValueOnce(Promise.resolve(consentState));

const mockGetConsentFor = (hasConsent: boolean) =>
	(getConsentFor as jest.Mock)
		.mockReturnValueOnce(hasConsent)
		.mockReturnValueOnce(hasConsent);

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
	},
	canTarget: true,
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
		jest.mocked(isAdFree).mockReturnValue(false);
		jest.mocked(shouldLoadAds).mockReturnValue(true);
		fakeUserAgent();
		window.guardian.config.switches = {};
	});

	it('should initialise Prebid when Prebid switch is ON and advertising is on and ad-free is off', async () => {
		expect.hasAssertions();
		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(prebid.initialise).toHaveBeenCalled();
	});

	it('should not initialise Prebid when useragent is Google Web Preview', async () => {
		expect.hasAssertions();
		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		fakeUserAgent('Google Web Preview');
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(prebid.initialise).not.toHaveBeenCalled();
	});

	it('should not initialise Prebid when no header bidding switches are on', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: false,
		};
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(prebid.initialise).not.toHaveBeenCalled();
	});

	it('should initialise Prebid when NOT in Canada', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(prebid.initialise).toHaveBeenCalled();
	});

	it('should NOT initialise Prebid when in Canada', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
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
		// (shouldLoadAds as jest.Mock).mockReturnValue(false);
		jest.mocked(shouldLoadAds).mockReturnValue(false);
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
		jest.mocked(isAdFree).mockReturnValue(true);
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(prebid.initialise).not.toHaveBeenCalled();
	});

	it('should not initialise Prebid when the page has a pageskin', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		window.guardian.config.page.hasPageSkin = true;
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(prebid.initialise).not.toHaveBeenCalled();
	});

	it('should initialise Prebid when the page has no pageskin', async () => {
		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		window.guardian.config.page.hasPageSkin = false;
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(prebid.initialise).toHaveBeenCalled();
	});

	it('should initialise Prebid if the framework is TCFv2 ', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(prebid.initialise).toHaveBeenCalled();
	});

	it('should initialise Prebid in USNAT if doNotSell is false', async () => {
		expect.hasAssertions();

		window.guardian.config.switches = {
			prebidHeaderBidding: true,
		};
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
});
