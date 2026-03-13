import { type ConsentState, getConsentFor } from '@guardian/libs';
import type { UserSyncConfig } from 'prebid.js/dist/src/userSync';
import { getEmail } from '../../../identity/api';
import { isSwitchedOn } from '../../utils';
import { getUserIdForId5 } from './id5';
import { getUserIdForLiveRamp } from './liveramp';
import { sharedId } from './shared';
import { getUserIdForTradeDesk } from './tradedesk';

export const getUserSyncSettings = async (
	consentState: ConsentState,
): Promise<UserSyncConfig> => {
	const userEmail = await getEmail();
	const fetchId5UserId =
		getConsentFor('id5', consentState) && getUserIdForId5(userEmail);
	const fetchLiveRampUserId =
		getConsentFor('liveramp', consentState) &&
		getUserIdForLiveRamp(userEmail);
	const fetchTradeDeskUserId =
		getConsentFor('theTradeDesk', consentState) &&
		getUserIdForTradeDesk(userEmail, consentState);

	// run all ID providers asynchronously

	// NOTE: rather than blocking the loading of downstream functions,
	// we could run Promise.all without the await then eventually run
	// window.pbjs.mergeConfig({
	// 	userIds ....
	// });
	const [id5UserId, liverampUserId, tradeDeskUserId] = await Promise.all([
		fetchId5UserId,
		fetchLiveRampUserId,
		fetchTradeDeskUserId,
	]);

	const userIds = [
		...(id5UserId ? [id5UserId] : []),
		...(Array.isArray(liverampUserId) ? liverampUserId : []), // liveramp returns an array of IDs
		...(tradeDeskUserId ? [tradeDeskUserId] : []),
	];

	const userSync: UserSyncConfig = isSwitchedOn('prebidUserSync')
		? {
				syncsPerBidder: 0, // allow all syncs
				userIds: [sharedId, ...userIds],
				filterSettings: {
					all: {
						bidders: '*' as const, // allow all bidders to sync by iframe or image beacons
						filter: 'include',
					},
				},
			}
		: { syncEnabled: false };

	return userSync;
};
