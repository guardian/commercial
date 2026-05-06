import { getLocale } from '@guardian/commercial-core/geo/get-locale';
import { type ConsentState, getConsentFor } from '@guardian/libs';
import type { UserSyncConfig } from 'prebid.js/dist/src/userSync';
import { isUserInTestGroup } from '../../../../ab-testing';
import { getEmail } from '../../../identity/api';
import { isSwitchedOn } from '../../utils';
import { getUserIdForId5 } from './id5';
import { getUserIdForIntentIQ } from './intent-iq';
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
	const fetchIntentIqUserId =
		getConsentFor('intentIQ', consentState) && getUserIdForIntentIQ();

	// run all ID providers asynchronously

	// NOTE: rather than blocking the loading of downstream functions,
	// we could run Promise.all without the await then eventually run
	// window.pbjs.mergeConfig({
	//  userIds ....
	// });
	const userIdModules = await Promise.all([
		fetchId5UserId,
		fetchLiveRampUserId,
		fetchTradeDeskUserId,
	]);

	const isUserInTestGroupIntentIQ = isUserInTestGroup(
		'commercial-user-module-intentIq',
		'variant',
	);

	//IntentIQ do not support every country, it's recommended if we cap them to the countries listed
	const intentIQRegions = [
		'US',
		'CA',
		'AU',
		'NZ',
		'JP',
		'SG',
		'TH',
		'PH',
		'MY',
		'KR',
		'MX',
		'BR',
		'GB',
		'IE',
		'ES',
		'FR',
		'DE',
	];
	const isUserInIntentRegion = intentIQRegions.includes(getLocale());
	const intentIqModule =
		isUserInTestGroupIntentIQ &&
		isUserInIntentRegion &&
		fetchIntentIqUserId;

	const userIds = [...userIdModules, intentIqModule]
		// typescript doesn't like flatMap here
		.map((idModule) => {
			if (Array.isArray(idModule)) {
				return idModule;
			} else if (idModule) {
				return [idModule];
			}
			return [];
		})
		.flat();

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
