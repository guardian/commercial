import type { UserId } from '../types';

export const sharedId: UserId = {
	name: 'sharedId',
	storage: {
		type: 'cookie',
		name: '_pubcid',
		expires: 365,
	},
};
