import { getLocale } from '@guardian/commercial-core/geo/get-locale';
import { getUserIdForIntentIQ } from './intent-iq';

jest.mock('@guardian/commercial-core/geo/get-locale');

jest.mock('@guardian/commercial-core/geo/geo-utils', () => ({
	isInUsa: jest.fn(),
}));
// @ts-expect-error -- mock global googletag
global.googletag = {};

describe('getUserIdForIntentIQ', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});
	test('should generate correct EU userID config, in an allowed EU region (GB)', async () => {
		jest.mocked(getLocale).mockReturnValue('GB');

		const result = await getUserIdForIntentIQ();

		expect(result).toEqual({
			name: 'intentIqId',
			params: {
				partner: 946158046,
				gamObjectReference: {},
				iiqServerAddress: 'https://api-gdpr.intentiq.com',
				iiqPixelServerAddress: 'https://sync-gdpr.intentiq.com',
				browserBlackList: 'chrome',
			},
			storage: {
				type: 'html5',
				name: 'intentIqId',
				expires: 0,
				refreshInSeconds: 0,
			},
		});
	});
	test('should generate correct non-EU userID config, in an allowed non-EU region Japan (JP)', async () => {
		jest.mocked(getLocale).mockReturnValue('JP');

		const result = await getUserIdForIntentIQ();

		expect(result).toEqual({
			name: 'intentIqId',
			params: {
				partner: 377078111,
				gamObjectReference: {},
			},
			storage: {
				type: 'html5',
				name: 'intentIqId',
				expires: 0,
				refreshInSeconds: 0,
			},
		});
	});
	test('should return undefined as userID config, in not allowed EU region (Cyprus)', async () => {
		jest.mocked(getLocale).mockReturnValueOnce('CY');

		const result = await getUserIdForIntentIQ();

		expect(result).toEqual(undefined);
	});
	test('should return undefined as userID config, for users in an unsupported region (CZ)', async () => {
		jest.mocked(getLocale).mockReturnValueOnce('CZ');

		const result = await getUserIdForIntentIQ();

		expect(result).toEqual(undefined);
	});
});
