import { hashEmailForClient } from '@guardian/commercial-core';
import type { UserIdConfig } from 'prebid.js/dist/modules/userId/spec';

export const getUserIdForOzone = async (
	email: string | null,
): Promise<UserIdConfig<'pubProvidedId'> | undefined> => {
	if (email) {
		const hashedEmail = await hashEmailForClient(email, 'ozone');
		return {
			name: 'pubProvidedId',
			params: {
				eids: [
					{
						source: 'ozoneproject.com',
						uids: [
							{
								id: hashedEmail,
								atype: 3,
								ext: {
									stype: 'ppuid',
								},
							},
						],
					},
				],
			},
		};
	}
	return undefined;
};
