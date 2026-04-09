import { getConsentFor, onConsent } from '@guardian/libs';
import type { ConsentState, USNATConsentState } from '@guardian/libs';
import { isAdFree } from '../../lib/ad-free';
import type { ThirdPartyTag } from '../../types/global';
import { _, initThirdPartyTags } from './third-party-tags';

jest.mock('@guardian/libs', () => ({
	...jest.requireActual<typeof import('@guardian/libs')>('@guardian/libs'),
	onConsent: jest.fn(),
	getConsentFor: jest.fn(),
}));

jest.mock('../../lib/ad-free', () => ({
	isAdFree: jest.fn(),
}));

const tcfv2AllConsent = {
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
		vendorConsents: { 100: true, 200: true, 300: true },
		eventStatus: 'tcloaded',
		addtlConsent: '',
		gdprApplies: true,
		tcString: 'blablabla',
	},
	canTarget: true,
	framework: 'tcfv2',
} as ConsentState;

const tcfv2WithConsent = {
	tcfv2: {
		consents: {
			1: true,
			2: false,
			3: false,
			4: false,
			5: false,
			6: false,
			7: true,
			8: true,
			9: false,
			10: false,
		},
		vendorConsents: { 100: true, 200: false, 300: false },
		eventStatus: 'tcloaded',
		addtlConsent: '',
		gdprApplies: true,
		tcString: 'blablabla',
	},
	canTarget: false,
	framework: 'tcfv2',
} as ConsentState;

const tcfv2WithoutConsent = {
	tcfv2: {
		consents: {
			1: false,
			2: false,
			3: false,
			4: false,
			5: false,
			6: false,
			7: false,
			8: false,
			9: false,
			10: false,
		},
		vendorConsents: { 100: false, 200: false, 300: false },
		eventStatus: 'tcloaded',
		addtlConsent: '',
		gdprApplies: true,
		tcString: 'blablabla',
	},
	canTarget: false,
	framework: 'tcfv2',
} as ConsentState;

const usnatConsent: USNATConsentState = {
	doNotSell: false,
	signalStatus: 'ready',
};

beforeEach(() => {
	const firstScript = document.createElement('script');
	document.body.appendChild(firstScript);
	expect.hasAssertions();
});

afterEach(() => {
	document.body.innerHTML = '';
});

jest.mock('lib/third-party-tags/imr-worldwide', () => ({
	imrWorldwide: {
		shouldRun: true,
		url: '//fakeThirdPartyTag.js',
		onLoad: jest.fn(),
	},
}));

const mockOnConsent = (consentState: ConsentState) =>
	(onConsent as jest.Mock).mockReturnValueOnce(Promise.resolve(consentState));

const mockGetConsentFor = (hasConsent: boolean) =>
	(getConsentFor as jest.Mock).mockReturnValueOnce(hasConsent);

