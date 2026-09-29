import type {
	ConsentState,
	TCFv2ConsentState,
	USNATConsentState,
} from '@guardian/consent-manager';
import { getConsentFor, onConsent } from '@guardian/consent-manager';
import { log } from '@guardian/libs';
import { prebid } from '../../lib/header-bidding/prebid';
import { _ } from './prepare-prebid';

const { setupPrebid } = _;

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
	shouldLoadPrebid: () => true,
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

describe('init', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should initialise Prebid if the framework is TCFv2 ', async () => {
		expect.hasAssertions();

		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(prebid.initialise).toHaveBeenCalled();
	});

	it('should initialise Prebid in USNAT if doNotSell is false', async () => {
		expect.hasAssertions();

		mockOnConsent(usnatWithConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(prebid.initialise).toHaveBeenCalled();
	});

	it('should not initialise Prebid in USNAT if doNotSell is true', async () => {
		expect.assertions(2);

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

		mockOnConsent(ausWithConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(prebid.initialise).toHaveBeenCalled();
	});

	it('should not initialise Prebid in AUS if Advertising is rejected', async () => {
		expect.assertions(2);

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

		mockOnConsent(invalidWithoutConsent);
		mockGetConsentFor(true);

		await setupPrebid();
		expect(log).toHaveBeenCalledWith(
			'commercial',
			expect.stringContaining('Failed to execute prebid'),
			expect.stringContaining('Unknown consent framework'),
		);

		expect(prebid.initialise).not.toHaveBeenCalled();
	});
});
