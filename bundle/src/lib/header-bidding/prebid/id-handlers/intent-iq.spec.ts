import { isInUsa } from '@guardian/commercial-core/geo/geo-utils';
import { getLocale } from '@guardian/commercial-core/geo/get-locale';
import { isUserInTestGroup } from '../../../../ab-testing';
import { getUserIdForIntentIQ } from './intent-iq';

jest.mock('../../../../ab-testing', () => ({
	isUserInTestGroup: jest.fn(),
}));
jest.mock('@guardian/commercial-core/geo/get-locale');

jest.mock('@guardian/commercial-core/geo/geo-utils', () => ({
	isInUsa: jest.fn(),
}));
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

describe('getUserIdForIntentIQ - when US user not in holdback', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});
	test('when locale is US and US experiment is holdback', async () => {
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(false); // isUserInTestGroupIntentIQ
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(false); // canRunIntentIqInUS
		jest.mocked(isInUsa).mockReturnValue(true);

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
	test('when locale is US and user is in first experiment and not in holdback', async () => {
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(true); // isUserInTestGroupIntentIQ
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(false); // canRunIntentIqInUS
		jest.mocked(isInUsa).mockReturnValue(true);

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
});
describe('getUserIdForIntentIQ - when user is in US and in test holdback group', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});
	test('when locale is US and US experiment is in holdback', async () => {
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(false); // isUserInTestGroupIntentIQ
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(true); // canRunIntentIqInUS
		jest.mocked(isInUsa).mockReturnValueOnce(true);

		const result = await getUserIdForIntentIQ();

		expect(result).toEqual(undefined);
	});
	test('when locale is US and only global experiment is variant and also in holdback', async () => {
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(true); // isUserInTestGroupIntentIQ
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(true); // canRunIntentIqInUS
		jest.mocked(isInUsa).mockReturnValueOnce(true);

		const result = await getUserIdForIntentIQ();

		expect(result).toEqual(undefined);
	});
});