describe('third party tags', () => {
	describe('canRunThirdPartyTags', () => {
		beforeEach(() => {
			jest.mocked(isAdFree).mockReturnValue(false);
			window.location.hash = '';
			window.guardian.config.page.contentType = '';
			window.guardian.config.page.section = '';
			window.guardian.config.page.pageId = '';
		});

		it('Does not run for ad free', () => {
			jest.mocked(isAdFree).mockReturnValue(true);
			expect(_.canRunThirdPartyTags()).toBe(false);
		});

		it('Does not run on identity content type', () => {
			window.guardian.config.page.contentType = 'Identity';
			expect(_.canRunThirdPartyTags()).toBe(false);
		});

		it('Does not run on identity section', () => {
			// This is needed for identity pages in the profile subdomain
			window.guardian.config.page.section = 'identity';
			expect(_.canRunThirdPartyTags()).toBe(false);
		});

		it('Does not run for #noads', () => {
			window.location.hash = '#noads';
			expect(_.canRunThirdPartyTags()).toBe(false);
		});

		it('Does not run on secure contact pages', () => {
			window.guardian.config.page.pageId =
				'help/ng-interactive/2017/mar/17/contact-the-guardian-securely';

			expect(_.canRunThirdPartyTags()).toBe(false);
		});
	});

	describe('initThirdPartyTags', () => {
		it('should not run if third party tags criteria not met', async () => {
			jest.mocked(isAdFree).mockReturnValue(true);

			await initThirdPartyTags().then((enabled) => {
				expect(enabled).toBe(false);
			});
		});

		it('should run if criteria met for running third party tags', async () => {
			jest.mocked(isAdFree).mockReturnValue(false);
			window.location.hash = '';
			window.guardian.config.page.contentType = '';
			window.guardian.config.page.section = '';
			window.guardian.config.page.pageId = '';

			await initThirdPartyTags().then((enabled) => {
				expect(enabled).toBe(true);
			});
		});
	});

	describe('insertScripts', () => {
		const fakeThirdPartyAdvertisingTag: ThirdPartyTag = {
			shouldRun: true,
			url: '//fakeThirdPartyAdvertisingTag.js',
			onLoad: jest.fn(),
			name: 'permutive',
		};
		const fakeThirdPartyAdvertisingTag2: ThirdPartyTag = {
			shouldRun: true,
			url: '//fakeThirdPartyAdvertisingTag2.js',
			onLoad: jest.fn(),
			name: 'inizio',
		};
		const fakeThirdPartyPerformanceTag: ThirdPartyTag = {
			shouldRun: true,
			url: '//fakeThirdPartyPerformanceTag.js',
			onLoad: jest.fn(),
			name: 'nielsen',
		};

		beforeEach(() => {
			fakeThirdPartyAdvertisingTag.loaded = undefined;
			fakeThirdPartyAdvertisingTag2.loaded = undefined;
			fakeThirdPartyPerformanceTag.loaded = undefined;
		});

		it('should add scripts to the document when TCFv2 consent has been given', async () => {
			mockOnConsent(tcfv2AllConsent);
			mockGetConsentFor(true);
			await _.insertScripts(
				[fakeThirdPartyAdvertisingTag],
				[fakeThirdPartyPerformanceTag],
			);
			expect(document.scripts.length).toBe(3);
		});

		it('should only add performance scripts to the document when TCFv2 consent has not been given', async () => {
			mockOnConsent(tcfv2WithoutConsent);
			mockGetConsentFor(false);
			await _.insertScripts(
				[fakeThirdPartyAdvertisingTag],
				[fakeThirdPartyPerformanceTag],
			);
			expect(document.scripts.length).toBe(2);
		});
		it('should add scripts to the document when USNAT consent has been given', async () => {
			mockOnConsent({
				usnat: usnatConsent,
				canTarget: true,
				framework: 'usnat',
			});
			mockGetConsentFor(true);
			await _.insertScripts(
				[fakeThirdPartyAdvertisingTag],
				[fakeThirdPartyPerformanceTag],
			);
			expect(document.scripts.length).toBe(3);
		});
		it('should only add performance scripts to the document when USNAT consent has not been given', async () => {
			mockOnConsent({
				canTarget: false,
				framework: 'usnat',
			});
			mockGetConsentFor(false);
			await _.insertScripts(
				[fakeThirdPartyAdvertisingTag],
				[fakeThirdPartyPerformanceTag],
			);
			expect(document.scripts.length).toBe(2);
		});

		it('should only add consented custom vendors to the document for TCFv2', async () => {
			mockOnConsent(tcfv2WithConsent);
			mockGetConsentFor(true);
			mockGetConsentFor(false);
			await _.insertScripts(
				[fakeThirdPartyAdvertisingTag, fakeThirdPartyAdvertisingTag2],
				[],
			);
			expect(document.scripts.length).toBe(2);
		});

		it('should not add already loaded tags ', async () => {
			mockOnConsent(tcfv2WithConsent);
			mockGetConsentFor(true);
			mockGetConsentFor(false);
			mockOnConsent(tcfv2WithoutConsent);
			mockGetConsentFor(false);
			await _.insertScripts(
				[fakeThirdPartyAdvertisingTag, fakeThirdPartyAdvertisingTag2],
				[],
			);
			await _.insertScripts(
				[fakeThirdPartyAdvertisingTag, fakeThirdPartyAdvertisingTag2],
				[],
			);
			expect(document.scripts.length).toBe(2);
		});

		it('should not add scripts to the document when TCFv2 consent has not been given', async () => {
			mockOnConsent(tcfv2WithoutConsent);
			mockGetConsentFor(false);
			await _.insertScripts(
				[fakeThirdPartyAdvertisingTag, fakeThirdPartyAdvertisingTag2],
				[],
			);
			expect(document.scripts.length).toBe(1);
		});
	});
});
