import { type ConsentState } from '@guardian/libs';
import { getEmail } from '../../../identity/api';
import { isSwitchedOn } from '../../utils';
import type { UserId, UserSync } from '../types';
import { getUserIdForId5 } from './id5';
import { getUserIdForLiveRamp } from './liveramp';
import { sharedId } from './shared';
import { getUserIdForTradeDesk } from './tradedesk';
import { getUserSyncSettings } from './index';

jest.mock('../../../identity/api');
jest.mock('../../utils');
jest.mock('./id5');
jest.mock('./liveramp');
jest.mock('./tradedesk');

const mockGetEmail = getEmail as jest.MockedFunction<typeof getEmail>;
const mockIsSwitchedOn = isSwitchedOn as jest.MockedFunction<
	typeof isSwitchedOn
>;
const mockGetUserIdForId5 = getUserIdForId5 as jest.MockedFunction<
	typeof getUserIdForId5
>;
const mockGetUserIdForLiveRamp = getUserIdForLiveRamp as jest.MockedFunction<
	typeof getUserIdForLiveRamp
>;
const mockGetUserIdForTradeDesk = getUserIdForTradeDesk as jest.MockedFunction<
	typeof getUserIdForTradeDesk
>;

const consentIds = {
	id5: '5ee15bc7b8e05c16366599cb',
	liveramp: '5eb559cfb8e05c2bbe33f3f3',
	theTradeDesk: '5e865b36b8e05c48537f60a7',
};

