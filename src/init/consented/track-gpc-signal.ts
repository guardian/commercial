import type { ConsentState } from '@guardian/libs';
import { log, onConsent } from '@guardian/libs';
import { initTrackGpcSignal } from 'core/track-gpc-signal';

/**
 * Initialise gpc signal tracking
 * @returns Promise
 */
export const init = async (): Promise<void> => {
	const consentState: ConsentState = await onConsent();

	if (consentState.canTarget) {
		initTrackGpcSignal(consentState);
		log('commercial', 'tracking gpc signal');
	} else {
		log('commercial', 'No consent to track gpc signal');
	}
};
