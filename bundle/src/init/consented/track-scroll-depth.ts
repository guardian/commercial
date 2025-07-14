import { log, onConsent } from '@guardian/libs';
import { initTrackScrollDepth } from '../../lib/track-scroll-depth';

/**
 * Initialise scroll depth / velocity tracking if user has consented to relevant purposes.
 * @returns Promise
 */
export const init = async (): Promise<void> => {
	const state = await onConsent();
	if (
		// Purpose 8 - Measure content performance
		(state.framework == 'tcfv2' && !!state.tcfv2?.consents[8]) ||
		state.canTarget
	) {
		initTrackScrollDepth();
		log('commercial', 'tracking scroll depth');
	} else {
		log('commercial', 'No consent to track scroll depth');
	}
};
