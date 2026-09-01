import { type ConsentState } from '@guardian/consent-manager';
import type { UserIdConfig } from 'prebid.js/dist/modules/userId/spec';
import { getEmail } from '../../../identity/api';
import { getUserIdForId5 } from './id5';
import type { LiverampUserIdConfig } from './liveramp';
import { getUserIdForLiveRamp } from './liveramp';
import { sharedId } from './shared';
import type { TradeDeskUserIdConfig } from './tradedesk';
import { getUserIdForTradeDesk } from './tradedesk';
import { getUserSyncSettings } from './index';

jest.mock('../../../identity/api');
jest.mock('./id5');
jest.mock('./liveramp');
jest.mock('./tradedesk');

const mockGetEmail = getEmail as jest.MockedFunction<typeof getEmail>;
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
	} satisfies ConsentState;

	beforeEach(() => {
		jest.resetAllMocks();
		mockGetEmail.mockResolvedValue(null);
	});

	describe('when prebidUserSync is switched on', () => {
		beforeEach(() => {
			window.guardian.config.switches.prebidUserSync = true;
			window.guardian.config.switches.prebidId5 = true;
			window.guardian.config.switches.prebidLiveramp = true;
			window.guardian.config.switches.prebidTtdId = true;
			window.guardian.config.switches.prebidIntentIq = true;
			window.guardian.config.switches.prebidOzoneId = true;
		});

		it('should return userSync settings with sharedId when no consent is given for any provider', async () => {
			const noConsentState = {
				...mockConsentState,
				tcfv2: {
					...mockConsentState.tcfv2,
					consents: {},
				},
			};

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

		it('should return userSync settings with sharedId when feature switches are off for all providers', async () => {
			// General user sync switch ON
			window.guardian.config.switches.prebidUserSync = true;
			// Individual ID provider switches OFF
			window.guardian.config.switches.prebidId5 = false;
			window.guardian.config.switches.prebidLiveramp = false;
			window.guardian.config.switches.prebidTtdId = false;
			window.guardian.config.switches.prebidIntentIq = false;
			window.guardian.config.switches.prebidOzoneId = false;

			const result = await getUserSyncSettings({
				...mockConsentState,
				tcfv2: {
					...mockConsentState.tcfv2,
					vendorConsents: {
						[consentIds.id5]: true,
						[consentIds.liveramp]: true,
						[consentIds.theTradeDesk]: true,
					}
				},
			});

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
			};

			const mockId5UserId: UserIdConfig<'id5Id'> = {
				name: 'id5Id',
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

			const result = await getUserSyncSettings(consentStateWithId5);

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
			};

			const mockLiveRampUserId: LiverampUserIdConfig = [
				{
					name: 'identityLink',
					params: {
						pid: 'test-pid',
					},
					storage: {
						type: 'cookie',
						name: 'idl_env',
						expires: 30,
					},
				},
				{
					name: 'pairId',
				},
			];

			mockGetEmail.mockResolvedValue('test@example.com');
			mockGetUserIdForLiveRamp.mockResolvedValue(mockLiveRampUserId);

			const result = await getUserSyncSettings(consentStateWithLiveRamp);

			expect(mockGetUserIdForLiveRamp).toHaveBeenCalledWith(
				'test@example.com',
			);
			expect(result.userIds).toEqual(
				expect.arrayContaining(mockLiveRampUserId),
			);
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
			};

			const mockTradeDeskUserId: TradeDeskUserIdConfig = {
				name: 'uid2',
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

			const result = await getUserSyncSettings(consentStateWithTradeDesk);

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
			};

			const mockId5UserId: UserIdConfig<'id5Id'> = { name: 'id5Id' };
			const mockLiveRampUserId: LiverampUserIdConfig = [
				{
					name: 'identityLink',
				},
				{
					name: 'pairId',
				},
			];
			const mockTradeDeskUserId: TradeDeskUserIdConfig = { name: 'uid2' };

			mockGetEmail.mockResolvedValue('test@example.com');
			mockGetUserIdForId5.mockResolvedValue(mockId5UserId);
			mockGetUserIdForLiveRamp.mockResolvedValue(mockLiveRampUserId);
			mockGetUserIdForTradeDesk.mockResolvedValue(mockTradeDeskUserId);

			const result = await getUserSyncSettings(consentStateAll);

			expect(result.userIds).toEqual([
				sharedId,
				mockId5UserId,
				...mockLiveRampUserId,
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
			};

			mockGetEmail.mockResolvedValue(null);

			const result = await getUserSyncSettings(consentStateWithId5);

			expect(mockGetUserIdForId5).toHaveBeenCalledWith(null);
			expect(result.userIds).toEqual([sharedId]);
		});
	});

	describe('when prebidUserSync is switched off', () => {
		beforeEach(() => {
			window.guardian.config.switches.prebidUserSync = false;
		});

		it('should return userSync disabled when isSwitchedOn returns false', async () => {
			const result = await getUserSyncSettings(
				mockConsentState,
			);
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
			};

			const result = await getUserSyncSettings(consentStateAll);
			expect(result).toEqual({
				syncEnabled: false,
			});
		});
	});
});
