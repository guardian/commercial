import { onConsentChange } from '@guardian/consent-management-platform';
import { getCookie } from '@guardian/libs';
import { buildAdsConfigWithConsent } from './ad-targeting-youtube';
import { canUseDom } from './lib/can-use-dom';
import { getPermutivePFPSegments } from './permutive';

jest.mock('./lib/can-use-dom');
jest.mock('./permutive');
jest.mock('@guardian/libs');
jest.mock('@guardian/consent-management-platform');

afterEach(() => {
	jest.clearAllMocks();
});

describe('YouTube Ad Targeting Object for consent frameworks', () => {
	test.each([
		{
			msg: 'creates adsConfig for CCPA personalised targeting allowed',
			canUseDomReturn: true,
			getCookieReturn: 'someUser',
			getPermutiveReturn: ['1', '2', '3'],
			onConsentChangeCallbackReturn: {
				ccpa: {
					doNotSell: false, // *
				},
			},
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			custParams: {
				param1: 'param1',
				param2: 'param2',
			},
			expected: {
				adTagParameters: {
					iu: 'someAdUnit',
					cust_params: encodeURIComponent(
						'param1=param1&param2=param2&permutive=1,2,3&si=t',
					),
				},
				restrictedDataProcessor: false,
			},
		},
		{
			msg: 'creates adsConfig for CCPA personalised targeting NOT allowed',
			canUseDomReturn: true,
			getCookieReturn: 'someUser',
			getPermutiveReturn: ['1', '2', '3'],
			onConsentChangeCallbackReturn: {
				ccpa: {
					doNotSell: true, // *
				},
			},
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			custParams: {
				param1: 'param1',
				param2: 'param2',
			},
			expected: {
				adTagParameters: {
					iu: 'someAdUnit',
					cust_params: encodeURIComponent(
						'param1=param1&param2=param2&permutive=1,2,3&si=t',
					),
				},
				restrictedDataProcessor: true,
			},
		},
		{
			msg: 'creates adsConfig for CCPA when cannot access cookies',
			canUseDomReturn: false, // *
			getCookieReturn: 'someUser',
			getPermutiveReturn: ['1', '2', '3'],
			onConsentChangeCallbackReturn: {
				ccpa: {
					doNotSell: false,
				},
			},
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			custParams: {
				param1: 'param1',
				param2: 'param2',
			},
			expected: {
				adTagParameters: {
					iu: 'someAdUnit',
					cust_params: encodeURIComponent(
						'param1=param1&param2=param2',
					),
				},
				restrictedDataProcessor: false,
			},
		},
		{
			msg: 'creates adsConfig for CCPA when user is signed out',
			canUseDomReturn: true,
			getCookieReturn: undefined, // *
			getPermutiveReturn: ['1', '2', '3'],
			onConsentChangeCallbackReturn: {
				ccpa: {
					doNotSell: false,
				},
			},
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			custParams: {
				param1: 'param1',
				param2: 'param2',
			},
			expected: {
				adTagParameters: {
					iu: 'someAdUnit',
					cust_params: encodeURIComponent(
						'param1=param1&param2=param2&permutive=1,2,3&si=f',
					),
				},
				restrictedDataProcessor: false,
			},
		},
		{
			msg: 'creates adsConfig for AUS personalised targeting allowed',
			canUseDomReturn: true,
			getCookieReturn: 'someUser',
			getPermutiveReturn: ['1', '2', '3'],
			onConsentChangeCallbackReturn: {
				aus: {
					personalisedAdvertising: true, // *
				},
			},
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			custParams: {
				param1: 'param1',
				param2: 'param2',
			},
			expected: {
				adTagParameters: {
					iu: 'someAdUnit',
					cust_params: encodeURIComponent(
						'param1=param1&param2=param2&permutive=1,2,3&si=t',
					),
				},
				restrictedDataProcessor: false,
			},
		},
		{
			msg: 'creates adsConfig for AUS personalised targeting NOT allowed',
			canUseDomReturn: true,
			getCookieReturn: 'someUser',
			getPermutiveReturn: ['1', '2', '3'],
			onConsentChangeCallbackReturn: {
				aus: {
					personalisedAdvertising: false, // *
				},
			},
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			custParams: {
				param1: 'param1',
				param2: 'param2',
			},
			expected: {
				adTagParameters: {
					iu: 'someAdUnit',
					cust_params: encodeURIComponent(
						'param1=param1&param2=param2&permutive=1,2,3&si=t',
					),
				},
				restrictedDataProcessor: true,
			},
		},
		{
			msg: 'creates adsConfig for TCFV2 personalised targeting allowed',
			canUseDomReturn: true,
			getCookieReturn: 'someUser',
			getPermutiveReturn: ['1', '2', '3'],
			onConsentChangeCallbackReturn: {
				tcfv2: {
					addtlConsent: 'someAddtlConsent',
					consents: [true, true], // *
					gdprApplies: true,
					tcString: 'someTcString',
				},
			},
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			custParams: {
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
						'param1=param1&param2=param2&permutive=1,2,3&si=t',
					),
				},
				nonPersonalizedAd: false,
			},
		},
		{
			msg: 'creates adsConfig for TCFV2 personalised targeting NOT allowed',
			canUseDomReturn: true,
			getCookieReturn: 'someUser',
			getPermutiveReturn: ['1', '2', '3'],
			onConsentChangeCallbackReturn: {
				tcfv2: {
					addtlConsent: 'someAddtlConsent',
					consents: [true, false], // *
					gdprApplies: true,
					tcString: 'someTcString',
				},
			},
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			custParams: {
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
						'param1=param1&param2=param2&permutive=1,2,3&si=t',
					),
				},
				nonPersonalizedAd: true,
			},
		},
		{
			msg: 'creates adsConfig for TCFV2 personalised targeting allowed and GDPR is false',
			canUseDomReturn: true,
			getCookieReturn: 'someUser',
			getPermutiveReturn: ['1', '2', '3'],
			onConsentChangeCallbackReturn: {
				tcfv2: {
					addtlConsent: 'someAddtlConsent',
					consents: [true, true],
					gdprApplies: false, // *
					tcString: 'someTcString',
				},
			},
			isAdFreeUser: false,
			adUnit: 'someAdUnit',
			custParams: {
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
						'param1=param1&param2=param2&permutive=1,2,3&si=t',
					),
				},
				nonPersonalizedAd: false,
			},
		},
	])(
		'$msg',
		async ({
			canUseDomReturn,
			getCookieReturn,
			getPermutiveReturn,
			onConsentChangeCallbackReturn,
			isAdFreeUser,
			adUnit,
			custParams,
			expected,
		}) => {
			(canUseDom as jest.Mock).mockReturnValue(canUseDomReturn);
			(getCookie as jest.Mock).mockReturnValue(getCookieReturn);
			(getPermutivePFPSegments as jest.Mock).mockReturnValue(
				getPermutiveReturn,
			);
			(onConsentChange as jest.Mock).mockImplementation(
				(callback: (cmpConsent: unknown) => unknown) => {
					callback(onConsentChangeCallbackReturn);
				},
			);
			const adsConfig = await buildAdsConfigWithConsent(
				isAdFreeUser,
				adUnit,
				custParams,
			);
			expect(adsConfig).toEqual(expected);
		},
	);
});

describe('YouTube Ad Targeting Object when consent errors', () => {
	test('creates disabled ads config when onConsentChange throws an error', async () => {
		(onConsentChange as jest.Mock).mockImplementation(() => {
			throw Error('Error from test');
		});
		const adsConfig = await buildAdsConfigWithConsent(
			false,
			'someAdUnit',
			{},
		);
		expect(adsConfig).toEqual({ disableAds: true });
	});

	test('creates disabled ads config when consent does not have any matching framework', async () => {
		(onConsentChange as jest.Mock).mockImplementation(
			(callback: (cmpConsent: unknown) => unknown) => {
				callback({});
			},
		);
		const adsConfig = await buildAdsConfigWithConsent(
			false,
			'someAdUnit',
			{},
		);
		expect(adsConfig).toEqual({ disableAds: true });
	});
});

describe('YouTube Ad Targeting Object when ad free user', () => {
	test('creates disabled ads config when ad free user', async () => {
		const adsConfig = await buildAdsConfigWithConsent(
			true,
			'someAdUnit',
			{},
		);
		expect(adsConfig).toEqual({ disableAds: true });
	});
});
