import { getLocale } from '@guardian/commercial-core/geo/get-locale';
import { isUserInTestGroup } from '../../../../ab-testing';
import { getUserIdForIntentIQ } from './intent-iq';

jest.mock('../../../../ab-testing', () => ({
	isUserInTestGroup: jest.fn(),
}));
jest.mock('@guardian/commercial-core/geo/get-locale');

// @ts-expect-error -- mock global googletag
global.googletag = {};

describe('getUserIdForIntentIQ - when user is in test group', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});
	test('should generate correct EU userID config, in an allowed EU region (GB)', async () => {
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(true);
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
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(true);
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
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(true);
		jest.mocked(getLocale).mockReturnValueOnce('CY');

		const result = await getUserIdForIntentIQ();

		expect(result).toEqual(undefined);
	});
	test('should return undefined as userID config, for users in an unsupported region (CZ)', async () => {
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(true);
		jest.mocked(getLocale).mockReturnValueOnce('CZ');

		const result = await getUserIdForIntentIQ();

		expect(result).toEqual(undefined);
	});
});

describe('getUserIdForIntentIQ - when user is NOT in test group', () => {
	test('should return undefined userID config, in an allowed EU region (GB)', async () => {
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(false);
		jest.mocked(getLocale).mockReturnValueOnce('GB');

		const result = await getUserIdForIntentIQ();

		expect(result).toEqual(undefined);
	});
	test('should return undefined userID config, in a non-allowed EU region (Cyprus)', async () => {
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(false);
		jest.mocked(getLocale).mockReturnValueOnce('CY');

		const result = await getUserIdForIntentIQ();

		expect(result).toEqual(undefined);
	});
	test('should return undefined userID config, in an allowed Non-EU region (Japan)', async () => {
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(false);
		jest.mocked(getLocale).mockReturnValueOnce('JP');

		const result = await getUserIdForIntentIQ();

		expect(result).toEqual(undefined);
	});
});
