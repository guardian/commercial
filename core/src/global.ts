import type { CoreGuardian } from './types';

declare global {
	interface Window {
		guardian: CoreGuardian;
	}
}

export type { CoreGuardian };
