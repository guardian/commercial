import { _, a9 } from './a9';

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
		a9.initialise();
		expect(window.apstag).toBeDefined();
		expect(window.apstag?.init).toHaveBeenCalled();
	});

	it('should generate initialise A9 library when USNAT consent has been given', () => {
		a9.initialise();
		expect(window.apstag).toBeDefined();
		expect(window.apstag?.init).toHaveBeenCalled();
	});
});
