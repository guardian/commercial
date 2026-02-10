import type { CoreGuardian, NetworkInformation } from './types';

declare global {
	interface Navigator {
		readonly connection?: NetworkInformation;
	}

	interface Window {
		guardian: CoreGuardian;
	}
}

export type { CoreGuardian };
