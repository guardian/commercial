import { getConsentFor } from '@guardian/consent-manager';
import type { ConsentState } from '@guardian/consent-manager';
import {
	EU_PARTNER_ID,
	isUserInAllowedEURegion,
	isUserInIntentIQRegion,
	NON_EU_PARTNER_ID,
} from './id-handlers/intent-iq';
import { getIntentIQAnalyticsConfig } from './intent-iq-analytics';

jest.mock('@guardian/consent-manager', () => ({
	getConsentFor: jest.fn(),
}));

jest.mock('./id-handlers/intent-iq', () => ({
	EU_PARTNER_ID: 946158046,
	NON_EU_PARTNER_ID: 377078111,
	isUserInAllowedEURegion: jest.fn(),
	isUserInIntentIQRegion: jest.fn(),
}));

// @ts-expect-error -- mock global googletag
global.googletag = {};

const mockedIsUserInAllowedEURegion = jest.mocked(isUserInAllowedEURegion);
const mockedIsUserInIntentIQRegion = jest.mocked(isUserInIntentIQRegion);
const mockedGetConsentFor = jest.mocked(getConsentFor);

const consentState = {} as ConsentState;

describe('getIntentIQAnalyticsConfig', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('returns EU analytics config for eligible consented EU users', () => {
		mockedIsUserInAllowedEURegion.mockReturnValue(true);
		mockedIsUserInIntentIQRegion.mockReturnValue(true);
		mockedGetConsentFor.mockReturnValue(true);

		const result = getIntentIQAnalyticsConfig(consentState);

		expect(result).toEqual({
			provider: 'iiqAnalytics',
			options: {
				partner: EU_PARTNER_ID,
				ABTestingConfigurationSource: 'IIQServer',
				domainName: 'theguardian.com',
				gamObjectReference: {},
				reportingServerAddress:
					'https://reports-gdpr.intentiq.com/report',
				browserBlackList: 'chrome',
			},
		});
	});

	it('returns non-EU analytics config for eligible consented non-EU users', () => {
		mockedIsUserInAllowedEURegion.mockReturnValue(false);
		mockedIsUserInIntentIQRegion.mockReturnValue(true);
		mockedGetConsentFor.mockReturnValue(true);

		const result = getIntentIQAnalyticsConfig(consentState);

		expect(result).toEqual({
			provider: 'iiqAnalytics',
			options: {
				partner: NON_EU_PARTNER_ID,
				ABTestingConfigurationSource: 'IIQServer',
				domainName: 'theguardian.com',
				gamObjectReference: {},
			},
		});
	});

	it('returns undefined when user is outside allowed regions', () => {
		mockedIsUserInAllowedEURegion.mockReturnValue(false);
		mockedIsUserInIntentIQRegion.mockReturnValue(false);
		mockedGetConsentFor.mockReturnValue(true);

		expect(getIntentIQAnalyticsConfig(consentState)).toBeUndefined();
	});

	it('returns undefined when consent is missing even in allowed regions', () => {
		mockedIsUserInAllowedEURegion.mockReturnValue(true);
		mockedIsUserInIntentIQRegion.mockReturnValue(true);
		mockedGetConsentFor.mockReturnValue(false);

		expect(getIntentIQAnalyticsConfig(consentState)).toBeUndefined();
	});
});
