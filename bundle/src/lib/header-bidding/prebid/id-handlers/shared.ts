import type { UserIdConfig } from 'prebid.js/dist/modules/userId/spec';

export const sharedId: UserIdConfig<'sharedId'> = {
	name: 'sharedId',
	storage: {
		type: 'cookie',
		name: '_pubcid',
		expires: 365,
	},
};