describe('getUserSyncSettings', () => {
	const mockConsentState = {
		canTarget: true,
		framework: 'tcfv2',
		tcfv2: {
			consents: {},
			eventStatus: 'tcloaded',
			addtlConsent: 'test',
			gdprApplies: true,
			tcString: 'test-tc-string',
			vendorConsents: {
				[consentIds.id5]: false,
				[consentIds.liveramp]: false,
				[consentIds.theTradeDesk]: false,
			},
		},
	};

	beforeEach(() => {
		jest.resetAllMocks();
		mockGetEmail.mockResolvedValue(null);
	});

	describe('when prebidUserSync is switched on', () => {
		beforeEach(() => {
			mockIsSwitchedOn.mockReturnValue(true);
		});

		it('should return userSync settings with sharedId when no consent is given for any provider', async () => {
			const noConsentState = {
				...mockConsentState,
				tcfv2: {
					...mockConsentState.tcfv2,
					consents: {},
				},
			} as ConsentState;

			const result = await getUserSyncSettings(noConsentState);

			expect(result).toEqual({
				syncsPerBidder: 0,
				userIds: [sharedId],
				filterSettings: {
					all: {
						bidders: '*',
						filter: 'include',
					},
				},
			});
		});

		it('should include id5 userId when consent is given for id5', async () => {
			const consentStateWithId5 = {
				...mockConsentState,
				tcfv2: {
					...mockConsentState.tcfv2,
					vendorConsents: {
						...mockConsentState.tcfv2.vendorConsents,
						[consentIds.id5]: true,
					},
				},
			} as ConsentState;

			const mockId5UserId: UserId = {
				name: 'id5',
				params: {
					partner: 123,
				},
				storage: {
					type: 'html5',
					name: 'id5id',
					expires: 90,
					refreshInSeconds: 8 * 3600,
				},
			};

			mockGetEmail.mockResolvedValue('test@example.com');
			mockGetUserIdForId5.mockResolvedValue(mockId5UserId);

			const result = (await getUserSyncSettings(
				consentStateWithId5,
			)) as Extract<UserSync, { userIds: UserId[] }>;

			expect(mockGetUserIdForId5).toHaveBeenCalledWith(
				'test@example.com',
			);
			expect(result.userIds).toContain(mockId5UserId);
			expect(result.userIds).toContain(sharedId);
		});

		it('should include liveramp userId when consent is given for liveramp', async () => {
			const consentStateWithLiveRamp = {
				...mockConsentState,
				tcfv2: {
					...mockConsentState.tcfv2,
					vendorConsents: {
						...mockConsentState.tcfv2.vendorConsents,
						[consentIds.liveramp]: true,
					},
				},
			} as ConsentState;

			const mockLiveRampUserId: UserId = {
				name: 'identityLink',
				params: {
					pid: 'test-pid',
				},
				storage: {
					type: 'cookie',
					name: 'idl_env',
					expires: 30,
				},
			};

			mockGetEmail.mockResolvedValue('test@example.com');
			mockGetUserIdForLiveRamp.mockResolvedValue(mockLiveRampUserId);

			const result = (await getUserSyncSettings(
				consentStateWithLiveRamp,
			)) as Extract<UserSync, { userIds: UserId[] }>;

			expect(mockGetUserIdForLiveRamp).toHaveBeenCalledWith(
				'test@example.com',
			);
			expect(result.userIds).toContain(mockLiveRampUserId);
			expect(result.userIds).toContain(sharedId);
		});

		it('should include theTradeDesk userId when consent is given for theTradeDesk', async () => {
			const consentStateWithTradeDesk = {
				...mockConsentState,
				tcfv2: {
					...mockConsentState.tcfv2,
					vendorConsents: {
						...mockConsentState.tcfv2.vendorConsents,
						[consentIds.theTradeDesk]: true,
					},
				},
			} as ConsentState;

			const mockTradeDeskUserId: UserId = {
				name: 'unifiedId',
				params: {
					partner: 'test-partner',
				},
				storage: {
					type: 'cookie',
					name: 'pbjs-unifiedid',
					expires: 60,
				},
			};

			mockGetEmail.mockResolvedValue('test@example.com');
			mockGetUserIdForTradeDesk.mockResolvedValue(mockTradeDeskUserId);

			const result = (await getUserSyncSettings(
				consentStateWithTradeDesk,
			)) as Extract<UserSync, { userIds: UserId[] }>;

			expect(mockGetUserIdForTradeDesk).toHaveBeenCalledWith(
				'test@example.com',
				consentStateWithTradeDesk,
			);
			expect(result.userIds).toContain(mockTradeDeskUserId);
			expect(result.userIds).toContain(sharedId);
		});

		it('should include all userIds when consent is given for all providers', async () => {
			const consentStateAll = {
				...mockConsentState,
				tcfv2: {
					...mockConsentState.tcfv2,
					vendorConsents: {
						[consentIds.id5]: true,
						[consentIds.liveramp]: true,
						[consentIds.theTradeDesk]: true,
					},
				},
			} as ConsentState;

			const mockId5UserId: UserId = { name: 'id5Id' };
			const mockLiveRampUserId: UserId = { name: 'identityLink' };
			const mockTradeDeskUserId: UserId = { name: 'unifiedId' };

			mockGetEmail.mockResolvedValue('test@example.com');
			mockGetUserIdForId5.mockResolvedValue(mockId5UserId);
			mockGetUserIdForLiveRamp.mockResolvedValue(mockLiveRampUserId);
			mockGetUserIdForTradeDesk.mockResolvedValue(mockTradeDeskUserId);

			const result = (await getUserSyncSettings(
				consentStateAll,
			)) as Extract<UserSync, { userIds: UserId[] }>;

			expect(result.userIds).toEqual([
				sharedId,
				mockId5UserId,
				mockLiveRampUserId,
				mockTradeDeskUserId,
			]);
		});

		it('should handle logged out users', async () => {
			const consentStateWithId5 = {
				...mockConsentState,
				tcfv2: {
					...mockConsentState.tcfv2,
					vendorConsents: {
						...mockConsentState.tcfv2.vendorConsents,
						[consentIds.id5]: true,
					},
				},
			} as ConsentState;

			mockGetEmail.mockResolvedValue(null);

			const result = (await getUserSyncSettings(
				consentStateWithId5,
			)) as Extract<UserSync, { userIds: UserId[] }>;

			expect(mockGetUserIdForId5).toHaveBeenCalledWith(null);
			expect(result.userIds).toEqual([sharedId]);
		});
	});

	describe('when prebidUserSync is switched off', () => {
		beforeEach(() => {
			mockIsSwitchedOn.mockReturnValue(false);
		});

		it('should return userSync disabled when isSwitchedOn returns false', async () => {
			const result = await getUserSyncSettings(
				mockConsentState as ConsentState,
			);

			expect(mockIsSwitchedOn).toHaveBeenCalledWith('prebidUserSync');
			expect(result).toEqual({
				syncEnabled: false,
			});
		});

		it('should return userSync disabled even when consent is given for all providers', async () => {
			const consentStateAll = {
				...mockConsentState,
				tcfv2: {
					...mockConsentState.tcfv2,
					vendorConsents: {
						[consentIds.id5]: true,
						[consentIds.liveramp]: true,
						[consentIds.theTradeDesk]: true,
					},
				},
			} as ConsentState;

			const result = await getUserSyncSettings(consentStateAll);
			expect(result).toEqual({
				syncEnabled: false,
			});
		});
	});
});
