import { isInCanada } from '@guardian/commercial-core/geo/geo-utils';
import type {
	ConsentState,
	TCFv2ConsentState,
} from '@guardian/consent-manager';
import { onConsent } from '@guardian/consent-manager';
import { isAdFree } from '../../lib/ad-free';
import { a9 } from '../../lib/header-bidding/a9/a9';
import { isSecureContactPage } from '../../lib/is-secure-contact';
import { shouldLoadAds } from '../../lib/should-load-ads';
import { _ } from './prepare-a9';

const { setupA9 } = _;

jest.mock('@guardian/commercial-core/geo/geo-utils', () => ({
	isInCanada: jest.fn(() => false),
}));

jest.mock('lib/ad-free', () => ({
	isAdFree: jest.fn(),
}));

jest.mock('lib/should-load-ads', () => ({
	shouldLoadAds: jest.fn(),
}));

jest.mock('lib/is-secure-contact', () => ({
	isSecureContactPage: jest.fn(),
}));

jest.mock('lib/header-bidding/a9/a9');

jest.mock('define/Advert');

jest.mock('lib/__vendor/a9-apstag', () => ({
	a9Apstag: jest.fn(),
}));

jest.mock('lib/page-targeting');

jest.mock('lib/header-bidding/prebid/bidders/config');

jest.mock('@guardian/consent-manager');

const originalUA = navigator.userAgent;
const fakeUserAgent = (userAgent?: string) => {
	Object.defineProperty(navigator, 'userAgent', {
		get: () => userAgent ?? originalUA,
		configurable: true,
	});
};
const SOURCEPOINT_ID = '5f369a02b8e05c308701f829';

const defaultTCFv2State = {
	consents: { 1: false },
	eventStatus: 'tcloaded',
	vendorConsents: { abc: false },
	addtlConsent: 'xyz',
	gdprApplies: true,
	tcString: 'YAAA',
} as TCFv2ConsentState;

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

const mockOnConsent = (consentState: ConsentState) =>
	jest.mocked(onConsent).mockReturnValueOnce(Promise.resolve(consentState));

describe('prepareA9', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		fakeUserAgent();
		window.guardian.config.switches = {};
		jest.mocked(shouldLoadAds).mockReturnValue(true);
	});

	afterAll(() => {
		jest.clearAllMocks();
	});

	it('should not run if no consent for a9', async () => {
		mockOnConsent(tcfv2WithoutConsent);
		await setupA9();

		expect(a9.initialise).not.toHaveBeenCalled();
	});

	it('should initialise A9 when A9 switch is ON and advertising is on and ad-free is off', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: true,
		};
		jest.mocked(isAdFree).mockReturnValue(false);

		await setupA9();

		expect(a9.initialise).toHaveBeenCalled();
	});

	it('should NOT initialise A9 when in Canada', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: true,
		};
		jest.mocked(isAdFree).mockReturnValue(false);
		jest.mocked(isInCanada).mockReturnValueOnce(true);

		await setupA9();

		expect(a9.initialise).not.toHaveBeenCalled();
	});

	it('should initialise A9 when both prebid and a9 switches are ON and advertising is on and ad-free is off', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: true,
		};
		jest.mocked(isAdFree).mockReturnValue(false);
		await setupA9();
		expect(a9.initialise).toHaveBeenCalled();
	});

	it('should not initialise A9 when useragent is Google Web Preview', async () => {
		fakeUserAgent('Google Web Preview');
		await setupA9();
		expect(a9.initialise).not.toHaveBeenCalled();
	});

	it('should not initialise A9 when no external demand', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: false,
		};
		await setupA9();
		expect(a9.initialise).not.toHaveBeenCalled();
	});

	it('should not initialise a9 when advertising is switched off', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: true,
		};
		jest.mocked(shouldLoadAds).mockReturnValue(false);
		jest.mocked(isAdFree).mockReturnValue(false);
		await setupA9();
		expect(a9.initialise).not.toHaveBeenCalled();
	});

	it('should not initialise a9 when ad-free is on', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: true,
		};
		jest.mocked(isAdFree).mockReturnValue(true);

		await setupA9();
		expect(a9.initialise).not.toHaveBeenCalled();
	});

	it('should not initialise a9 when the page has a pageskin', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: true,
		};
		jest.mocked(isAdFree).mockReturnValue(false);
		window.guardian.config.page.hasPageSkin = true;
		await setupA9();
		expect(a9.initialise).not.toHaveBeenCalled();
	});

	it('should initialise a9 when the page has no pageskin', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: true,
		};
		jest.mocked(isAdFree).mockReturnValue(false);
		window.guardian.config.page.hasPageSkin = false;
		await setupA9();
		expect(a9.initialise).toHaveBeenCalled();
	});

	it('should not initialise a9 on the secure contact pages', async () => {
		window.guardian.config.switches = {
			a9HeaderBidding: true,
		};
		jest.mocked(isAdFree).mockReturnValue(false);
		jest.mocked(isSecureContactPage).mockReturnValue(true);

		await setupA9();
		expect(a9.initialise).not.toHaveBeenCalled();
	});
});
