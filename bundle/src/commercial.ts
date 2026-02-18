import type { ConsentState } from '@guardian/libs';
import { getConsentFor, onConsent } from '@guardian/libs';
import { commercialFeatures } from './lib/commercial-features';
import { createCommercialQueue } from './lib/guardian-commercial-queue';

window.guardian.commercial ??= {};
window.guardian.commercial.queue = createCommercialQueue(
	Array.isArray(window.guardian.commercial.queue)
		? window.guardian.commercial.queue
		: [],
);

const shouldBootConsentless = (consentState: ConsentState) => {
	return (
		window.guardian.config.switches.optOutAdvertising &&
		consentState.tcfv2 &&
		!getConsentFor('googletag', consentState) &&
		!commercialFeatures.adFree
	);
};

/**
 * Choose whether to launch Googletag or Opt Out tag (ootag) based on consent state
 */
void (async () => {
	const consentState = await onConsent();
	// Only load the Opt Out tag if:
	// - Opt Out switch is on
	// - in TCF region
	// - no consent for Googletag
	// - the user is not a subscriber
	if (shouldBootConsentless(consentState)) {
		void import(
			/* webpackChunkName: "consentless-advertising" */
			'./init/consentless-advertising'
		).then(({ bootConsentless }) => bootConsentless(consentState));
	} else if (commercialFeatures.adFree) {
		void import(
			/* webpackChunkName: "ad-free" */
			'./init/ad-free'
		).then(({ bootCommercialWhenReady }) => bootCommercialWhenReady());
	} else {
		void import(
			/* webpackChunkName: "consented-advertising" */
			'./init/consented-advertising'
		).then(({ bootCommercialWhenReady }) => bootCommercialWhenReady());
	}
})();
