import type { ConsentState } from '@guardian/libs';
import { buildPageTargeting } from './build-page-targeting';
import { buildAdsConfigWithConsent } from './youtube';

jest.mock('./build-page-targeting');

afterEach(() => {
	jest.clearAllMocks();
});

describe('YouTube Ad Targeting Object for consent frameworks', () => {
	test.each([
		{
			msg: 'creates adsConfig for CCPA personalised targeting allowed',
			isSignedIn: 't',
			consentState: {
				ccpa: {
					doNotSell: false, // *
				},
				canTarget: true,
				framework: 'ccpa',
			} as ConsentState,
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			customParams: {
				param1: 'param1',
				param2: 'param2',
			},
			expected: {
				adTagParameters: {
					iu: 'someAdUnit',
					cust_params: encodeURIComponent(
						'param1=param1&param2=param2&permutive=1,2,3&si=t&yt_embed_ima=0',
					),
				},
				restrictedDataProcessor: false,
			},
		},
		{
			msg: 'creates adsConfig for CCPA personalised targeting NOT allowed',
			isSignedIn: 't',
			consentState: {
				ccpa: {
					doNotSell: true, // *
				},
				canTarget: false,
				framework: 'ccpa',
			} as ConsentState,
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			customParams: {
				param1: 'param1',
				param2: 'param2',
			},
			expected: {
				adTagParameters: {
					iu: 'someAdUnit',
					cust_params: encodeURIComponent(
						'param1=param1&param2=param2&permutive=1,2,3&si=t&yt_embed_ima=0',
					),
				},
				restrictedDataProcessor: true,
			},
		},
		{
			msg: 'creates adsConfig for CCPA when user is signed out',
			isSignedIn: 'f', // *
			consentState: {
				ccpa: {
					doNotSell: false,
				},
				canTarget: true,
				framework: 'ccpa',
			} as ConsentState,
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			customParams: {
				param1: 'param1',
				param2: 'param2',
			},
			expected: {
				adTagParameters: {
					iu: 'someAdUnit',
					cust_params: encodeURIComponent(
						'param1=param1&param2=param2&permutive=1,2,3&si=f&yt_embed_ima=0',
					),
				},
				restrictedDataProcessor: false,
			},
		},
		{
			msg: 'creates adsConfig for AUS personalised targeting allowed',
			isSignedIn: 't',
			consentState: {
				aus: {
					personalisedAdvertising: true, // *
				},
				canTarget: true,
				framework: 'aus',
			} as ConsentState,
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			customParams: {
				param1: 'param1',
				param2: 'param2',
			},
			expected: {
				adTagParameters: {
					iu: 'someAdUnit',
					cust_params: encodeURIComponent(
						'param1=param1&param2=param2&permutive=1,2,3&si=t&yt_embed_ima=0',
					),
				},
				restrictedDataProcessor: false,
			},
		},
		{
			msg: 'creates adsConfig for AUS personalised targeting NOT allowed',
			isSignedIn: 't',
			consentState: {
				aus: {
					personalisedAdvertising: false, // *
				},
				canTarget: false,
				framework: 'aus',
			} as ConsentState,
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			customParams: {
				param1: 'param1',
				param2: 'param2',
			},
			expected: {
				adTagParameters: {
					iu: 'someAdUnit',
					cust_params: encodeURIComponent(
						'param1=param1&param2=param2&permutive=1,2,3&si=t&yt_embed_ima=0',
					),
				},
				restrictedDataProcessor: true,
			},
		},
		{
			msg: 'creates adsConfig for TCFV2 personalised targeting allowed',
			isSignedIn: 't',
			consentState: {
				tcfv2: {
					addtlConsent: 'someAddtlConsent',
					consents: [true, true], // *
					gdprApplies: true,
					tcString: 'someTcString',
				},
				canTarget: true,
				framework: 'tcfv2',
			} as unknown as ConsentState,
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			customParams: {
				param1: 'param1',
				param2: 'param2',
			},
			expected: {
				adTagParameters: {
					iu: 'someAdUnit',
					cmpGdpr: 1,
					cmpVcd: 'someTcString',
					cmpGvcd: 'someAddtlConsent',
					cust_params: encodeURIComponent(
						'param1=param1&param2=param2&permutive=1,2,3&si=t&yt_embed_ima=0',
					),
				},
				nonPersonalizedAd: false,
			},
		},
		{
			msg: 'creates adsConfig for TCFV2 personalised targeting NOT allowed',
			isSignedIn: 't',
			consentState: {
				tcfv2: {
					addtlConsent: 'someAddtlConsent',
					consents: [true, false], // *
					gdprApplies: true,
					tcString: 'someTcString',
				},
				canTarget: false,
				framework: 'tcfv2',
			} as unknown as ConsentState,
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			customParams: {
				param1: 'param1',
				param2: 'param2',
			},
			expected: {
				adTagParameters: {
					iu: 'someAdUnit',
					cmpGdpr: 1,
					cmpVcd: 'someTcString',
					cmpGvcd: 'someAddtlConsent',
					cust_params: encodeURIComponent(
						'param1=param1&param2=param2&permutive=1,2,3&si=t&yt_embed_ima=0',
					),
				},
				nonPersonalizedAd: true,
			},
		},
		{
			msg: 'creates adsConfig for TCFV2 personalised targeting allowed and GDPR is false',
			isSignedIn: 't',
			consentState: {
				tcfv2: {
					addtlConsent: 'someAddtlConsent',
					consents: [true, true],
					gdprApplies: false, // *
					tcString: 'someTcString',
				},
				canTarget: true,
				framework: 'tcfv2',
			} as unknown as ConsentState,
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			customParams: {
				param1: 'param1',
				param2: 'param2',
			},
			expected: {
				adTagParameters: {
					iu: 'someAdUnit',
					cmpGdpr: 0,
					cmpVcd: 'someTcString',
					cmpGvcd: 'someAddtlConsent',
					cust_params: encodeURIComponent(
						'param1=param1&param2=param2&permutive=1,2,3&si=t&yt_embed_ima=0',
					),
				},
				nonPersonalizedAd: false,
			},
		},
	])(
		'$msg',
		({
			isSignedIn,
			consentState,
			isAdFreeUser,
			adUnit,
			customParams,
			expected,
		}) => {
			(buildPageTargeting as jest.Mock).mockReturnValue({
				permutive: ['1', '2', '3'],
				si: isSignedIn,
			});
			const adsConfig = buildAdsConfigWithConsent({
				adUnit,
				clientSideParticipations: {},
				consentState,
				customParams,
				isAdFreeUser,
				isSignedIn: true,
			});
			expect(adsConfig).toEqual(expected);
		},
	);
});

describe('YouTube Ad Targeting Object when consent errors', () => {
	test('creates disabled ads config when consent does not have any matching framework', () => {
		const adsConfig = buildAdsConfigWithConsent({
			adUnit: 'someAdUnit',
			clientSideParticipations: {},
			consentState: {
				framework: null,
				canTarget: false,
			},
			customParams: {},
			isAdFreeUser: false,
			isSignedIn: true,
		});
		expect(adsConfig).toEqual({ disableAds: true });
	});
});

describe('YouTube Ad Targeting Object when ad free user', () => {
	test('creates disabled ads config when ad free user', () => {
		const adsConfig = buildAdsConfigWithConsent({
			adUnit: 'someAdUnit',
			clientSideParticipations: {},
			consentState: {
				framework: null,
				canTarget: false,
			},
			customParams: {},
			isAdFreeUser: true,
			isSignedIn: true,
		});
		expect(adsConfig).toEqual({ disableAds: true });
	});
});
