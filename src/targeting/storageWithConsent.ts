import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { storage } from '@guardian/libs';

const getRaw = (key: string, state: ConsentState): string | null => {
	if (!state.tcfv2?.consents['1']) return null;
	if (state.ccpa?.doNotSell) return null;
	if (!state.aus?.personalisedAdvertising) return null;

	return storage.local.getRaw(key);
};

export const storageWithConsent = {
	getRaw,
};
