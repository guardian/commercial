import { type ConsentState, getConsentFor, log } from '@guardian/libs';
import { isUserInTestGroup } from '../../../../experiments/beta-ab';
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

	const isInTest = isUserInTestGroup(
		'commercial-loading-userids-async',
		'variant',
	);

	const buildUserSync = (userIds: UserId[]) => {
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

	const resolveUserIds = () =>
		Promise.all([
			fetchId5UserId,
			fetchLiveRampUserId,
			fetchTradeDeskUserId,
		]).then((idModules) => {
			const consentedIdModules = idModules.filter(
				(idModule) => !!idModule,
			);
			return consentedIdModules.flatMap((idModule) => {
				return Array.isArray(idModule) ? idModule : [idModule];
			});
		});

	// Test path: return immediately with sharedId, merge remaining IDs via mergeConfig when resolved
	// Default path: await all IDs before returning the full config
	if (isInTest) {
		resolveUserIds()
			.then((userIds) =>
				window.pbjs.mergeConfig({
					userSync: { userIds: [sharedId, ...userIds] },
				}),
			)
			.catch((error) =>
				log('commercial', '⚠️ Error merging UserIds', error),
			);
		return buildUserSync([]);
	}
	const userIds: UserId[] = await resolveUserIds();
	return buildUserSync(userIds);
};
