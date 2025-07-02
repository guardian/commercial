import type { EventTimer } from './event-timer';
import type { NetworkInformation } from './types';

declare global {
	interface Navigator {
		readonly connection?: NetworkInformation;
		readonly cookieDeprecationLabel?: {
			getValue: () => Promise<string>;
		};
	}

	interface Window {
		guardian: {
			commercialTimer?: EventTimer;
		};
	}
}
