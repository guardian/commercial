import { hashEmailForClient } from '@guardian/commercial-core';
import type { UserIdConfig } from 'prebid.js/dist/modules/userId/spec';
import { isUserInTestGroup } from '../../../../ab-testing';
import { isSwitchedOn } from '../../utils';

const OZONE_HEM_TEST_ID = 'commercial-ozone-hashed-email';

export const getUserIdForOzone = async (
	email: string | null,
): Promise<UserIdConfig<'pubProvidedId'> | undefined> => {
	const isInTest = isUserInTestGroup(OZONE_HEM_TEST_ID, 'variant');
	const isOzoneIdEnabled = isSwitchedOn('prebidOzoneId');

	if (email && isInTest && isOzoneIdEnabled) {
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
