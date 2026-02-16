import type { CoreGuardian } from './types';

declare global {
	interface Window {
		guardian: CoreGuardian;

		// this is a stub, just the parts of the googletag API that we use in core
		googletag: {
			getConfig?: <Key extends string>(
				key: Key,
			) => Key extends 'targeting'
				? { targeting: Record<string, string | string[]> }
				: unknown;
			pubads: () => unknown;
		};
	}
}

export type { CoreGuardian };
