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

describe('YouTube Ad Targeting Object for CCPA', () => {
	test('creates adsConfig for CCPA personalised targeting allowed', async () => {
		(canUseDom as jest.Mock).mockReturnValue(true);
		(getCookie as jest.Mock).mockReturnValue('someUser');
		(getPermutivePFPSegments as jest.Mock).mockReturnValue(['1', '2', '3']);
		(onConsentChange as jest.Mock).mockImplementation(
			(callback: (cmpConsent: unknown) => unknown) => {
				callback({
					ccpa: {
						doNotSell: false,
					},
				});
			},
		);
		const adsConfig = await buildAdsConfigWithConsent(false, 'someAdUnit', {
			param1: 'param1',
			param2: 'param2',
		});
		expect(adsConfig).toEqual({
			adTagParameters: {
				iu: 'someAdUnit',
				cust_params: encodeURIComponent(
					'param1=param1&param2=param2&permutive=1,2,3&si=t',
				),
			},
			restrictedDataProcessor: false,
		});
	});

	test('creates adsConfig for CCPA personalised targeting not allowed', async () => {
		(canUseDom as jest.Mock).mockReturnValue(true);
		(getCookie as jest.Mock).mockReturnValue('someUser');
		(getPermutivePFPSegments as jest.Mock).mockReturnValue(['1', '2', '3']);
		(onConsentChange as jest.Mock).mockImplementation(
			(callback: (cmpConsent: unknown) => unknown) => {
				callback({
					ccpa: {
						doNotSell: true,
					},
				});
			},
		);
		const adsConfig = await buildAdsConfigWithConsent(false, 'someAdUnit', {
			param1: 'param1',
			param2: 'param2',
		});
		expect(adsConfig).toEqual({
			adTagParameters: {
				iu: 'someAdUnit',
				cust_params: encodeURIComponent(
					'param1=param1&param2=param2&permutive=1,2,3&si=t',
				),
			},
			restrictedDataProcessor: true,
		});
	});

	test('creates adsConfig for CCPA when cannot access cookies', async () => {
		(canUseDom as jest.Mock).mockReturnValue(false);
		(onConsentChange as jest.Mock).mockImplementation(
			(callback: (cmpConsent: unknown) => unknown) => {
				callback({
					ccpa: {
						doNotSell: false,
					},
				});
			},
		);
		const adsConfig = await buildAdsConfigWithConsent(false, 'someAdUnit', {
			param1: 'param1',
			param2: 'param2',
		});
		expect(adsConfig).toEqual({
			adTagParameters: {
				iu: 'someAdUnit',
				cust_params: encodeURIComponent('param1=param1&param2=param2'),
			},
			restrictedDataProcessor: false,
		});
	});

	test('creates adsConfig for CCPA when user cookie does not exist', async () => {
		(canUseDom as jest.Mock).mockReturnValue(true);
		(getCookie as jest.Mock).mockReturnValue('');
		(getPermutivePFPSegments as jest.Mock).mockReturnValue(['1', '2', '3']);
		(onConsentChange as jest.Mock).mockImplementation(
			(callback: (cmpConsent: unknown) => unknown) => {
				callback({
					ccpa: {
						doNotSell: false,
					},
				});
			},
		);
		const adsConfig = await buildAdsConfigWithConsent(false, 'someAdUnit', {
			param1: 'param1',
			param2: 'param2',
		});
		expect(adsConfig).toEqual({
			adTagParameters: {
				iu: 'someAdUnit',
				cust_params: encodeURIComponent(
					'param1=param1&param2=param2&permutive=1,2,3&si=f',
				),
			},
			restrictedDataProcessor: false,
		});
	});
});

