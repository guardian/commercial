import { getConsentFor, onConsentChange } from '@guardian/libs';
import type {
	OnConsentChangeCallback,
	USNATConsentState,
} from '@guardian/libs';
import { isUserInVariant } from '../../../experiments/ab';
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

jest.mock('experiments/ab', () => ({
	isUserInVariant: jest.fn(),
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

describe('Logging a9 bid response', () => {
	it('should add a9WinningBids if window.commercial is undefined', () => {
		mockOnConsentChange(tcfv2WithConsentMock);
		mockGetConsentFor(true);
		jest.mocked(isUserInVariant).mockReturnValueOnce(true);

		const adSizesArray = [300, 250];
		const adSizesString =
			`${adSizesArray[0]}x${adSizesArray[1]}` as `${number}x${number}`;

		const mockBidresponse = [
			{
				amznbid: 'string',
				amzniid: 'string',
				amznp: 'string',
				amznsz: {
					adSizes: adSizesString,
				},
				size: {
					adSizes: adSizesString,
				},
				slotID: 'string',
			},
		];

		window.guardian.commercial =
			undefined as typeof window.guardian.commercial;

		a9.logA9BidResponse(mockBidresponse);
		expect(window.guardian.commercial?.a9WinningBids).toEqual(
			mockBidresponse,
		);
	});
	it('should add a9WinningBids the window.commercial object on first bidResponse', () => {
		mockOnConsentChange(tcfv2WithConsentMock);
		mockGetConsentFor(true);
		jest.mocked(isUserInVariant).mockReturnValueOnce(true);

		const adSizesArray = [300, 250];
		const adSizesString =
			`${adSizesArray[0]}x${adSizesArray[1]}` as `${number}x${number}`;

		const mockBidresponse = [
			{
				amznbid: 'string',
				amzniid: 'string',
				amznp: 'string',
				amznsz: {
					adSizes: adSizesString,
				},
				size: {
					adSizes: adSizesString,
				},
				slotID: 'string',
			},
		];

		window.guardian.commercial = {
			a9WinningBids: [],
		} as typeof window.guardian.commercial;

		a9.logA9BidResponse(mockBidresponse);
		expect(window.guardian.commercial?.a9WinningBids).toEqual(
			mockBidresponse,
		);
	});
	it('should add another bidResponse object to the a9WinningBids array, retaining previous item', () => {
		mockOnConsentChange(tcfv2WithConsentMock);
		mockGetConsentFor(true);
		jest.mocked(isUserInVariant).mockReturnValueOnce(true);

		const adSizesArray = [300, 250];
		const adSizesString =
			`${adSizesArray[0]}x${adSizesArray[1]}` as `${number}x${number}`;

		const mockBidresponse = [
			{
				amznbid: 'string',
				amzniid: 'string',
				amznp: 'string',
				amznsz: {
					adSizes: adSizesString,
				},
				size: {
					adSizes: adSizesString,
				},
				slotID: 'string',
			},
		];
		window.guardian.commercial = {
			a9WinningBids: [...mockBidresponse],
		} as typeof window.guardian.commercial;

		a9.logA9BidResponse(mockBidresponse);
		expect(window.guardian.commercial?.a9WinningBids?.length).toEqual(2);
		expect(window.guardian.commercial?.a9WinningBids).toMatchObject(
			expect.arrayContaining([...mockBidresponse, ...mockBidresponse]),
		);
	});
	it('should not add a9WinningBids to the window.commercial object if no bidResponse', () => {
		mockOnConsentChange(tcfv2WithConsentMock);
		mockGetConsentFor(true);
		const result = a9.logA9BidResponse([]);
		expect(result).toEqual(undefined);
	});
});
