import { type ConsentState } from '@guardian/consent-manager';
import type { UserIdConfig } from 'prebid.js/dist/modules/userId/spec';
import { getEmail } from '../../../identity/api';
import { getUserIdForId5 } from './id5';
import { getUserIdForIntentIQ } from './intent-iq';
import { getUserIdForLiveRamp, type LiverampUserIdConfig } from './liveramp';
import { getUserIdForOzone } from './ozone';
import { sharedId } from './shared';
import { getUserIdForTradeDesk, type TradeDeskUserIdConfig } from './tradedesk';
import { getUserSyncSettings } from './index';

jest.mock('../../../identity/api');
jest.mock('./id5');
jest.mock('./liveramp');
jest.mock('./tradedesk');
jest.mock('./intent-iq');
jest.mock('./ozone');

const mockGetEmail = jest.mocked(getEmail);
const mockGetUserIdForId5 = jest.mocked(getUserIdForId5);
const mockGetUserIdForLiveRamp = jest.mocked(getUserIdForLiveRamp);
const mockGetUserIdForTradeDesk = jest.mocked(getUserIdForTradeDesk);
const mockGetUserIdForIntentIq = jest.mocked(getUserIdForIntentIQ);
const mockGetUserIdForOzone = jest.mocked(getUserIdForOzone);

