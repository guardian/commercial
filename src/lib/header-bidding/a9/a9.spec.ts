import { getConsentFor, onConsentChange } from '@guardian/libs';
import type {
	OnConsentChangeCallback,
	USNATConsentState,
} from '@guardian/libs';
import type { A9AdUnitInterface } from '../../../types/global';
import { _, a9 } from './a9';

const tcfv2WithConsentMock = (callback: OnConsentChangeCallback) =>
	callback({
		tcfv2: {
			consents: {
				1: true,
				2: true,
				3: true,
				4: true,
				5: true,
				6: true,
				7: true,
				8: true,
				9: true,
				10: true,
			},
			vendorConsents: { '5edf9a821dc4e95986b66df4': true },
			eventStatus: 'tcloaded',
			addtlConsent: '',
			gdprApplies: true,
			tcString: 'blablabla',
		},
		canTarget: true,
		framework: 'tcfv2',
	});

const usnatConsent: USNATConsentState = {
	doNotSell: false,
	signalStatus: 'ready',
};

const usnatWithConsentMock = (callback: OnConsentChangeCallback) =>
	callback({
		usnat: usnatConsent,
		canTarget: true,
		framework: 'usnat',
	});

jest.mock('define/Advert', () =>
	jest.fn().mockImplementation(() => ({ advert: jest.fn() })),
);

jest.mock('../slot-config', () => ({
	getHeaderBiddingAdSlots: jest.fn().mockImplementation(() => [
		{
			key: 'top-above-nav',
			sizes: [
				[970, 250],
				[728, 90],
			],
		},
	]),
}));

jest.mock('@guardian/libs', () => ({
	// eslint-disable-next-line -- ESLint doesn't understand jest.requireActual
	...jest.requireActual<typeof import('@guardian/libs')>('@guardian/libs'),
	log: jest.fn(),
	getConsentFor: jest.fn(),
	onConsentChange: jest.fn(),
}));

const mockOnConsentChange = (
	mfn: (callback: OnConsentChangeCallback) => void,
) => (onConsentChange as jest.Mock).mockImplementation(mfn);

const mockGetConsentFor = (hasConsent: boolean) =>
	(getConsentFor as jest.Mock).mockReturnValueOnce(hasConsent);

beforeEach(() => {
	jest.resetModules();
	_.resetModule();
	window.apstag = {
		init: jest.fn(),
		fetchBids: jest.fn().mockImplementation(() => Promise.resolve([])),
		setDisplayBids: jest.fn(),
		blockedBidders: [],
	};
});

afterAll(() => {
	jest.resetAllMocks();
});

describe('initialise', () => {
	it('should generate initialise A9 library when TCFv2 consent has been given', () => {
		mockOnConsentChange(tcfv2WithConsentMock);
		mockGetConsentFor(true);
		a9.initialise();
		expect(window.apstag).toBeDefined();
		expect(window.apstag?.init).toHaveBeenCalled();
	});

	it('should generate initialise A9 library when USNAT consent has been given', () => {
		mockOnConsentChange(usnatWithConsentMock);
		mockGetConsentFor(true);
		a9.initialise();
		expect(window.apstag).toBeDefined();
		expect(window.apstag?.init).toHaveBeenCalled();
	});
});

describe('shouldBlockGumGum', () => {
	beforeEach(() => {
		window.guardian.config.page.section = '';
		window.guardian.config.page.isFront = false;
	});

	it('should NOT block GumGum for "dfp-ad--inline1--mobile" on a network front', () => {
		window.guardian.config.page.section = 'us';
		window.guardian.config.page.isFront = true;

		const mockAdUnit: A9AdUnitInterface = {
			slotID: 'dfp-ad--inline1--mobile',
			sizes: [],
			blockedBidders: [],
		};
		const result = a9.shouldBlockGumGum(mockAdUnit);
		expect(result).toBe(false);
	});
	it('should NOT block GumGum for "dfp-ad--top-above-nav" on a section front', () => {
		window.guardian.config.page.section = 'sport';
		window.guardian.config.page.isFront = true;

		const mockAdUnit: A9AdUnitInterface = {
			slotID: 'dfp-ad--top-above-nav',
			sizes: [],
			blockedBidders: [],
		};
		const result = a9.shouldBlockGumGum(mockAdUnit);
		expect(result).toBe(false);
	});
	it('should block GumGum for an unrecognized slot on a network front', () => {
		window.guardian.config.page.section = 'uk';
		window.guardian.config.page.isFront = true;

		const mockAdUnit: A9AdUnitInterface = {
			slotID: 'dfp-ad--inline4--mobile',
			sizes: [],
			blockedBidders: [],
		};
		const result = a9.shouldBlockGumGum(mockAdUnit);
		expect(result).toBe(true);
	});
	it('should block GumGum for an unrecognized slot on a section front', () => {
		window.guardian.config.page.section = 'culture';
		window.guardian.config.page.isFront = true;

		const mockAdUnit: A9AdUnitInterface = {
			slotID: 'dfp-ad--mostpop',
			sizes: [],
			blockedBidders: [],
		};
		const result = a9.shouldBlockGumGum(mockAdUnit);
		expect(result).toBe(true);
	});
	it('should block GumGum for any slot when not on a front page', () => {
		window.guardian.config.page.section = 'lifeandstyle';
		window.guardian.config.page.isFront = false;

		const mockAdUnit: A9AdUnitInterface = {
			slotID: 'dfp-ad--inline1--mobile',
			sizes: [],
			blockedBidders: [],
		};
		const result = a9.shouldBlockGumGum(mockAdUnit);
		expect(result).toBe(false);
	});
});