describe('YouTube Ad Targeting Object for AUS', () => {
	test.each([
		{
			msg: 'creates adsConfig for AUS personalised targeting allowed',
			canUseDomReturn: true,
			getCookieReturn: 'someUser',
			getPermutiveReturn: ['1', '2', '3'],
			onConsentChangeCallbackReturn: {
				aus: {
					personalisedAdvertising: true, // **
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

	test('creates adsConfig for AUS personalised targeting allowed', async () => {
		(canUseDom as jest.Mock).mockReturnValue(true);
		(getCookie as jest.Mock).mockReturnValue('someUser');
		(getPermutivePFPSegments as jest.Mock).mockReturnValue(['1', '2', '3']);
		(onConsentChange as jest.Mock).mockImplementation(
			(callback: (cmpConsent: unknown) => unknown) => {
				callback({
					aus: {
						personalisedAdvertising: true,
					},
				});
			},
		);
		const adsConfig = await buildAdsConfigWithConsent(false, 'someAdUnit', {
			param1: 'param1',
			param2: 'param2',
		});
		expect(adsConfig).toEqual({
			adTagParameters: {
				iu: 'someAdUnit',
				cust_params: encodeURIComponent(
					'param1=param1&param2=param2&permutive=1,2,3&si=t',
				),
			},
			restrictedDataProcessor: false,
		});
	});

	test('creates adsConfig for AUS personalised targeting not allowed', async () => {
		(canUseDom as jest.Mock).mockReturnValue(true);
		(getCookie as jest.Mock).mockReturnValue('someUser');
		(getPermutivePFPSegments as jest.Mock).mockReturnValue(['1', '2', '3']);
		(onConsentChange as jest.Mock).mockImplementation(
			(callback: (cmpConsent: unknown) => unknown) => {
				callback({
					aus: {
						personalisedAdvertising: false,
					},
				});
			},
		);
		const adsConfig = await buildAdsConfigWithConsent(false, 'someAdUnit', {
			param1: 'param1',
			param2: 'param2',
		});
		expect(adsConfig).toEqual({
			adTagParameters: {
				iu: 'someAdUnit',
				cust_params: encodeURIComponent(
					'param1=param1&param2=param2&permutive=1,2,3&si=t',
				),
			},
			restrictedDataProcessor: true,
		});
	});
});

describe('YouTube Ad Targeting Object for TCFV2', () => {
	test('creates adsConfig for TCFV2 personalised targeting allowed', async () => {
		(canUseDom as jest.Mock).mockReturnValue(true);
		(getCookie as jest.Mock).mockReturnValue('someUser');
		(getPermutivePFPSegments as jest.Mock).mockReturnValue(['1', '2', '3']);
		(onConsentChange as jest.Mock).mockImplementation(
			(callback: (cmpConsent: unknown) => unknown) => {
				callback({
					tcfv2: {
						addtlConsent: 'someAddtlConsent',
						consents: [true, true],
						gdprApplies: true,
						tcString: 'someTcString',
					},
				});
			},
		);
		const adsConfig = await buildAdsConfigWithConsent(false, 'someAdUnit', {
			param1: 'param1',
			param2: 'param2',
		});
		expect(adsConfig).toEqual({
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
		});
	});

	test('creates adsConfig for TCFV2 personalised targeting allowed GDPR is false', async () => {
		(canUseDom as jest.Mock).mockReturnValue(true);
		(getCookie as jest.Mock).mockReturnValue('someUser');
		(getPermutivePFPSegments as jest.Mock).mockReturnValue(['1', '2', '3']);
		(onConsentChange as jest.Mock).mockImplementation(
			(callback: (cmpConsent: unknown) => unknown) => {
				callback({
					tcfv2: {
						addtlConsent: 'someAddtlConsent',
						consents: [true, true],
						gdprApplies: false,
						tcString: 'someTcString',
					},
				});
			},
		);
		const adsConfig = await buildAdsConfigWithConsent(false, 'someAdUnit', {
			param1: 'param1',
			param2: 'param2',
		});
		expect(adsConfig).toEqual({
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
		});
	});

	test('creates adsConfig for TCFV2 personalised targeting not allowed', async () => {
		(canUseDom as jest.Mock).mockReturnValue(true);
		(getCookie as jest.Mock).mockReturnValue('someUser');
		(getPermutivePFPSegments as jest.Mock).mockReturnValue(['1', '2', '3']);
		(onConsentChange as jest.Mock).mockImplementation(
			(callback: (cmpConsent: unknown) => unknown) => {
				callback({
					tcfv2: {
						addtlConsent: 'someAddtlConsent',
						consents: [true, false],
						gdprApplies: true,
						tcString: 'someTcString',
					},
				});
			},
		);
		const adsConfig = await buildAdsConfigWithConsent(false, 'someAdUnit', {
			param1: 'param1',
			param2: 'param2',
		});
		expect(adsConfig).toEqual({
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
		});
	});
});

describe('YouTube Ad Targeting Object when consent errors', () => {
	test('creates basic ad config when onConsentChange throws an error', async () => {
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

	test('creates basic ad config when consent does not have TCFV2 data', async () => {
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
	test('creates disable ads config when ad free user', async () => {
		const adsConfig = await buildAdsConfigWithConsent(
			true,
			'someAdUnit',
			{},
		);
		expect(adsConfig).toEqual({ disableAds: true });
	});
});
