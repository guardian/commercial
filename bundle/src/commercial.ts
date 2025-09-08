import type { ConsentState } from '@guardian/libs';
import { getConsentFor, onConsent } from '@guardian/libs';
import { commercialFeatures } from './lib/commercial-features';

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
	if (commercialFeatures.adFree) {
		void import(
			/* webpackChunkName: "ad-free" */
			'./init/ad-free'
		).then(({ bootAdFreeWhenReady }) => bootAdFreeWhenReady());
	} else if (shouldBootConsentless(consentState)) {
		// Only load the Opt Out tag if:
		// - Opt Out switch is on
		// - in TCF region
		// - no consent for Googletag
		// - the user is not a subscriber
		void import(
			/* webpackChunkName: "consentless-advertising" */
			'./init/consentless-advertising'
		).then(({ bootConsentless }) => bootConsentless(consentState));
	} else {
		void import(
			/* webpackChunkName: "consented-advertising" */
			'./init/consented-advertising'
		).then(({ bootCommercialWhenReady }) => bootCommercialWhenReady());
	}
})();
