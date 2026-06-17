import type { ConsentState } from '@guardian/consent-manager';
import { getConsentFor } from '@guardian/consent-manager';
import { isSwitchedOn } from '../utils';
import { ATS_PLACEMENT_ID } from './id-handlers/liveramp';
import { getLiveRampATSAnalyticsConfig } from './liveramp-ats-analytics';

jest.mock('@guardian/consent-manager', () => ({
	getConsentFor: jest.fn(),
}));

jest.mock('../utils', () => ({
	isSwitchedOn: jest.fn(),
}));

const mockConsentState = {} as ConsentState;

describe('getLiveRampATSAnalyticsConfig', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	test('returns config when switch is on and consent is given', () => {
		jest.mocked(isSwitchedOn).mockReturnValue(true);
		jest.mocked(getConsentFor).mockReturnValue(true);

		const result = getLiveRampATSAnalyticsConfig(mockConsentState);

		expect(result).toEqual({
			provider: 'atsAnalytics',
			options: {
				pid: String(ATS_PLACEMENT_ID),
			},
		});
	});

	test('returns undefined when switch is off', () => {
		jest.mocked(isSwitchedOn).mockReturnValue(false);
		jest.mocked(getConsentFor).mockReturnValue(true);

		const result = getLiveRampATSAnalyticsConfig(mockConsentState);

		expect(result).toBeUndefined();
	});

	test('returns undefined when consent is not given', () => {
		jest.mocked(isSwitchedOn).mockReturnValue(true);
		jest.mocked(getConsentFor).mockReturnValue(false);

		const result = getLiveRampATSAnalyticsConfig(mockConsentState);

		expect(result).toBeUndefined();
	});

	test('returns undefined when both switch is off and consent is not given', () => {
		jest.mocked(isSwitchedOn).mockReturnValue(false);
		jest.mocked(getConsentFor).mockReturnValue(false);

		const result = getLiveRampATSAnalyticsConfig(mockConsentState);

		expect(result).toBeUndefined();
	});
});
