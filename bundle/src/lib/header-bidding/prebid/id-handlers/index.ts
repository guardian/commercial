import { type ConsentState, getConsentFor } from '@guardian/libs';
import { getEmail } from '../../../identity/api';
import { isSwitchedOn } from '../../utils';
import type { UserId, UserSync } from '../types';
import { getUserIdForId5 } from './id5';
import { getUserIdForLiveRamp } from './liveramp';
import { sharedId } from './shared';
import { getUserIdForTradeDesk } from './tradedesk';

export const getUserSyncSettings = async (
	consentState: ConsentState,
): Promise<UserSync> => {
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
	const userIds: UserId[] = await Promise.all([
		fetchId5UserId,
		fetchLiveRampUserId,
		fetchTradeDeskUserId,
	]).then((idModules) => {
		const consentedIdModules = idModules.filter((idModule) => !!idModule);
		return consentedIdModules.flatMap((idModule) => {
			return Array.isArray(idModule) ? idModule : [idModule];
		});
	});

	const userSync: UserSync = isSwitchedOn('prebidUserSync')
		? {
				syncsPerBidder: 0, // allow all syncs
				userIds: [sharedId, ...userIds],
				filterSettings: {
					all: {
						bidders: '*', // allow all bidders to sync by iframe or image beacons
						filter: 'include',
					},
				},
			}
		: { syncEnabled: false };

	return userSync;
};
