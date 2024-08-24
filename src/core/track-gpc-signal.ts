import type { ConsentState } from '@guardian/libs';
import { log } from '@guardian/libs';
import { EventTimer } from './event-timer';

/**
 * Collect metrics on gpcSignal presence and value
 * https://globalprivacycontrol.github.io/gpc-spec/
 */
const initTrackGpcSignal = (consentState: ConsentState) => {
	// If undefined we set the property value to -1, false is 0, true is 1
	const gpcSignal =
		consentState.gpcSignal === undefined ? -1 : +consentState.gpcSignal;

	const eventTimer = EventTimer.get();

	log('commercial', `gpcSignal ${gpcSignal}`);

	eventTimer.setProperty('gpcSignal', gpcSignal);
};

export { initTrackGpcSignal };
