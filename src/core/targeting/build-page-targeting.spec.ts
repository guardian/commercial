import { cmp as cmp_ } from '@guardian/consent-management-platform';
import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import type { TCFv2ConsentState } from '@guardian/consent-management-platform/dist/types/tcfv2';
import { setCookie, storage } from '@guardian/libs';
import { getAuthStatus as getAuthStatus_ } from 'identity/api';
import type { AuthStatus } from 'identity/api';
import { getLocale as getLocale_ } from '../lib/get-locale';
import type { Edition } from '../types';
import { buildPageTargeting } from './build-page-targeting';

const getLocale = getLocale_ as jest.MockedFunction<typeof getLocale_>;

const cmp = {
	hasInitialised: cmp_.hasInitialised as jest.MockedFunction<
		typeof cmp_.hasInitialised
	>,
	willShowPrivacyMessageSync:
		cmp_.willShowPrivacyMessageSync as jest.MockedFunction<
			typeof cmp_.willShowPrivacyMessageSync
		>,
};

jest.mock('core/lib/get-locale', () => ({
	getLocale: jest.fn(),
}));

jest.mock('@guardian/consent-management-platform', () => ({
	cmp: {
		hasInitialised: jest.fn(),
		willShowPrivacyMessageSync: jest.fn(),
	},
}));

jest.mock('identity/api', () => ({
	isUserLoggedInOktaRefactor: () => true,
	getAuthStatus: jest.fn(),
	getOptionsHeadersWithOkta: jest.fn(),
}));

const getAuthStatus = getAuthStatus_ as jest.MockedFunction<
	typeof getAuthStatus_
>;

const mockViewport = (width: number, height: number): void => {
	Object.defineProperties(window, {
		innerWidth: {
			value: width,
		},
		innerHeight: {
			value: height,
		},
	});
};

// CCPA
const ccpaWithConsentMock: ConsentState = {
	ccpa: { doNotSell: false },
	canTarget: true,
	framework: 'ccpa',
};

const ccpaWithoutConsentMock: ConsentState = {
	ccpa: { doNotSell: true },
	canTarget: false,
	framework: 'ccpa',
};

// AUS
const ausWithConsentMock: ConsentState = {
	aus: { personalisedAdvertising: true },
	canTarget: true,
	framework: 'aus',
};

const ausWithoutConsentMock: ConsentState = {
	aus: { personalisedAdvertising: false },
	canTarget: false,
	framework: 'aus',
};

// TCFv2
const defaultState: TCFv2ConsentState = {
	consents: { 1: false },
	eventStatus: 'tcloaded',
	vendorConsents: { abc: false },
	addtlConsent: 'xyz',
	gdprApplies: true,
	tcString: 'YAAA',
};

const tcfv2WithConsentMock: ConsentState = {
	tcfv2: {
		...defaultState,
		consents: { '1': true, '2': true },
		eventStatus: 'useractioncomplete',
	},
	canTarget: true,
	framework: 'tcfv2',
};

const tcfv2WithoutConsentMock: ConsentState = {
	tcfv2: { ...defaultState, consents: {}, eventStatus: 'cmpuishown' },
	canTarget: false,
	framework: 'tcfv2',
};

const tcfv2NullConsentMock: ConsentState = {
	tcfv2: undefined,
	canTarget: false,
	framework: 'tcfv2',
};

const tcfv2MixedConsentMock: ConsentState = {
	tcfv2: {
		...defaultState,
		consents: { '1': false, '2': true },
		eventStatus: 'useractioncomplete',
	},
	canTarget: false,
	framework: 'tcfv2',
};

const emptyConsent: ConsentState = {
	canTarget: false,
	framework: null,
};