const consentIds = {
	id5: '5ee15bc7b8e05c16366599cb',
	liveramp: '5eb559cfb8e05c2bbe33f3f3',
	theTradeDesk: '5e865b36b8e05c48537f60a7',
	intentIQ: '6690256f4f9aeedb88306507',
	ozone: '5e7ced57b8e05c5a7d171cd3',
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
				[consentIds.intentIQ]: false,
				[consentIds.ozone]: false,
			},
		},
	} satisfies ConsentState;

	beforeEach(() => {
		jest.resetAllMocks();
		mockGetEmail.mockResolvedValue(null);
		window.guardian.config.switches.prebidUserSync = true;
		window.guardian.config.switches.prebidId5 = true;
		window.guardian.config.switches.prebidLiveramp = true;
		window.guardian.config.switches.prebidTtdId = true;
		window.guardian.config.switches.prebidIntentIq = true;
		window.guardian.config.switches.prebidOzoneId = true;
	});

	describe('when prebidUserSync is switched on', () => {
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
					},
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

		describe('id5', () => {
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

			it('should include id5 userId when consent is given for id5 and the switch is turned on', async () => {
				mockGetEmail.mockResolvedValue('test@example.com');
				mockGetUserIdForId5.mockResolvedValue(mockId5UserId);

				const result = await getUserSyncSettings(consentStateWithId5);

				expect(mockGetUserIdForId5).toHaveBeenCalledWith(
					'test@example.com',
				);
				expect(result.userIds).toContain(mockId5UserId);
				expect(result.userIds).toContain(sharedId);
			});

			it('should omit id5 userId when consent is given for id5 but the switch is turned off', async () => {
				window.guardian.config.switches.prebidId5 = false;

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

				expect(mockGetUserIdForId5).not.toHaveBeenCalled();
				expect(result.userIds).not.toContain(mockId5UserId);
				expect(result.userIds).toContain(sharedId);
			});
		});

		describe('liveramp', () => {
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

			it('should include liveramp userId when consent is given for liveramp and the switch is on', async () => {
				mockGetEmail.mockResolvedValue('test@example.com');
				mockGetUserIdForLiveRamp.mockResolvedValue(mockLiveRampUserId);

				const result = await getUserSyncSettings(
					consentStateWithLiveRamp,
				);

				expect(mockGetUserIdForLiveRamp).toHaveBeenCalledWith(
					'test@example.com',
				);
				expect(result.userIds).toEqual(
					expect.arrayContaining(mockLiveRampUserId),
				);
				expect(result.userIds).toContain(sharedId);
			});

			it('should not include liveramp userId when consent is given for liveramp but the switch is off', async () => {
				window.guardian.config.switches.prebidLiveramp = false;
				mockGetEmail.mockResolvedValue('test@example.com');
				mockGetUserIdForLiveRamp.mockResolvedValue(mockLiveRampUserId);

				const result = await getUserSyncSettings(
					consentStateWithLiveRamp,
				);

				expect(mockGetUserIdForLiveRamp).not.toHaveBeenCalledWith(
					'test@example.com',
				);
				expect(result.userIds).not.toEqual(
					expect.arrayContaining(mockLiveRampUserId),
				);
				expect(result.userIds).toContain(sharedId);
			});
		});

		describe('the Trade Desk', () => {
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

			it('should include theTradeDesk userId when consent is given for theTradeDesk', async () => {
				mockGetEmail.mockResolvedValue('test@example.com');
				mockGetUserIdForTradeDesk.mockResolvedValue(
					mockTradeDeskUserId,
				);

				const result = await getUserSyncSettings(
					consentStateWithTradeDesk,
				);

				expect(mockGetUserIdForTradeDesk).toHaveBeenCalledWith(
					'test@example.com',
					consentStateWithTradeDesk,
				);
				expect(result.userIds).toContain(mockTradeDeskUserId);
				expect(result.userIds).toContain(sharedId);
			});

			it('should include theTradeDesk userId when consent is given for theTradeDesk but the switch is off', async () => {
				window.guardian.config.switches.prebidTtdId = false;
				mockGetEmail.mockResolvedValue('test@example.com');
				mockGetUserIdForTradeDesk.mockResolvedValue(
					mockTradeDeskUserId,
				);

				const result = await getUserSyncSettings(
					consentStateWithTradeDesk,
				);

				expect(mockGetUserIdForTradeDesk).not.toHaveBeenCalledWith(
					'test@example.com',
					consentStateWithTradeDesk,
				);
				expect(result.userIds).not.toContain(mockTradeDeskUserId);
				expect(result.userIds).toContain(sharedId);
			});
		});

		describe('IntentIQ', () => {
			const consentStateWithIntentIq = {
				...mockConsentState,
				tcfv2: {
					...mockConsentState.tcfv2,
					vendorConsents: {
						...mockConsentState.tcfv2.vendorConsents,
						[consentIds.intentIQ]: true,
					},
				},
			};

			const mockIntentIqUserId: UserIdConfig<'intentIqId'> = {
				name: 'intentIqId',
				params: {
					partner: 123456789,
				},
				storage: {
					type: 'html5',
					name: 'intentIqId',
					expires: 0,
					refreshInSeconds: 0,
				},
			};

			it('should include IntentIQ userId when consent is given for IntentIQ', async () => {
				mockGetUserIdForIntentIq.mockResolvedValue(mockIntentIqUserId);

				const result = await getUserSyncSettings(
					consentStateWithIntentIq,
				);
				expect(result.userIds).toContain(mockIntentIqUserId);
				expect(result.userIds).toContain(sharedId);
			});

			it('should include IntentIQ userId when consent is given for IntentIQ but the switch is off', async () => {
				window.guardian.config.switches.prebidIntentIq = false;
				mockGetUserIdForIntentIq.mockResolvedValue(mockIntentIqUserId);

				const result = await getUserSyncSettings(
					consentStateWithIntentIq,
				);
				expect(result.userIds).not.toContain(mockIntentIqUserId);
				expect(result.userIds).toContain(sharedId);
			});
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
						[consentIds.intentIQ]: true,
						[consentIds.ozone]: true,
					},
				},
			};

			const mockId5UserId: UserIdConfig<'id5Id'> = { name: 'id5Id' };
			const mockLiveRampUserId: LiverampUserIdConfig = [
				{ name: 'identityLink' },
				{ name: 'pairId' },
			];
			const mockTradeDeskUserId: TradeDeskUserIdConfig = { name: 'uid2' };
			const mockIntentIQUserId: UserIdConfig<'intentIqId'> = {
				name: 'intentIqId',
			};
			const mockOzoneUserId: UserIdConfig<'pubProvidedId'> = {
				name: 'pubProvidedId',
			};

			mockGetEmail.mockResolvedValue('test@example.com');
			mockGetUserIdForId5.mockResolvedValue(mockId5UserId);
			mockGetUserIdForLiveRamp.mockResolvedValue(mockLiveRampUserId);
			mockGetUserIdForTradeDesk.mockResolvedValue(mockTradeDeskUserId);
			mockGetUserIdForIntentIq.mockResolvedValue(mockIntentIQUserId);
			mockGetUserIdForOzone.mockResolvedValue(mockOzoneUserId);

			const result = await getUserSyncSettings(consentStateAll);

			expect(result.userIds).toEqual([
				sharedId,
				mockId5UserId,
				...mockLiveRampUserId,
				mockTradeDeskUserId,
				mockIntentIQUserId,
				mockOzoneUserId,
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

		it('should return userSync disabled when the switch is off', async () => {
			const result = await getUserSyncSettings(mockConsentState);
			expect(result).toEqual({ syncEnabled: false });
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

		it('should return userSync disabled even when consent given for all providers and all feature switches on', async () => {
			window.guardian.config.switches.prebidId5 = true;
			window.guardian.config.switches.prebidLiveramp = true;
			window.guardian.config.switches.prebidTtdId = true;
			window.guardian.config.switches.prebidIntentIq = true;
			window.guardian.config.switches.prebidOzoneId = true;

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
