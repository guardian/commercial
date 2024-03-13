import { getConsentFor, onConsentChange } from '@guardian/libs';
import type { Callback } from '@guardian/libs';
import { _, a9 } from './a9';

const tcfv2WithConsentMock = (callback: Callback) =>
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

const CcpaWithConsentMock = (callback: Callback) =>
	callback({
		ccpa: { doNotSell: false },
		canTarget: true,
		framework: 'ccpa',
	});

jest.mock('define/Advert', () =>
	jest.fn().mockImplementation(() => ({ advert: jest.fn() })),
);

jest.mock('../slot-config', () => ({
	slots: jest.fn().mockImplementation(() => [
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

const mockOnConsentChange = (mfn: (callback: Callback) => void) =>
	(onConsentChange as jest.Mock).mockImplementation(mfn);

const mockGetConsentFor = (hasConsent: boolean) =>
	(getConsentFor as jest.Mock).mockReturnValueOnce(hasConsent);

beforeEach(() => {
	jest.resetModules();
	_.resetModule();
	window.apstag = {
		init: jest.fn(),
		fetchBids: jest.fn().mockImplementation(() => Promise.resolve([])),
		setDisplayBids: jest.fn(),
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

	it('should generate initialise A9 library when CCPA consent has been given', () => {
		mockOnConsentChange(CcpaWithConsentMock);
		mockGetConsentFor(true);
		a9.initialise();
		expect(window.apstag).toBeDefined();
		expect(window.apstag?.init).toHaveBeenCalled();
	});
});
