import type {
	ConsentState,
	TCFv2ConsentState,
	USNATConsentState,
} from '@guardian/libs';
import { getConsentFor, loadScript, onConsent } from '@guardian/libs';
import { commercialFeatures } from '../../lib/commercial-features';
import { _ } from './comscore';

const { setupComscore } = _;

const SOURCEPOINT_ID = '5efefe25b8e05c06542b2a77';

const defaultTCFv2State = {
	consents: { 1: false },
	eventStatus: 'tcloaded',
	vendorConsents: { abc: false },
	addtlConsent: 'xyz',
	gdprApplies: true,
	tcString: 'YAAA',
} as TCFv2ConsentState;

const usnatConsent: USNATConsentState = {
	doNotSell: false,
	signalStatus: 'ready',
};

const usnatNonConsent: USNATConsentState = {
	doNotSell: true,
	signalStatus: 'ready',
};

const tcfv2WithConsent = {
	tcfv2: {
		...defaultTCFv2State,
		vendorConsents: {
			[SOURCEPOINT_ID]: true,
		},
	},
	canTarget: true,
	framework: 'tcfv2',
} as ConsentState;

const tcfv2WithoutConsent = {
	tcfv2: {
		...defaultTCFv2State,
		vendorConsents: {
			[SOURCEPOINT_ID]: false,
		},
	},
	canTarget: false,
	framework: 'tcfv2',
} as ConsentState;

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

const AusWithoutConsent = {
	aus: {
		personalisedAdvertising: false,
	},
	canTarget: true,
	framework: 'aus',
} as ConsentState;

const AusWithConsent = {
	aus: {
		personalisedAdvertising: true,
	},
	canTarget: false,
	framework: 'aus',
} as ConsentState;

jest.mock('@guardian/libs', () => ({
	loadScript: jest.fn(() => Promise.resolve()),
	log: jest.fn(),
	onConsent: jest.fn(),
	getConsentFor: jest.fn(),
}));

jest.mock('lib/commercial-features', () => ({
	commercialFeatures: {
		comscore: true,
	},
}));

const mockOnConsent = (consentState: ConsentState) =>
	(onConsent as jest.Mock).mockReturnValueOnce(Promise.resolve(consentState));

const mockGetConsentFor = (hasConsent: boolean) =>
	(getConsentFor as jest.Mock).mockReturnValueOnce(hasConsent);

describe('setupComscore', () => {
	it('should do nothing if the comscore is disabled in commercial features', async () => {
		commercialFeatures.comscore = false;
		await setupComscore();
		expect(onConsent).not.toHaveBeenCalled();
	});

	it('should register a callback with onConsentChange if enabled in commercial features', async () => {
		mockOnConsent(tcfv2WithConsent);
		commercialFeatures.comscore = true;
		await setupComscore();
		expect(onConsent).toHaveBeenCalled();
	});

	describe('Framework consent: running on consent', () => {
		beforeEach(() => {
			jest.resetAllMocks();
		});

		it('TCFv2 with consent: runs', async () => {
			mockOnConsent(tcfv2WithConsent);
			mockGetConsentFor(true);
			await setupComscore();
			expect(loadScript).toHaveBeenCalled();
		});

		it('TCFv2 without consent: does not run', async () => {
			mockOnConsent(tcfv2WithoutConsent);
			mockGetConsentFor(false);
			await setupComscore();
			expect(loadScript).not.toHaveBeenCalled();
		});
		it('USNAT with consent: runs', async () => {
			mockOnConsent(usnatWithConsent);
			await setupComscore();
			expect(loadScript).toHaveBeenCalled();
		});

		it('USNAT without consent: does not run', async () => {
			mockOnConsent(usnatWithoutConsent);
			await setupComscore();
			expect(loadScript).not.toHaveBeenCalled();
		});

		it('Aus without consent: runs', async () => {
			mockOnConsent(AusWithoutConsent);
			await setupComscore();
			expect(loadScript).toHaveBeenCalled();
		});

		it('Aus with consent: runs', async () => {
			mockOnConsent(AusWithConsent);
			await setupComscore();
			expect(loadScript).toHaveBeenCalled();
		});
	});
});

describe('comscore getGlobals', () => {
	it('return an object with the c1 and c2 properties correctly set when called with "Network Front" as keywords', () => {
		const expectedGlobals = { c1: _.comscoreC1, c2: _.comscoreC2 };
		expect(_.getGlobals('Network Front')).toMatchObject(expectedGlobals);
	});

	it('return an object with the c1 and c2 properties correctly set when called with non-"Network Front" as keywords', () => {
		const expectedGlobals = { c1: _.comscoreC1, c2: _.comscoreC2 };
		expect(_.getGlobals('')).toMatchObject(expectedGlobals);
	});

	it('returns an object with no comscorekw variable set when called with "Network Front" as keywords', () => {
		const comscoreGlobals = Object.keys(_.getGlobals('Network Front'));
		expect(comscoreGlobals).not.toContain('comscorekw');
	});

	it('returns an object with the correct comscorekw variable set when called with "Network Front" as keywords', () => {
		const keywords = 'These are the best keywords. The greatest!';

		expect(_.getGlobals(keywords)).toMatchObject({
			comscorekw: keywords,
		});
	});

	it('returns an object with the correct cs_ucfr variable set when calleed with consent sate as true', () => {
		expect(_.getGlobals('')).toMatchObject({
			cs_ucfr: '1',
		});
	});
});
