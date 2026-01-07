import { hashEmailForClient } from '@guardian/commercial-core';
import { isUserInTestGroup } from '../../../../experiments/beta-ab';
import { getEmail } from '../../../identity/api';
import type { UserId } from '../types';

export const getUserIdForId5 = async (): Promise<UserId> => {
	const id5UserId = {
		name: 'id5Id',
		params: {
			partner: 182,
			// ID5 recommend specifying this to ensure use of the most recent module version
			// https://wiki.id5.io/docs/id5-prebid-user-id-module
			externalModuleUrl:
				'https://cdn.id5-sync.com/api/1.0/id5PrebidModule.js',
		},
		storage: {
			type: 'html5',
			name: 'id5id',
			expires: 90,
			refreshInSeconds: 7200,
		},
	} as const;

	const email = await getEmail();
	if (email && !isUserInTestGroup('commercial-user-module-ID5', 'variant')) {
		const hashedEmail = await hashEmailForClient(email, 'id5');
		const pdRaw = new URLSearchParams([['1', hashedEmail]]).toString();
		const pdString = btoa(pdRaw);
		return {
			...id5UserId,
			params: {
				...id5UserId.params,
				pd: pdString,
			},
		};
	}
	return id5UserId;
};
