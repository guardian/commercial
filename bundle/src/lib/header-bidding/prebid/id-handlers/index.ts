import { type ConsentState, getConsentFor } from '@guardian/libs';
import { isSwitchedOn } from '../../utils';
import type { UserId, UserSync } from '../types';
import { getUserIdForId5 } from './id5';
import { sharedId } from './shared';
import { getUserIdForTradeDesk } from './tradedesk';

export const getUserSyncSettings = async (consentState: ConsentState) => {
	const userIds: UserId[] = [sharedId];

	if (getConsentFor('id5', consentState)) {
		const forId5 = await getUserIdForId5();
		userIds.push(forId5);
	}

	if (getConsentFor('theTradeDesk', consentState)) {
		const params = await getUserIdForTradeDesk(consentState);
		if (params) {
			userIds.push(params);
		}
	}

	const userSync: UserSync = isSwitchedOn('prebidUserSync')
		? {
				syncsPerBidder: 0, // allow all syncs
				filterSettings: {
					all: {
						bidders: '*', // allow all bidders to sync by iframe or image beacons
						filter: 'include',
					},
				},
				userIds,
			}
		: { syncEnabled: false };

	return userSync;
};
