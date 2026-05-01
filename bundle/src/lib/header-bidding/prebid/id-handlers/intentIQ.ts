import type { UserIdConfig } from 'prebid.js/dist/modules/userId/spec';

export const getUserIdForIntentIQ = (): UserIdConfig<'intentIqId'> => {
	return {
		name: 'intentIqId',
		params: {
			partner: 377078111,
		},
		storage: {
			type: 'html5',
			name: 'intentIqId',
			expires: 0,
			refreshInSeconds: 0,
		},
	};
};