describe('Build Page Targeting', () => {
	beforeEach(() => {
		window.guardian = {
			config: {
				ophan: { pageViewId: 'presetOphanPageViewId' },
				page: {
					edition: 'US' as Edition,
					pageId: 'football/series/footballweekly',
					videoDuration: 63,
					section: 'football',
					sharedAdTargeting: {
						bl: ['blog'],
						br: 'p',
						co: ['gabrielle-chan'],
						ct: 'video',
						edition: 'us',
						k: [
							'prince-charles-letters',
							'uk/uk',
							'prince-charles',
						],
						ob: 't',
						p: 'ng',
						se: ['filmweekly'],
						su: ['5'],
						tn: ['news'],
						url: '/football/series/footballweekly',
					},
					isSensitive: false,
					webPublicationDate: 608857200,
				} as unknown as typeof window.guardian.config.page,
			},
		} as typeof window.guardian;

		setCookie({ name: 'adtest', value: 'ng101' });

		mockViewport(0, 0);

		setCookie({ name: 'GU_U', value: 'test' });

		storage.local.setRaw('gu.alreadyVisited', String(0));

		getLocale.mockReturnValue('US');

		getAuthStatus.mockReturnValue(
			Promise.resolve({ kind: 'SignedInWithOkta' } as AuthStatus),
		);

		jest.spyOn(global.Math, 'random').mockReturnValue(0.5);

		expect.hasAssertions();
	});

	afterEach(() => {
		jest.spyOn(global.Math, 'random').mockRestore();
		jest.resetAllMocks();
		storage.local.clear();
	});

	it('should exist', () => {
		expect(buildPageTargeting).toBeDefined();
	});

	it('should build correct page targeting', () => {
		const pageTargeting = buildPageTargeting({
			adFree: false,
			clientSideParticipations: {},
			consentState: emptyConsent,
			isSignedIn: true,
		});

		expect(pageTargeting.sens).toBe('f');
		expect(pageTargeting.edition).toBe('us');
		expect(pageTargeting.ct).toBe('video');
		expect(pageTargeting.p).toBe('ng');
		expect(pageTargeting.su).toEqual(['5']);
		expect(pageTargeting.bp).toBe('mobile');
		expect(pageTargeting.at).toBe('ng101');
		expect(pageTargeting.si).toEqual('t');
		expect(pageTargeting.co).toEqual(['gabrielle-chan']);
		expect(pageTargeting.bl).toEqual(['blog']);
		expect(pageTargeting.tn).toEqual(['news']);
		expect(pageTargeting.vl).toEqual('90');
		expect(pageTargeting.pv).toEqual('presetOphanPageViewId');
		expect(pageTargeting.pa).toEqual('f');
		expect(pageTargeting.cc).toEqual('US');
		expect(pageTargeting.rp).toEqual('dotcom-platform');
		expect(pageTargeting.rc).toEqual('7');
		expect(pageTargeting.allkw).toEqual([
			'footballweekly',
			'prince-charles-letters',
			'uk/uk',
			'prince-charles',
		]);
	});

	it('should set correct personalized ad (pa) param', () => {
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: tcfv2WithConsentMock,
				isSignedIn: true,
			}).pa,
		).toBe('t');
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: tcfv2WithoutConsentMock,
				isSignedIn: true,
			}).pa,
		).toBe('f');
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: tcfv2NullConsentMock,
				isSignedIn: true,
			}).pa,
		).toBe('f');
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: tcfv2MixedConsentMock,
				isSignedIn: true,
			}).pa,
		).toBe('f');
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: ccpaWithConsentMock,
				isSignedIn: true,
			}).pa,
		).toBe('t');
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: ccpaWithoutConsentMock,
				isSignedIn: true,
			}).pa,
		).toBe('f');
	});

	it('Should correctly set the RDP flag (rdp) param', () => {
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: tcfv2WithoutConsentMock,
				isSignedIn: true,
			}).rdp,
		).toBe('na');
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: tcfv2NullConsentMock,
				isSignedIn: true,
			}).rdp,
		).toBe('na');
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: ccpaWithConsentMock,
				isSignedIn: true,
			}).rdp,
		).toBe('f');
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: ccpaWithoutConsentMock,
				isSignedIn: true,
			}).rdp,
		).toBe('t');
	});

	it('Should correctly set the TCFv2 (consent_tcfv2, cmp_interaction) params', () => {
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: tcfv2WithConsentMock,
				isSignedIn: true,
			}).consent_tcfv2,
		).toBe('t');
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: tcfv2WithConsentMock,
				isSignedIn: true,
			}).cmp_interaction,
		).toBe('useractioncomplete');

		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: tcfv2WithoutConsentMock,
				isSignedIn: true,
			}).consent_tcfv2,
		).toBe('f');
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: tcfv2WithoutConsentMock,
				isSignedIn: true,
			}).cmp_interaction,
		).toBe('cmpuishown');

		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: tcfv2MixedConsentMock,
				isSignedIn: true,
			}).consent_tcfv2,
		).toBe('f');
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: tcfv2MixedConsentMock,
				isSignedIn: true,
			}).cmp_interaction,
		).toBe('useractioncomplete');
	});

	it('should set correct edition param', () => {
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: emptyConsent,
				isSignedIn: true,
			}).edition,
		).toBe('us');
	});

	it('should set correct se param', () => {
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: emptyConsent,
				isSignedIn: true,
			}).se,
		).toEqual(['filmweekly']);
	});

	it('should set correct k param', () => {
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: emptyConsent,
				isSignedIn: true,
			}).k,
		).toEqual(['prince-charles-letters', 'uk/uk', 'prince-charles']);
	});

	it('should set correct ab param', () => {
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {
					someTest: {
						variant: 'variantName',
					},
				},
				consentState: emptyConsent,
				isSignedIn: true,
			}).ab,
		).toEqual(['someTest-variantName']);
	});

	it('should set Observer flag for Observer content', () => {
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: emptyConsent,
				isSignedIn: true,
			}).ob,
		).toEqual('t');
	});

	it('should set correct branding param for paid content', () => {
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: emptyConsent,
				isSignedIn: true,
			}).br,
		).toEqual('p');
	});

	it('should not contain an ad-free targeting value', () => {
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: emptyConsent,
				isSignedIn: true,
			}).af,
		).toBeUndefined();
	});

	it('should remove empty values', () => {
		window.guardian.config.page = {
			// pageId should always be defined
			pageId: 'football/series/footballweekly',
		} as typeof window.guardian.config.page;
		window.guardian.config.ophan = { pageViewId: '123456' };

		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: emptyConsent,
				isSignedIn: true,
			}),
		).toEqual({
			at: 'ng101',
			bp: 'mobile',
			cc: 'US',
			cmp_interaction: 'na',
			consent_tcfv2: 'na',
			dcre: 'f',
			fr: '0',
			firstvisit: 't',
			inskin: 'f',
			pa: 'f',
			pv: '123456',
			rc: '7',
			rdp: 'na',
			rp: 'dotcom-platform',
			sens: 'f',
			si: 't',
			skinsize: 's',
			urlkw: ['footballweekly'],
			allkw: ['footballweekly'],
		});
	});

	describe('Breakpoint targeting', () => {
		it('should set correct breakpoint targeting for a mobile device', () => {
			mockViewport(320, 0);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).bp,
			).toEqual('mobile');
		});

		it('should set correct breakpoint targeting for a medium mobile device', () => {
			mockViewport(375, 0);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).bp,
			).toEqual('mobile');
		});

		it('should set correct breakpoint targeting for a mobile device in landscape mode', () => {
			mockViewport(480, 0);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).bp,
			).toEqual('mobile');
		});

		it('should set correct breakpoint targeting for a phablet device', () => {
			mockViewport(660, 0);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).bp,
			).toEqual('tablet');
		});

		it('should set correct breakpoint targeting for a tablet device', () => {
			mockViewport(740, 0);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).bp,
			).toEqual('tablet');
		});

		it('should set correct breakpoint targeting for a desktop device', () => {
			mockViewport(980, 0);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).bp,
			).toEqual('desktop');
		});

		it('should set correct breakpoint targeting for a leftCol device', () => {
			mockViewport(1140, 0);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).bp,
			).toEqual('desktop');
		});

		it('should set correct breakpoint targeting for a wide device', () => {
			mockViewport(1300, 0);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).bp,
			).toEqual('desktop');
		});
	});

	describe('Build Page Targeting (ad-free)', () => {
		it('should set the ad-free param to t when enabled', () => {
			expect(
				buildPageTargeting({
					adFree: true,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).af,
			).toBe('t');
		});
	});

	describe('Permutive', () => {
		it('should set the permutive param to the value from localstorage', () => {
			const PERMUTIVE_KEY = `_papns`;
			storage.local.setRaw(PERMUTIVE_KEY, '[1, 2, 3]');

			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: ccpaWithConsentMock,
					isSignedIn: true,
				}).permutive,
			).toEqual(['1', '2', '3']);
		});
	});

	describe('Already visited frequency', () => {
		it('can pass a value of five or less', () => {
			storage.local.setRaw('gu.alreadyVisited', String(5));
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: ccpaWithConsentMock,
					isSignedIn: true,
				}).fr,
			).toEqual('5');
		});

		it('between five and thirty, includes it in a bucket in the form "x-y"', () => {
			storage.local.setRaw('gu.alreadyVisited', String(18));
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: ccpaWithConsentMock,
					isSignedIn: true,
				}).fr,
			).toEqual('16-19');
		});

		it('over thirty, includes it in the bucket "30plus"', () => {
			storage.local.setRaw('gu.alreadyVisited', String(300));
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: ccpaWithConsentMock,
					isSignedIn: true,
				}).fr,
			).toEqual('30plus');
		});

		it('passes a value of 0 if the value is not stored', () => {
			storage.local.remove('gu.alreadyVisited');
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: ccpaWithConsentMock,
					isSignedIn: true,
				}).fr,
			).toEqual('0');
		});

		it('passes a value of 0 if the number is invalid', () => {
			storage.local.setRaw('gu.alreadyVisited', 'not-a-number');
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: ccpaWithConsentMock,
					isSignedIn: true,
				}).fr,
			).toEqual('0');
		});

		it('passes a value of 0 if consent is not given', () => {
			storage.local.setRaw('gu.alreadyVisited', String(5));
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: ccpaWithoutConsentMock,
					isSignedIn: true,
				}).fr,
			).toEqual('0');
		});

		it('passes a value of 0 if empty consent', () => {
			storage.local.setRaw('gu.alreadyVisited', String(5));
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).fr,
			).toEqual('0');
		});
	});

	describe('Referrer', () => {
		it('should set ref to Facebook', () => {
			jest.spyOn(document, 'referrer', 'get').mockReturnValue(
				'https://www.facebook.com/feel-the-force',
			);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).ref,
			).toEqual('facebook');
		});

		it('should set ref to Twitter', () => {
			jest.spyOn(document, 'referrer', 'get').mockReturnValue(
				'https://t.co/you-must-unlearn-what-you-have-learned',
			);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).ref,
			).toEqual('twitter');
		});

		it('should set ref to reddit', () => {
			jest.spyOn(document, 'referrer', 'get').mockReturnValue(
				'https://www.reddit.com/its-not-my-fault',
			);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).ref,
			).toEqual('reddit');
		});

		it('should set ref to google', () => {
			jest.spyOn(document, 'referrer', 'get').mockReturnValue(
				'https://www.google.com/i-find-your-lack-of-faith-distrubing',
			);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).ref,
			).toEqual('google');
		});

		it('should set ref empty string if referrer does not match', () => {
			jest.spyOn(document, 'referrer', 'get').mockReturnValue(
				'https://theguardian.com',
			);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).ref,
			).toEqual(undefined);
		});
	});

	describe('URL Keywords', () => {
		it('should return correct keywords from pageId', () => {
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).urlkw,
			).toEqual(['footballweekly']);
		});

		it('should extract multiple url keywords correctly', () => {
			window.guardian.config.page.pageId =
				'stage/2016/jul/26/harry-potter-cursed-child-review-palace-theatre-london';
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).urlkw,
			).toEqual([
				'harry',
				'potter',
				'cursed',
				'child',
				'review',
				'palace',
				'theatre',
				'london',
			]);
		});

		it('should get correct keywords when trailing slash is present', () => {
			window.guardian.config.page.pageId =
				'stage/2016/jul/26/harry-potter-cursed-child-review-palace-theatre-london/';
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).urlkw,
			).toEqual([
				'harry',
				'potter',
				'cursed',
				'child',
				'review',
				'palace',
				'theatre',
				'london',
			]);
		});
	});

	describe('inskin targeting', () => {
		it('should not allow inskin if cmp has not initialised', () => {
			cmp.hasInitialised.mockReturnValue(false);
			cmp.willShowPrivacyMessageSync.mockReturnValue(false);
			mockViewport(1920, 1080);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).inskin,
			).toBe('f');
		});

		it('should not allow inskin if cmp will show a banner', () => {
			cmp.hasInitialised.mockReturnValue(true);
			cmp.willShowPrivacyMessageSync.mockReturnValue(true);
			mockViewport(1920, 1080);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).inskin,
			).toBe('f');
		});
	});

	describe('skinsize targetting', () => {
		it.each([
			['s', 1280],
			['s', 1440],
			['s', 1559],
			['l', 1560],
			['l', 1561],
			['l', 1920],
			['l', 2560],
		])("should return '%s' if viewport width is %s", (expected, width) => {
			cmp.hasInitialised.mockReturnValue(true);
			cmp.willShowPrivacyMessageSync.mockReturnValue(false);
			mockViewport(width, 800);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).skinsize,
			).toBe(expected);
		});

		it("should return 's' if vp does not have a width", () => {
			mockViewport(0, 0);
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).skinsize,
			).toBe('s');
		});
	});

	describe('ad manager group value', () => {
		const STORAGE_KEY = 'gu.adManagerGroup';
		it('if present in localstorage, use value from storage', () => {
			storage.local.setRaw(STORAGE_KEY, '10');
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: tcfv2WithConsentMock,
					isSignedIn: true,
				}).amtgrp,
			).toEqual('10');
			storage.local.remove(STORAGE_KEY);
		});

		it.each([
			[ccpaWithConsentMock, '9'],
			[ccpaWithoutConsentMock, '9'],

			[ausWithConsentMock, '9'],
			[ausWithoutConsentMock, '9'],

			[tcfv2WithConsentMock, '9'],
			[tcfv2WithoutConsentMock, undefined],
			[tcfv2MixedConsentMock, undefined],
			[tcfv2MixedConsentMock, undefined],
		])('Framework %p => amtgrp is %s', (consentState, value) => {
			storage.local.setRaw(STORAGE_KEY, '9');
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: consentState,
					isSignedIn: true,
				}).amtgrp,
			).toEqual(value);
			storage.local.remove(STORAGE_KEY);
		});

		it('if not present in localstorage, generate a random group 1-12, store in localstorage', () => {
			// restore Math.random for this test so we can assert the group value range is 1-12
			jest.spyOn(global.Math, 'random').mockRestore();
			const valueGenerated = buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: tcfv2WithConsentMock,
				isSignedIn: true,
			}).amtgrp;
			expect(valueGenerated).toBeDefined();
			expect(Number(valueGenerated)).toBeGreaterThanOrEqual(1);
			expect(Number(valueGenerated)).toBeLessThanOrEqual(12);
			const valueFromStorage = storage.local.getRaw(STORAGE_KEY);
			expect(valueFromStorage).toEqual(valueGenerated);
		});
	});

	describe('dcre dotcom-rendering-eligible', () => {
		it('should be true if page is a dotcom-rendering-eligible page', () => {
			window.guardian.config.page.dcrCouldRender = true;
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).dcre,
			).toBe('t');
		});

		it('should be false if page is not a dotcom-rendering-eligible page', () => {
			window.guardian.config.page.dcrCouldRender = false;
			expect(
				buildPageTargeting({
					adFree: false,
					clientSideParticipations: {},
					consentState: emptyConsent,
					isSignedIn: true,
				}).dcre,
			).toBe('f');
		});
	});

	it('should set firstvisit to true if referrer is empty and navigation api is missing', () => {
		jest.spyOn(window, 'performance', 'get').mockReturnValue(
			undefined as unknown as Performance,
		);
		jest.spyOn(document, 'referrer', 'get').mockReturnValue('');
		jest.spyOn(window, 'location', 'get').mockReturnValue({
			hostname: 'theguardian.com',
		} as unknown as Location);
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: emptyConsent,
				isSignedIn: true,
			}).firstvisit,
		).toBe('t');
	});

	it('should set firstvisit to true if referrer is empty and navigation type is navigate', () => {
		jest.spyOn(window, 'performance', 'get').mockReturnValue({
			getEntriesByType: () => [
				{
					type: 'navigate',
				},
			],
			mark: () => {
				//
			},
		} as unknown as Performance);
		jest.spyOn(document, 'referrer', 'get').mockReturnValue('');
		jest.spyOn(window, 'location', 'get').mockReturnValue({
			hostname: 'theguardian.com',
		} as unknown as Location);
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: emptyConsent,
				isSignedIn: true,
			}).firstvisit,
		).toBe('t');
	});

	it('should set firstvisit to false if referrer is empty and navigation type is not navigate', () => {
		jest.spyOn(window, 'performance', 'get').mockReturnValue({
			getEntriesByType: () => [
				{
					type: 'reload',
				},
			],
			mark: () => {
				//
			},
		} as unknown as Performance);
		jest.spyOn(document, 'referrer', 'get').mockReturnValue('');
		jest.spyOn(window, 'location', 'get').mockReturnValue({
			hostname: 'theguardian.com',
		} as unknown as Location);
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: emptyConsent,
				isSignedIn: true,
			}).firstvisit,
		).toBe('f');
	});

	it('should set firstvisit to false if referrer is the guardian and navigation type is navigate', () => {
		jest.spyOn(window, 'performance', 'get').mockReturnValue({
			getEntriesByType: () => [
				{
					type: 'navigate',
				},
			],
			mark: () => {
				//
			},
		} as unknown as Performance);
		jest.spyOn(document, 'referrer', 'get').mockReturnValue(
			'https://theguardian.com/uk',
		);
		jest.spyOn(window, 'location', 'get').mockReturnValue({
			hostname: 'theguardian.com',
		} as unknown as Location);
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: emptyConsent,
				isSignedIn: true,
			}).firstvisit,
		).toBe('f');
	});

	it('should set firstvisit to false if referrer is the guardian and navigation type is not navigate', () => {
		jest.spyOn(window, 'performance', 'get').mockReturnValue({
			getEntriesByType: () => [
				{
					type: 'reload',
				},
			],
			mark: () => {
				//
			},
		} as unknown as Performance);
		jest.spyOn(document, 'referrer', 'get').mockReturnValue(
			'https://theguardian.com/uk',
		);
		jest.spyOn(window, 'location', 'get').mockReturnValue({
			hostname: 'theguardian.com',
		} as unknown as Location);
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: emptyConsent,
				isSignedIn: true,
			}).firstvisit,
		).toBe('f');
	});

	it('should set firstvisit to true if referrer is not the guardian and navigation type is navigate', () => {
		jest.spyOn(window, 'performance', 'get').mockReturnValue({
			getEntriesByType: () => [
				{
					type: 'navigate',
				},
			],
			mark: () => {
				//
			},
		} as unknown as Performance);
		jest.spyOn(document, 'referrer', 'get').mockReturnValue(
			'https://google.com/',
		);
		jest.spyOn(window, 'location', 'get').mockReturnValue({
			hostname: 'theguardian.com',
		} as unknown as Location);
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: emptyConsent,
				isSignedIn: true,
			}).firstvisit,
		).toBe('t');
	});

	it('should not set firstvisit if consent is allowed', () => {
		jest.spyOn(document, 'referrer', 'get').mockReturnValue('');
		jest.spyOn(window, 'location', 'get').mockReturnValue({
			hostname: 'theguardian.com',
		} as unknown as Location);
		expect(
			buildPageTargeting({
				adFree: false,
				clientSideParticipations: {},
				consentState: ccpaWithConsentMock,
				isSignedIn: true,
			}).firstvisit,
		).toBeUndefined();
	});
});
