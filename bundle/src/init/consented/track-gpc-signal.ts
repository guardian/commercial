import type { ConsentState } from '@guardian/consent-manager';
import { onConsent } from '@guardian/consent-manager';
import { log } from '@guardian/libs';
import { trackGpcSignal } from '../../lib/track-gpc-signal';

/**
 * Initialise gpc signal tracking
 * @returns Promise
 */
export const initTrackGpcSignal = async (): Promise<void> => {
	const consentState: ConsentState = await onConsent();

	if (consentState.canTarget) {
		trackGpcSignal(consentState);
		log('commercial', 'tracking gpc signal');
	} else {
		log('commercial', 'No consent to track gpc signal');
	}
};
